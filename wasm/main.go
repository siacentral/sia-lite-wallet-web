package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/big"
	"sort"
	"time"

	"syscall/js"

	apiclient "github.com/siacentral/apisdkgo"
	apitypes "github.com/siacentral/apisdkgo/types"
	"github.com/siacentral/sia-lite/wasm/wallet"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

type (
	//StorageContract a storage contract on the blockchain
	processedContract struct {
		ID                     string            `json:"id"`
		BlockID                string            `json:"block_id"`
		TransactionID          string            `json:"transaction_id"`
		MerkleRoot             string            `json:"merkle_root"`
		UnlockHash             string            `json:"unlock_hash"`
		Status                 string            `json:"status"`
		RevisionNumber         uint64            `json:"revision_number"`
		NegotiationHeight      uint64            `json:"negotiation_height"`
		ExpirationHeight       uint64            `json:"expiration_height"`
		ProofDeadline          uint64            `json:"proof_deadline"`
		ProofHeight            uint64            `json:"proof_height"`
		Payout                 siatypes.Currency `json:"payout"`
		FileSize               siatypes.Currency `json:"file_size"`
		ValidProofOutputs      []processedOutput `json:"valid_proof_outputs"`
		MissedProofOutputs     []processedOutput `json:"missed_proof_outputs"`
		NegotiationTimestamp   time.Time         `json:"negotiation_timestamp"`
		ExpirationTimestamp    time.Time         `json:"expiration_timestamp"`
		ProofDeadlineTimestamp time.Time         `json:"proof_deadline_timestamp"`
		ProofTimestamp         time.Time         `json:"proof_timestamp"`
		ProofConfirmed         bool              `json:"proof_confirmed"`
		Unused                 bool              `json:"unused"`
	}

	processedTransaction struct {
		TransactionID     string                  `json:"transaction_id"`
		Direction         string                  `json:"direction"`
		BlockHeight       uint64                  `json:"block_height"`
		Confirmations     uint64                  `json:"confirmations"`
		Fees              siatypes.Currency       `json:"fees"`
		Value             siatypes.Currency       `json:"value"`
		Timestamp         time.Time               `json:"timestamp"`
		Tags              []string                `json:"tags"`
		SiacoinInputs     []processedInput        `json:"siacoin_inputs"`
		SiacoinOutputs    []processedOutput       `json:"siacoin_outputs"`
		Contracts         []processedContract     `json:"contracts"`
		ContractRevisions []processedContract     `json:"contract_revisions"`
		StorageProofs     []apitypes.StorageProof `json:"storage_proofs"`
		HostAnnouncements []apitypes.Announcement `json:"host_announcements"`
	}

	processedOutput struct {
		apitypes.SiacoinOutput
		Owned bool `json:"owned"`
	}

	processedInput struct {
		apitypes.SiacoinInput
		Owned bool `json:"owned"`
	}

	transactionResp struct {
		Transactions     []processedTransaction   `json:"transactions"`
		UnspentOutputs   []apitypes.SiacoinOutput `json:"unspent_outputs"`
		UnconfirmedSpent []string                 `json:"unconfirmed_spent"`
		ConfirmedBalance siatypes.Currency        `json:"confirmed_balance"`
		UnconfirmedDelta string                   `json:"unconfirmed_delta"`
	}
)

func main() {
	js.Global().Set("sia", map[string]interface{}{
		"generateSeed":      js.FuncOf(generateSeed),
		"generateAddresses": js.FuncOf(generateAddresses),
		"recoverAddresses":  js.FuncOf(recoverAddresses),
		"getTransactions":   js.FuncOf(getTransactions),
		"encodeTransaction": js.FuncOf(encodeTransaction),
		"signTransaction":   js.FuncOf(signTransaction),
		"encodeUnlockHash":  js.FuncOf(encodeUnlockHash),
	})

	c := make(chan bool, 1)

	<-c
}

func interfaceToJSON(obj interface{}) (con map[string]interface{}, err error) {
	buf, err := json.Marshal(obj)

	if err != nil {
		return
	}

	err = json.Unmarshal(buf, &con)

	return
}

func checkArgs(args []js.Value, argTypes ...js.Type) bool {
	if len(args) != len(argTypes) {
		return false
	}

	for i, arg := range args {
		if arg.Type() != argTypes[i] {
			return false
		}
	}

	return true
}

func encodeTransaction(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeString, js.TypeFunction) {
		return false
	}

	jsonTxn := args[0].String()
	callback := args[1]

	go func() {
		var txn siatypes.Transaction

		if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		buf := new(bytes.Buffer)

		txn.MarshalSia(buf)

		data := buf.Bytes()
		value := make([]interface{}, len(data))

		for i, b := range data {
			value[i] = b
		}

		callback.Invoke(js.Null(), value)
	}()

	return true
}

func signTransaction(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeString, js.TypeString, js.TypeObject, js.TypeFunction) {
		return false
	}

	phrase := args[0].String()
	jsonTxn := args[1].String()
	length := args[2].Length()
	callback := args[3]

	go func() {
		var txn siatypes.Transaction

		w, err := wallet.RecoverSeed(phrase)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		keys := make([]wallet.SpendableKey, length)

		for i := 0; i < length; i++ {
			index := uint64(args[2].Index(i).Int())
			keys[i] = w.GetAddress(index)
		}

		signed, err := w.SignTransaction(txn, keys)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		data, err := interfaceToJSON(signed)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), data)
	}()

	return true
}

