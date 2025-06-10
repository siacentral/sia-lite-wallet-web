package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"
	"syscall/js"
	"time"

	"github.com/siacentral/sia-lite-wallet-web/wasm/build"
	"github.com/siacentral/sia-lite-wallet-web/wasm/internal/siad"
	"go.sia.tech/core/types"
	"go.sia.tech/coreutils/chain"
	"go.sia.tech/walletd/v2/api"
	"go.sia.tech/walletd/v2/wallet"
)

const SIASCAN_ADDRESS = "https://api.siascan.com/wallet"

func main() {
	log.Printf("starting sia wasm %s", build.Revision())
	js.Global().Set("sia", map[string]any{
		"build": map[string]any{
			"revision":  build.Revision(),
			"timestamp": build.Time().Format(time.UnixDate),
		},
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

func checkArgs(args []js.Value, argTypes ...js.Type) error {
	if len(args) != len(argTypes) {
		return fmt.Errorf("not enough arguments")
	}

	for i, arg := range args {
		if arg.Type() != argTypes[i] {
			return fmt.Errorf("incorrect argument %d expected %s got %s", i, argTypes[i], arg.Type())
		}
	}

	return nil
}

func interfaceToJSON(obj any) (con map[string]any, err error) {
	buf, err := json.Marshal(obj)

	if err != nil {
		return
	}

	err = json.Unmarshal(buf, &con)

	return
}

func encodeTransaction(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	jsonTxn := args[0].String()
	callback := args[1]

	var txn types.Transaction

	if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
		callback.Invoke(err.Error(), js.Null())
		return err.Error()
	}

	buf := bytes.NewBuffer(nil)
	enc := types.NewEncoder(buf)
	txn.EncodeTo(enc)
	if err := enc.Flush(); err != nil {
		callback.Invoke(fmt.Sprintf("error encoding transaction: %s", err), js.Null())
		return err.Error()
	}
	callback.Invoke(js.Null(), buf.Bytes())

	return nil
}

func signTransaction(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeString, js.TypeObject, js.TypeFunction); err != nil {
		return err.Error()
	}

	w := api.NewClient(SIASCAN_ADDRESS, "")

	phrase := args[0].String()
	jsonTxn := args[2].String()
	sigIndicesLen := args[3].Length()
	callback := args[4]

	var txn types.Transaction
	if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
		callback.Invoke(err.Error(), js.Null())
		return err.Error()
	}

	go func() {
		cs, err := w.ConsensusTipState()
		if err != nil {
			callback.Invoke(fmt.Sprintf("error getting consensus state: %s", err), js.Null())
			return
		}

		var seed [32]byte
		defer clear(seed[:])
		if err := phraseToSeed(phrase, &seed); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		for i := range sigIndicesLen {
			index := uint64(args[3].Index(i).Int())

			sigHash := cs.WholeSigHash(txn, txn.Signatures[i].ParentID, 0, 0, nil)
			sk := wallet.KeyFromSeed(&seed, index)
			sig := sk.SignHash(sigHash)
			txn.Signatures[i].Signature = sig[:]
		}

		obj, err := interfaceToJSON(txn)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error encoding signed transaction: %s", err), js.Null())
			return
		}
		callback.Invoke(js.Null(), obj)
	}()
	return nil
}

func encodeUnlockHash(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	jsonUnlockConds := args[0].String()
	callback := args[1]

	go func() {
		var unlockConds types.UnlockConditions
		if err := json.Unmarshal([]byte(jsonUnlockConds), &unlockConds); err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), unlockConds.UnlockHash().String())
	}()

	return nil
}

func generateSeed(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	seedType := args[0].String()
	callback := args[1]

	switch seedType {
	case "walrus":
		callback.Invoke(js.Null(), wallet.NewSeedPhrase())
	case "sia":
		callback.Invoke(js.Null(), siad.NewSeedPhrase())
	default:
		callback.Invoke(fmt.Sprintf("unknown seed type: %q", seedType), js.Null())
	}

	return nil
}

func phraseToSeed(phrase string, seed *[32]byte) error {
	switch len(strings.Fields(phrase)) {
	case 28, 29:
		return siad.SeedFromPhrase(seed, phrase)
	case 12:
		return wallet.SeedFromPhrase(seed, phrase)
	default:
		return fmt.Errorf("invalid seed phrase length: %d words", len(strings.Fields(phrase)))
	}
}

