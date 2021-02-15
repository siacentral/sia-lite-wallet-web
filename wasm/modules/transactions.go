package modules

import (
	"bytes"
	"fmt"
	"math/big"
	"sort"

	"syscall/js"

	apitypes "github.com/siacentral/apisdkgo/types"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

//EncodeTransaction uses the MarshalSia function to encode the transaction to bytes
func EncodeTransaction(txn siatypes.Transaction, callback js.Value) {
	buf := new(bytes.Buffer)

	txn.MarshalSia(buf)

	data := buf.Bytes()
	value := make([]interface{}, len(data))

	for i, b := range data {
		value[i] = b
	}

	callback.Invoke(js.Null(), value)
}

//SignTransaction signs a transaction using the seed and required signatures
func SignTransaction(txn siatypes.Transaction, phrase, currency string, requiredSignatures []uint64, callback js.Value) {
	w, err := recoverWallet(phrase, currency)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	if err := w.SignTransaction(&txn, requiredSignatures); err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	data, err := interfaceToJSON(txn)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), data)
}

//SignTransactions signs a list of transaction using the seed and required signatures returns an error if any of the transactions cannot be signed
func SignTransactions(transactions []UnsignedTransaction, phrase, currency string, callback js.Value) {
	w, err := recoverWallet(phrase, currency)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	signed := make([]interface{}, len(transactions))

	for i, unsigned := range transactions {
		txn := unsigned.Transaction

		if err = w.SignTransaction(&txn, unsigned.RequiredSigs); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		data, err := interfaceToJSON(txn)
		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		signed[i] = data
	}

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), signed)
}