func encodeUnlockHash(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeString, js.TypeFunction) {
		return false
	}

	jsonUnlockConds := args[0].String()
	callback := args[1]

	go func() {
		var unlockConds siatypes.UnlockConditions

		if err := json.Unmarshal([]byte(jsonUnlockConds), &unlockConds); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), unlockConds.UnlockHash().String())
	}()

	return true
}

func generateSeed(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeFunction) {
		return false
	}

	callback := args[0]

	go func() {
		seed := wallet.NewSeed()
		phrase, err := seed.RecoveryPhrase()

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), phrase)
	}()

	return true
}

func generateAddresses(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeFunction) {
		return false
	}

	phrase := args[0].String()
	i := args[1].Int()
	n := args[2].Int()
	callback := args[3]

	go func() {
		w, err := wallet.RecoverSeed(phrase)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		keys := make([]wallet.SpendableKey, n)
		addresses := make([]interface{}, n)

		w.GetAddresses(uint64(i), keys)

		for a, key := range keys {
			addresses[a] = map[string]interface{}{
				"address": key.UnlockConditions.UnlockHash().String(),
				"index":   a + i,
			}
		}

		callback.Invoke(js.Null(), addresses)
	}()

	return true
}

func mapUnlockConditions(sia siatypes.UnlockConditions) (unlockConds wallet.UnlockConditions) {
	unlockConds = wallet.UnlockConditions{
		Timelock:           uint64(sia.Timelock),
		SignaturesRequired: sia.SignaturesRequired,
	}

	for _, pubkey := range sia.PublicKeys {
		unlockConds.PublicKeys = append(unlockConds.PublicKeys, pubkey.String())
	}

	return
}

/*
 * Scans for addresses on the blockchain 5,000 at a time up to a maximum of 100,000,000
 * addresses. Considers all addresses found if the scan goes more than minRounds * 5,000
 * addresses without seeing any used. It's possible the ranges will need to be tweaked for older or
 * larger wallets
 */
func recoverAddresses(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeFunction) {
		return false
	}

	seed := args[0].String()
	i := uint64(args[1].Int())
	minRounds := uint64(args[2].Int())
	callback := args[3]

	go func() {
		const addressCount = 5e3
		var lastUsed, maxIndex uint64
		var lastUsedType string

		w, err := wallet.RecoverSeed(seed)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		keys := make([]wallet.SpendableKey, addressCount)
		addresses := make([]string, addressCount)

		for ; i < 1e7; i += addressCount {
			if lastUsed >= minRounds {
				break
			}

			w.GetAddresses(i, keys)
			indexMap := make(map[string]uint64)
			unlockMap := make(map[string]wallet.UnlockConditions)

			for j, key := range keys {
				addresses[j] = key.UnlockConditions.UnlockHash().String()
				unlockMap[addresses[j]] = mapUnlockConditions(key.UnlockConditions)
				indexMap[addresses[j]] = i + uint64(j)
			}

			used, err := apiclient.FindUsedAddresses(addresses)

			if err != nil {
				callback.Invoke(err.Error(), js.Null())
				return
			}

			if len(used) == 0 {
				lastUsed++
			}

			foundAddresses := []interface{}{}

			for _, addr := range used {
				if indexMap[addr.Address] > maxIndex {
					maxIndex = indexMap[addr.Address]
					lastUsedType = addr.UsageType
				}

				foundAddresses = append(foundAddresses, map[string]interface{}{
					"index":             indexMap[addr.Address],
					"unlock_conditions": unlockMap[addr.Address],
					"address":           addr.Address,
					"usage_type":        addr.UsageType,
				})
			}

			data, err := interfaceToJSON(map[string]interface{}{
				"found":     len(foundAddresses),
				"addresses": foundAddresses,
				"index":     maxIndex,
				"done":      false,
			})

			if err != nil {
				callback.Invoke(err.Error(), js.Null())
				return
			}

			callback.Invoke(js.Null(), data)
		}

		additional := []map[string]interface{}{}

		if lastUsedType == "sent" {
			maxIndex++

			key := w.GetAddress(maxIndex)

			additional = append(additional, map[string]interface{}{
				"index":             maxIndex,
				"unlock_conditions": mapUnlockConditions(key.UnlockConditions),
				"address":           key.UnlockConditions.UnlockHash().String(),
				"usage_type":        "none",
			})
		}

		data, err := interfaceToJSON(map[string]interface{}{
			"addresses": additional,
			"index":     maxIndex,
			"done":      true,
		})

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), data)
	}()

	return true
}

func getTransactions(this js.Value, args []js.Value) interface{} {
	if !checkArgs(args, js.TypeObject, js.TypeFunction) {
		return false
	}

	count := args[0].Length()
	callback := args[1]

	go func() {
		ownedAddresses := make(map[string]bool)
		transactions := make(map[string]apitypes.WalletTransaction)
		addresses := make([]string, count)
		resp := transactionResp{}

		for i := 0; i < count; i++ {
			addresses[i] = args[0].Index(i).String()
			ownedAddresses[addresses[i]] = true
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
	}()

	return true
}