func generateAddress(seed *[32]byte, i uint64) map[string]any {
	sk := wallet.KeyFromSeed(seed, uint64(i))
	return map[string]any{
		"unlock_conditions": types.StandardUnlockConditions(sk.PublicKey()),
		"usage_type":        "sent",
		"address":           types.StandardUnlockHash(sk.PublicKey()).String(),
		"index":             i,
	}
}

func generateAddresses(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeFunction); err != nil {
		return err.Error()
	}

	phrase := args[0].String()
	i := uint64(args[2].Int())
	n := args[3].Int()
	callback := args[4]

	var seed [32]byte
	defer clear(seed[:])

	if err := phraseToSeed(phrase, &seed); err != nil {
		return err.Error()
	}

	addresses := make([]any, 0, n)
	for ; n > len(addresses); i++ {
		obj, err := interfaceToJSON(generateAddress(&seed, i))
		if err != nil {
			return err.Error()
		}
		addresses = append(addresses, obj)
	}
	callback.Invoke(js.Null(), addresses)
	return nil
}

func recoverAddresses(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeNumber, js.TypeFunction); err != nil {
		return err.Error()
	}

	phrase := args[0].String()
	lookahead := uint64(args[3].Int())
	callback := args[5]

	var seed [32]byte
	if err := phraseToSeed(phrase, &seed); err != nil {
		return err.Error()
	}

	go func() {
		w := api.NewClient(SIASCAN_ADDRESS, "")

		var gap uint64
		n := min(1000, lookahead)
		addresses := make([]types.Address, 0, n)
		var lastSeenIndex uint64
		for i := uint64(0); gap < uint64(lookahead); i += n {
			addresses = addresses[:0] // reset addresses slice
			recovered := make([]map[string]any, 0, n)
			start, end := i, i+n
			for i := start; i < end; i++ {
				addresses = append(addresses, types.StandardUnlockHash(wallet.KeyFromSeed(&seed, i).PublicKey()))
				recovered = append(recovered, generateAddress(&seed, i))
			}

			log.Println("checking addresses from", i, "to", i+uint64(n))
			ok, err := w.CheckAddresses(addresses)
			if err != nil {
				callback.Invoke(fmt.Sprintf("error checking addresses: %s", err), js.Null())
				return
			} else if !ok {
				// if no used addresses are found, increase the gap
				gap += uint64(n)
				recovered = recovered[:0] // reset recovered addresses
				log.Printf("no used addresses found, increasing gap to %d", gap)
			} else {
				// reset gap if used addresses are found
				lastSeenIndex = end
				gap = 0
				log.Println("found used addresses, gap reset")
			}

			// send progress callback
			data, err := interfaceToJSON(map[string]any{
				"found":     len(recovered),
				"addresses": recovered,
				"index":     lastSeenIndex,
			})
			if err != nil {
				callback.Invoke(fmt.Sprintf("error encoding addresses: %s", err), js.Null())
				return
			}
			callback.Invoke("progress", data)
		}

		// if any used addresses are found, reset gap
		gap = 0
		callback.Invoke(js.Null(), js.Null())
	}()
	return nil
}

type (
	siacoinOutput struct {
		OutputID   types.SiacoinOutputID `json:"output_id"`
		UnlockHash types.Address         `json:"unlock_hash"`
		Value      types.Currency        `json:"value"`
	}

	siafundOutput struct {
		OutputID   types.SiafundOutputID `json:"output_id"`
		UnlockHash types.Address         `json:"unlock_hash"`
		Value      uint64                `json:"value"`
	}

	walletBalance struct {
		SiafundClaim            types.Currency         `json:"siafund_claim"`
		Transactions            []processedTransaction `json:"transactions"`
		UnspentSiacoinOutputs   []siacoinOutput        `json:"unspent_siacoin_outputs"`
		UnspentSiafundOutputs   []siafundOutput        `json:"unspent_siafund_outputs"`
		ConfirmedSiacoinBalance types.Currency         `json:"confirmed_siacoin_balance"`
		ConfirmedSiafundBalance uint64                 `json:"confirmed_siafund_balance"`
		UnconfirmedSiacoinDelta types.Currency         `json:"unconfirmed_siacoin_delta"`
		UnconfirmedSiafundDelta types.Currency         `json:"unconfirmed_siafund_delta"`
	}

	processedTransaction struct {
		ID             types.Hash256  `json:"id"`
		BlockHeight    uint64         `json:"block_height"`
		Confirmations  uint64         `json:"confirmations"`
		Timestamp      time.Time      `json:"timestamp"`
		Fees           types.Currency `json:"fees"`
		SiacoinInputs  types.Currency `json:"siacoin_inputs"`
		SiacoinOutputs types.Currency `json:"siacoin_outputs"`
		SiafundInputs  uint64         `json:"siafund_inputs"`
		SiafundOutputs uint64         `json:"siafund_outputs"`
		Tags           []string       `json:"tags,omitempty"`
	}
)

