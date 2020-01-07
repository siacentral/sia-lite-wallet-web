package modules

import (
	"bytes"
	"fmt"
	"math/big"
	"sort"

	"syscall/js"

	apiclient "github.com/siacentral/apisdkgo"
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
func SignTransaction(txn siatypes.Transaction, phrase string, requiredSignatures []uint64, callback js.Value) {
	w, err := recoverWallet(phrase)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	if err = w.SignTransaction(&txn, requiredSignatures); err != nil {
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

//GetTransactions gets all transactions belonging to the addresses
func GetTransactions(addresses []string, callback js.Value) {
	transactions := make(map[string]apitypes.WalletTransaction)
	ownedAddresses := make(map[string]bool)
	count := len(addresses)
	resp := transactionResp{}

	for _, addr := range addresses {
		ownedAddresses[addr] = true
	}

	for i := 0; i < count; i += 5e3 {
		end := i + 5e3

		if end > count {
			end = count
		}

		callResp, err := apiclient.FindAddressBalance(500, 0, addresses[i:end])

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		resp.ConfirmedBalance = resp.ConfirmedBalance.Add(callResp.Unspent)
		resp.UnspentOutputs = append(resp.UnspentOutputs, callResp.UnspentOutputs...)

		for _, txn := range callResp.Transactions {
			if len(txn.TransactionID) == 0 {
				if len(txn.SiacoinOutputs) == 0 {
					continue
				}

				txn.TransactionID = fmt.Sprintf("nontxn-%s", txn.SiacoinOutputs[0].OutputID)
			}

			transactions[txn.TransactionID] = txn
		}

		unconfirmedDelta := new(big.Int)

		for _, txn := range callResp.UnconfirmedTransactions {
			for _, output := range txn.SiacoinOutputs {
				if _, exists := ownedAddresses[output.UnlockHash]; !exists {
					continue
				}

				unconfirmedDelta.Add(unconfirmedDelta, output.Value.Big())
			}

			for _, input := range txn.SiacoinInputs {
				if _, exists := ownedAddresses[input.UnlockHash]; !exists {
					continue
				}

				unconfirmedDelta.Sub(unconfirmedDelta, input.Value.Big())
				resp.UnconfirmedSpent = append(resp.UnconfirmedSpent, input.OutputID)
			}

			transactions[txn.TransactionID] = txn
		}

		resp.UnconfirmedDelta = unconfirmedDelta.String()
	}

	for _, txn := range transactions {
		var ownedInput, ownedOutput siatypes.Currency
		var ownedInputsCount, ownedOutputsCount int

		processed := processedTransaction{
			TransactionID:     txn.TransactionID,
			BlockHeight:       txn.BlockHeight,
			Confirmations:     txn.Confirmations,
			Timestamp:         txn.Timestamp,
			Tags:              txn.Tags,
			Fees:              txn.Fees,
			StorageProofs:     txn.StorageProofs,
			HostAnnouncements: txn.HostAnnouncements,
			Contracts:         make([]processedContract, len(txn.Contracts)),
			ContractRevisions: make([]processedContract, len(txn.ContractRevisions)),
		}

		for i, contract := range txn.Contracts {
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
				ValidProofOutputs:      make([]processedOutput, len(contract.ValidProofOutputs)),
				MissedProofOutputs:     make([]processedOutput, len(contract.MissedProofOutputs)),
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
				ValidProofOutputs:      make([]processedOutput, len(contract.ValidProofOutputs)),
				MissedProofOutputs:     make([]processedOutput, len(contract.MissedProofOutputs)),
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

		for _, txnSiacoinInput := range txn.SiacoinInputs {
			procSiacoinInput := processedInput{
				SiacoinInput: txnSiacoinInput,
			}

			if _, exists := ownedAddresses[txnSiacoinInput.UnlockHash]; exists {
				procSiacoinInput.Owned = true
				ownedInput = ownedInput.Add(txnSiacoinInput.Value)
				ownedInputsCount++
			}

			processed.SiacoinInputs = append(processed.SiacoinInputs, procSiacoinInput)
		}

		for _, txnSiacoinOutput := range txn.SiacoinOutputs {
			procSiacoinOutput := processedOutput{
				SiacoinOutput: txnSiacoinOutput,
			}

			if _, exists := ownedAddresses[txnSiacoinOutput.UnlockHash]; exists {
				procSiacoinOutput.Owned = true
				ownedOutput = ownedOutput.Add(txnSiacoinOutput.Value)
				ownedOutputsCount++
			}

			processed.SiacoinOutputs = append(processed.SiacoinOutputs, procSiacoinOutput)
		}

		if len(txn.SiacoinInputs) == ownedInputsCount && len(txn.SiacoinOutputs) == ownedOutputsCount {
			processed.Tags = append(processed.Tags, "defrag")
		}

		if ownedOutput.Cmp(ownedInput) == 1 {
			processed.Direction = "received"
			processed.Value = ownedOutput.Sub(ownedInput)
		} else {
			processed.Direction = "sent"
			processed.Value = ownedInput.Sub(ownedOutput)
		}

		if processed.Value.Cmp64(0) == 0 {
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