//GetTransactions gets the last 500 transactions belonging to each address
func GetTransactions(addresses []string, currency string, callback js.Value) {
	transactions := make(map[string]apitypes.Transaction)
	ownedAddresses := make(map[string]bool)
	count := len(addresses)
	resp := transactionResp{}

	for _, addr := range addresses {
		ownedAddresses[addr] = true
	}

	for i := 0; i < count; i += 1e3 {
		end := i + 1e3

		if end > count {
			end = count
		}

		apiclient := siacentralAPIClient(currency)
		callResp, err := apiclient.FindAddressBalance(500, 0, addresses[i:end])

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		resp.ConfirmedSiacoinBalance = resp.ConfirmedSiacoinBalance.Add(callResp.UnspentSiacoins)
		resp.ConfirmedSiafundBalance = resp.ConfirmedSiafundBalance.Add(callResp.UnspentSiafunds)
		resp.UnspentSiacoinOutputs = append(resp.UnspentSiacoinOutputs, callResp.UnspentSiacoinOutputs...)
		resp.UnspentSiafundOutputs = append(resp.UnspentSiafundOutputs, callResp.UnspentSiafundOutputs...)

		unconfirmedSiacoinDelta := new(big.Int)
		unconfirmedSiafundDelta := new(big.Int)

		for _, txn := range callResp.Transactions {
			if len(txn.ID) == 0 {
				if len(txn.SiacoinOutputs) == 0 {
					continue
				}

				txn.ID = fmt.Sprintf("nontxn-%s", txn.SiacoinOutputs[0].OutputID)
			}

			transactions[txn.ID] = txn
		}

		for _, txn := range callResp.UnconfirmedTransactions {
			for _, output := range txn.SiacoinOutputs {
				if _, exists := ownedAddresses[output.UnlockHash]; !exists {
					continue
				}

				unconfirmedSiacoinDelta.Add(unconfirmedSiacoinDelta, output.Value.Big())
			}

			for _, input := range txn.SiacoinInputs {
				if _, exists := ownedAddresses[input.UnlockHash]; !exists {
					continue
				}

				unconfirmedSiacoinDelta.Sub(unconfirmedSiacoinDelta, input.Value.Big())
				resp.SpentSiacoinOutputs = append(resp.SpentSiacoinOutputs, input.OutputID)
			}

			for _, output := range txn.SiafundOutputs {
				if _, exists := ownedAddresses[output.UnlockHash]; !exists {
					continue
				}

				unconfirmedSiafundDelta.Add(unconfirmedSiafundDelta, output.Value.Big())
			}

			for _, input := range txn.SiafundInputs {
				if _, exists := ownedAddresses[input.UnlockHash]; !exists {
					continue
				}

				unconfirmedSiafundDelta.Sub(unconfirmedSiacoinDelta, input.Value.Big())
				resp.SpentSiafundOutputs = append(resp.SpentSiafundOutputs, input.OutputID)
			}

			transactions[txn.ID] = txn
		}

		resp.UnconfirmedSiacoinDelta = unconfirmedSiacoinDelta.String()
		resp.UnconfirmedSiafundDelta = unconfirmedSiafundDelta.String()
	}

	for _, txn := range transactions {
		var ownedSiacoinInput, ownedSiacoinOutput siatypes.Currency
		var ownedSiafundInput, ownedSiafundOutput siatypes.Currency
		var ownedSiacoinInputsCount, ownedSiacoinOutputsCount int
		var ownedSiafundInputsCount, ownedSiafundOutputsCount int

		processed := processedTransaction{
			TransactionID:     txn.ID,
			BlockHeight:       txn.BlockHeight,
			Confirmations:     txn.Confirmations,
			Timestamp:         txn.Timestamp,
			Fees:              txn.Fees,
			StorageProofs:     txn.StorageProofs,
			HostAnnouncements: txn.HostAnnouncements,
			Contracts:         make([]processedContract, len(txn.StorageContracts)),
			ContractRevisions: make([]processedContract, len(txn.ContractRevisions)),
		}

		for i, contract := range txn.StorageContracts {
			procContract := processedContract{
				ID:                     contract.ID,
				BlockID:                contract.BlockID,
				TransactionID:          contract.TransactionID,
				MerkleRoot:             contract.MerkleRoot,
				UnlockHash:             contract.UnlockHash,
				Status:                 contract.Status,
				RevisionNumber:         contract.RevisionNumber,
				NegotiationHeight:      contract.NegotiationHeight,
				ExpirationHeight:       contract.ExpirationHeight,
				ProofDeadline:          contract.ProofDeadline,
				ProofHeight:            contract.ProofHeight,
				Payout:                 contract.Payout,
				FileSize:               contract.FileSize,
				ValidProofOutputs:      make([]processedSiacoinOutput, len(contract.ValidProofOutputs)),
				MissedProofOutputs:     make([]processedSiacoinOutput, len(contract.MissedProofOutputs)),
				NegotiationTimestamp:   contract.NegotiationTimestamp,
				ExpirationTimestamp:    contract.ExpirationTimestamp,
				ProofDeadlineTimestamp: contract.ProofDeadlineTimestamp,
				ProofTimestamp:         contract.ProofTimestamp,
				ProofConfirmed:         contract.ProofConfirmed,
				Unused:                 contract.Unused,
			}

			for j, output := range contract.ValidProofOutputs {
				_, exists := ownedAddresses[output.UnlockHash]
				procContract.ValidProofOutputs[j].SiacoinOutput = output
				procContract.ValidProofOutputs[j].Owned = exists
			}

			for j, output := range contract.MissedProofOutputs {
				_, exists := ownedAddresses[output.UnlockHash]
				procContract.MissedProofOutputs[j].SiacoinOutput = output
				procContract.MissedProofOutputs[j].Owned = exists
			}

			processed.Contracts[i] = procContract
		}

		for i, contract := range txn.ContractRevisions {
			procContract := processedContract{
				ID:                     contract.ID,
				BlockID:                contract.BlockID,
				TransactionID:          contract.TransactionID,
				MerkleRoot:             contract.MerkleRoot,
				UnlockHash:             contract.UnlockHash,
				Status:                 contract.Status,
				RevisionNumber:         contract.RevisionNumber,
				NegotiationHeight:      contract.NegotiationHeight,
				ExpirationHeight:       contract.ExpirationHeight,
				ProofDeadline:          contract.ProofDeadline,
				ProofHeight:            contract.ProofHeight,
				Payout:                 contract.Payout,
				FileSize:               contract.FileSize,
				ValidProofOutputs:      make([]processedSiacoinOutput, len(contract.ValidProofOutputs)),
				MissedProofOutputs:     make([]processedSiacoinOutput, len(contract.MissedProofOutputs)),
				NegotiationTimestamp:   contract.NegotiationTimestamp,
				ExpirationTimestamp:    contract.ExpirationTimestamp,
				ProofDeadlineTimestamp: contract.ProofDeadlineTimestamp,
				ProofTimestamp:         contract.ProofTimestamp,
				ProofConfirmed:         contract.ProofConfirmed,
				Unused:                 contract.Unused,
			}

			for j, output := range contract.ValidProofOutputs {
				_, exists := ownedAddresses[output.UnlockHash]
				procContract.ValidProofOutputs[j].SiacoinOutput = output
				procContract.ValidProofOutputs[j].Owned = exists
			}

			for j, output := range contract.MissedProofOutputs {
				_, exists := ownedAddresses[output.UnlockHash]
				procContract.MissedProofOutputs[j].SiacoinOutput = output
				procContract.MissedProofOutputs[j].Owned = exists
			}

			processed.ContractRevisions[i] = procContract
		}

		for _, txnSiafundInput := range txn.SiafundInputs {
			procSiafundInput := processedSiafundInput{
				SiafundInput: txnSiafundInput,
			}

			if _, exists := ownedAddresses[txnSiafundInput.UnlockHash]; exists {
				procSiafundInput.Owned = true
				ownedSiafundInput = ownedSiafundInput.Add(txnSiafundInput.Value)
				ownedSiafundInputsCount++
			}

			processed.SiafundInputs = append(processed.SiafundInputs, procSiafundInput)
		}

		for _, txnSiafundOutput := range txn.SiafundOutputs {
			procSiafundOutput := processedSiafundOutput{
				SiafundOutput: txnSiafundOutput,
			}

			if _, exists := ownedAddresses[txnSiafundOutput.UnlockHash]; exists {
				procSiafundOutput.Owned = true
				ownedSiafundOutput = ownedSiafundOutput.Add(txnSiafundOutput.Value)
				ownedSiafundOutputsCount++
			}

			processed.SiafundOutputs = append(processed.SiafundOutputs, procSiafundOutput)
		}

		for _, txnSiacoinInput := range txn.SiacoinInputs {
			procSiacoinInput := processedSiacoinInput{
				SiacoinInput: txnSiacoinInput,
			}

			if _, exists := ownedAddresses[txnSiacoinInput.UnlockHash]; exists {
				procSiacoinInput.Owned = true
				ownedSiacoinInput = ownedSiacoinInput.Add(txnSiacoinInput.Value)
				ownedSiacoinInputsCount++
			}

			processed.SiacoinInputs = append(processed.SiacoinInputs, procSiacoinInput)
		}

		for _, txnSiacoinOutput := range txn.SiacoinOutputs {
			procSiacoinOutput := processedSiacoinOutput{
				SiacoinOutput: txnSiacoinOutput,
			}

			if _, exists := ownedAddresses[txnSiacoinOutput.UnlockHash]; exists {
				procSiacoinOutput.Owned = true
				ownedSiacoinOutput = ownedSiacoinOutput.Add(txnSiacoinOutput.Value)
				ownedSiacoinOutputsCount++
			}

			processed.SiacoinOutputs = append(processed.SiacoinOutputs, procSiacoinOutput)
		}

		if len(txn.SiacoinOutputs) != 0 && len(txn.SiacoinInputs) != 0 && len(txn.SiacoinInputs) == ownedSiacoinInputsCount && len(txn.SiacoinOutputs) == ownedSiacoinOutputsCount {
			processed.Tags = append(processed.Tags, "defrag")
		}

		if len(txn.SiafundOutputs) != 0 && len(txn.SiafundInputs) != 0 && len(txn.SiafundInputs) == ownedSiafundInputsCount && len(txn.SiafundOutputs) == ownedSiafundOutputsCount {
			processed.Tags = append(processed.Tags, "defrag")
		}

		if len(txn.SiacoinInputs) == 0 && len(txn.SiacoinOutputs) != 0 {
			processed.Tags = append(processed.Tags, txn.SiacoinOutputs[0].Source)
		}

		if len(txn.StorageProofs) != 0 {
			processed.Tags = append(processed.Tags, "storage_proof")
		}

		if len(txn.StorageContracts) != 0 && len(txn.ContractRevisions) != 0 {
			processed.Tags = append(processed.Tags, "contract_renewal")
		}

		if len(txn.StorageContracts) != 0 {
			processed.Tags = append(processed.Tags, "contract_formation")
		}

		if len(txn.ContractRevisions) != 0 {
			processed.Tags = append(processed.Tags, "contract_revision")
		}

		if len(txn.HostAnnouncements) != 0 {
			processed.Tags = append(processed.Tags, "host_announcement")
		}

		if len(txn.SiafundInputs) != 0 && len(txn.SiafundOutputs) != 0 {
			processed.Tags = append(processed.Tags, "siafund_transaction")
		}

		if len(txn.SiacoinInputs) != 0 && len(txn.SiacoinOutputs) != 0 {
			processed.Tags = append(processed.Tags, "siacoin_transaction")
		}

		if ownedSiacoinOutput.Cmp(ownedSiacoinInput) == -1 {
			processed.SiacoinValue.Direction = "sent"
			processed.SiacoinValue.Value = ownedSiacoinInput.Sub(ownedSiacoinOutput)
		} else {
			processed.SiacoinValue.Direction = "received"
			processed.SiacoinValue.Value = ownedSiacoinOutput.Sub(ownedSiacoinInput)
		}

		if ownedSiafundOutput.Cmp(ownedSiafundInput) == 1 {
			processed.SiafundValue.Direction = "received"
			processed.SiafundValue.Value = ownedSiafundOutput.Sub(ownedSiafundInput)
		} else {
			processed.SiafundValue.Direction = "sent"
			processed.SiafundValue.Value = ownedSiafundInput.Sub(ownedSiafundOutput)
		}

		if processed.SiacoinValue.Value.Cmp64(0) == 0 && processed.SiafundValue.Value.Cmp64(0) == 0 {
			continue
		}

		resp.Transactions = append(resp.Transactions, processed)
	}

	sort.Slice(resp.Transactions, func(i, j int) bool {
		return resp.Transactions[i].Timestamp.After(resp.Transactions[j].Timestamp)
	})

	obj, err := interfaceToJSON(resp)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), obj)
}