func hasAnnouncement(txn types.Transaction) bool {
	for _, arb := range txn.ArbitraryData {
		var ha chain.HostAnnouncement
		if ha.FromArbitraryData(arb) {
			return true
		}
	}
	return false
}

func hasV2Announcement(txn types.V2Transaction) bool {
	for _, attestation := range txn.Attestations {
		var ha chain.V2HostAnnouncement
		if err := ha.FromAttestation(attestation); err == nil {
			return true
		}
	}
	return false
}

func getWalletTransactions(w *api.Client, addresses []types.Address) ([]processedTransaction, error) {
	if len(addresses) == 0 {
		return nil, nil
	}

	relevantAddresses := make(map[types.Address]bool, len(addresses))
	for _, addr := range addresses {
		relevantAddresses[addr] = true
	}

	processEvent := func(event wallet.Event) (processedTransaction, bool) {
		processed := processedTransaction{
			ID:            event.ID,
			Timestamp:     event.Timestamp,
			BlockHeight:   event.Index.Height,
			Confirmations: event.Confirmations,
		}
		var relevant bool
		switch data := event.Data.(type) {
		case wallet.EventV1Transaction:
			switch {
			case len(data.Transaction.FileContracts) > 0 && len(data.Transaction.FileContractRevisions) > 0:
				processed.Tags = append(processed.Tags, "contract_renewal")
			case len(data.Transaction.FileContractRevisions) > 0:
				processed.Tags = append(processed.Tags, "contract_revision")
			case len(data.Transaction.FileContracts) > 0:
				processed.Tags = append(processed.Tags, "contract_formation")
			case len(data.Transaction.StorageProofs) > 0:
				processed.Tags = append(processed.Tags, "storage_proof")
			case hasAnnouncement(data.Transaction):
				processed.Tags = append(processed.Tags, "host_announcement")
			case max(len(data.Transaction.SiafundInputs), len(data.Transaction.SiafundOutputs)) > 0:
				processed.Tags = append(processed.Tags, "siafund_transaction")
			case max(len(data.Transaction.SiacoinInputs), len(data.Transaction.SiacoinOutputs)) > 0:
				processed.Tags = append(processed.Tags, "siacoin_transaction")
			}
			for _, sce := range data.SpentSiacoinElements {
				if !relevantAddresses[sce.SiacoinOutput.Address] {
					continue
				}
				relevant = true
				processed.SiacoinInputs = processed.SiacoinInputs.Add(sce.SiacoinOutput.Value)
			}
			for _, sco := range data.Transaction.SiacoinOutputs {
				if !relevantAddresses[sco.Address] {
					continue
				}
				relevant = true
				processed.SiacoinOutputs = processed.SiacoinOutputs.Add(sco.Value)
			}
			for _, sfe := range data.SpentSiafundElements {
				if !relevantAddresses[sfe.SiafundOutput.Address] {
					continue
				}
				relevant = true
				processed.SiafundInputs += sfe.SiafundOutput.Value
			}
			for _, sfo := range data.Transaction.SiafundOutputs {
				if !relevantAddresses[sfo.Address] {
					continue
				}
				relevant = true
				processed.SiafundOutputs += sfo.Value
			}
		case wallet.EventV2Transaction:
			switch {
			case len(data.FileContractRevisions) > 0:
				processed.Tags = append(processed.Tags, "contract_revision")
			case len(data.FileContracts) > 0:
				processed.Tags = append(processed.Tags, "contract_formation")
			case len(data.FileContractResolutions) > 0:
				processed.Tags = append(processed.Tags, "storage_proof")
			case hasV2Announcement(types.V2Transaction(data)):
				processed.Tags = append(processed.Tags, "host_announcement")
			case max(len(data.SiafundInputs), len(data.SiafundOutputs)) > 0:
				processed.Tags = append(processed.Tags, "siafund_transaction")
			case max(len(data.SiacoinInputs), len(data.SiacoinOutputs)) > 0:
				processed.Tags = append(processed.Tags, "siacoin_transaction")
			}
			for _, sci := range data.SiacoinInputs {
				if !relevantAddresses[sci.Parent.SiacoinOutput.Address] {
					continue
				}
				relevant = true
				processed.SiacoinInputs = processed.SiacoinInputs.Add(sci.Parent.SiacoinOutput.Value)
			}
			for _, sco := range data.SiacoinOutputs {
				if !relevantAddresses[sco.Address] {
					continue
				}
				relevant = true
				processed.SiacoinOutputs = processed.SiacoinOutputs.Add(sco.Value)
			}
			for _, sfi := range data.SiafundInputs {
				if !relevantAddresses[sfi.Parent.SiafundOutput.Address] {
					continue
				}
				relevant = true
				processed.SiafundInputs += sfi.Parent.SiafundOutput.Value
			}
			for _, sfo := range data.SiafundOutputs {
				if !relevantAddresses[sfo.Address] {
					continue
				}
				relevant = true
				processed.SiafundOutputs += sfo.Value
			}
		case wallet.EventV1ContractResolution:
			relevant = true
			if data.Missed {
				processed.Tags = append(processed.Tags, "contract_missed_output")
			} else {
				processed.Tags = append(processed.Tags, "contract_valid_output")
			}
			processed.SiacoinOutputs = data.SiacoinElement.SiacoinOutput.Value
		case wallet.EventV2ContractResolution:
			if data.SiacoinElement.SiacoinOutput.Value.IsZero() {
				break
			}
			relevant = true
			if data.Missed {
				processed.Tags = append(processed.Tags, "contract_missed_output")
			} else {
				processed.Tags = append(processed.Tags, "contract_renewal")
			}
			processed.SiacoinOutputs = data.SiacoinElement.SiacoinOutput.Value
		case wallet.EventPayout:
			relevant = true
			processed.Tags = append(processed.Tags, "payout")
			processed.SiacoinOutputs = data.SiacoinElement.SiacoinOutput.Value
		}
		return processed, relevant
	}

	events, err := w.TPoolEvents()
	if err != nil {
		return nil, fmt.Errorf("failed to get unconfirmed transactions: %w", err)
	}

	var unconfirmed []processedTransaction
	for _, event := range events {
		processed, relevant := processEvent(event)
		if relevant {
			unconfirmed = append(unconfirmed, processed)
		}
	}

	var transactions []processedTransaction
	seen := make(map[types.Hash256]bool)
	batch := min(1000, len(addresses))
	for i := 0; i < len(addresses); i += batch {
		addressBatch := addresses[i:][:batch]
		events, err := w.BatchAddressEvents(addressBatch, 0, 100)
		if err != nil {
			return nil, fmt.Errorf("failed to get wallet events: %w", err)
		}
		log.Println("events for addresses", len(addressBatch), ":", len(events))

		for _, event := range events {
			if seen[event.ID] {
				continue // skip already processed events
			}
			seen[event.ID] = true
			processed, relevant := processEvent(event)
			if !relevant {
				continue // should never happen, but just in case
			}
			transactions = append(transactions, processed)
			sort.Slice(transactions, func(i, j int) bool {
				// sort by timestamp, oldest first
				return transactions[i].Timestamp.Before(transactions[j].Timestamp)
			})
			if len(transactions) >= 100 {
				transactions = transactions[:100]
			}
		}
	}
	return append(unconfirmed, transactions...), nil
}

func getWalletBalance(w *api.Client, addresses []types.Address) (wb walletBalance, err error) {
	batch := min(1000, len(addresses))
	for i := 0; i < len(addresses); i += batch {
		addressBatch := addresses[i:][:batch]
		balance, err := w.BatchAddressBalance(addressBatch)
		if err != nil {
			return walletBalance{}, fmt.Errorf("failed to get wallet balance: %w", err)
		}
		wb.ConfirmedSiacoinBalance = wb.ConfirmedSiacoinBalance.Add(balance.Siacoins)
		wb.ConfirmedSiafundBalance += balance.Siafunds
	}
	return wb, nil
}

func getWalletSiacoinOutputs(w *api.Client, addresses []types.Address) ([]siacoinOutput, error) {
	if len(addresses) == 0 {
		return nil, nil
	}

	tip, err := w.ConsensusTip()
	if err != nil {
		return nil, fmt.Errorf("failed to get consensus state: %w", err)
	}

	relevantAddresses := make(map[types.Address]bool, len(addresses))
	for _, addr := range addresses {
		relevantAddresses[addr] = true
	}

	var utxos []siacoinOutput
	batch := min(1000, len(addresses))
	for i := 0; i < len(addresses); i += batch {
		addressBatch := addresses[i:][:batch]
		sces, _, err := w.BatchAddressSiacoinOutputs(addressBatch, 0, 10000)
		if err != nil {
			return nil, fmt.Errorf("failed to get wallet siacoin outputs: %w", err)
		}
		for _, sce := range sces {
			if sce.MaturityHeight > tip.Height {
				continue
			}
			utxos = append(utxos, siacoinOutput{
				OutputID:   sce.ID,
				UnlockHash: sce.SiacoinOutput.Address,
				Value:      sce.SiacoinOutput.Value,
			})
		}
	}
	return utxos, nil
}

func getWalletSiafundOutputs(w *api.Client, addresses []types.Address) ([]siafundOutput, types.Currency, error) {
	if len(addresses) == 0 {
		return nil, types.ZeroCurrency, nil
	}

	cs, err := w.ConsensusTipState()
	if err != nil {
		return nil, types.ZeroCurrency, fmt.Errorf("failed to get consensus state: %w", err)
	}
	log.Println("tax revenue", cs.SiafundTaxRevenue)

	relevantAddresses := make(map[types.Address]bool, len(addresses))
	for _, addr := range addresses {
		relevantAddresses[addr] = true
	}

	var claimBalance types.Currency
	var utxos []siafundOutput
	batch := min(1000, len(addresses))
	for i := 0; i < len(addresses); i += batch {
		addressBatch := addresses[i:][:batch]
		sfes, _, err := w.BatchAddressSiafundOutputs(addressBatch, 0, 10000)
		if err != nil {
			return nil, types.ZeroCurrency, fmt.Errorf("failed to get wallet siafund outputs: %w", err)
		}
		for _, sfe := range sfes {
			dividend := cs.SiafundTaxRevenue.Sub(sfe.ClaimStart).Div64(cs.SiafundCount()).Mul64(sfe.SiafundOutput.Value)
			log.Println("siafund", sfe.ID, sfe.ClaimStart, dividend)
			claimBalance = claimBalance.Add(dividend)
			utxos = append(utxos, siafundOutput{
				OutputID:   sfe.ID,
				UnlockHash: sfe.SiafundOutput.Address,
				Value:      sfe.SiafundOutput.Value,
			})
		}
	}
	return utxos, claimBalance, nil
}

func getTransactions(this js.Value, args []js.Value) any {
	if err := checkArgs(args, js.TypeObject, js.TypeString, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	count := args[0].Length()
	//walletCurrency := args[1].String()
	// displayCurrency := args[2].String()
	callback := args[3]

	if count == 0 {
		callback.Invoke("no addresses provided", js.Null())
		return nil
	}

	go func() {
		w := api.NewClient(SIASCAN_ADDRESS, "")

		var addresses []types.Address
		for i := range count {
			var addr types.Address
			if err := addr.UnmarshalText([]byte(args[0].Index(i).String())); err != nil {
				callback.Invoke(fmt.Sprintf("error parsing address %d: %s", i, err), js.Null())
				return
			}
			addresses = append(addresses, addr)
		}
		walletResp, err := getWalletBalance(w, addresses)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error getting wallet balance: %s", err), js.Null())
			return
		}
		walletResp.Transactions, err = getWalletTransactions(w, addresses)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error getting wallet transactions: %s", err), js.Null())
			return
		}

		walletResp.UnspentSiacoinOutputs, err = getWalletSiacoinOutputs(w, addresses)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error getting wallet siacoin outputs: %s", err), js.Null())
			return
		}

		walletResp.UnspentSiafundOutputs, walletResp.SiafundClaim, err = getWalletSiafundOutputs(w, addresses)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error getting wallet siafund outputs: %s", err), js.Null())
			return
		}

		obj, err := interfaceToJSON(walletResp)
		if err != nil {
			callback.Invoke(fmt.Sprintf("error encoding wallet response: %s", err), js.Null())
			return
		}
		callback.Invoke(js.Null(), obj)
	}()

	return nil
}
