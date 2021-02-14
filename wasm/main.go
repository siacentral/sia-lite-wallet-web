package main

import (
	"encoding/json"
	"fmt"
	"log"
	"syscall/js"
	"time"

	"github.com/siacentral/sia-lite-wallet-web/wasm/build"
	"github.com/siacentral/sia-lite-wallet-web/wasm/modules"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

func main() {
	log.Printf("starting sia wasm %s", build.Revision())
	js.Global().Set("sia", map[string]interface{}{
		"build": map[string]interface{}{
			"revision":  build.Revision(),
			"timestamp": build.Time().Format(time.UnixDate),
		},
		"generateSeed":       js.FuncOf(generateSeed),
		"generateAddresses":  js.FuncOf(generateAddresses),
		"recoverAddresses":   js.FuncOf(recoverAddresses),
		"getTransactions":    js.FuncOf(getTransactions),
		"encodeTransaction":  js.FuncOf(encodeTransaction),
		"signTransaction":    js.FuncOf(signTransaction),
		"signTransactions":   js.FuncOf(signTransactions),
		"encodeUnlockHash":   js.FuncOf(encodeUnlockHash),
		"encodeUnlockHashes": js.FuncOf(encodeUnlockHashes),
		"exportTransactions": js.FuncOf(exportTransactions),
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

func encodeTransaction(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	jsonTxn := args[0].String()
	callback := args[1]

	var txn siatypes.Transaction

	if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
		callback.Invoke(err.Error(), js.Null())
		return err.Error()
	}

	go modules.EncodeTransaction(txn, callback)

	return nil
}

func signTransaction(this js.Value, args []js.Value) interface{} {
	var txn siatypes.Transaction

	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeString, js.TypeObject, js.TypeFunction); err != nil {
		return err.Error()
	}

	phrase := args[0].String()
	currency := args[1].String()
	jsonTxn := args[2].String()
	length := args[3].Length()
	callback := args[4]
	requiredSigs := make([]uint64, length)

	if err := json.Unmarshal([]byte(jsonTxn), &txn); err != nil {
		callback.Invoke(err.Error(), js.Null())
		return err.Error()
	}

	for i := 0; i < length; i++ {
		requiredSigs[i] = uint64(args[3].Index(i).Int())
	}

	go modules.SignTransaction(txn, phrase, currency, requiredSigs, callback)

	return nil
}

func signTransactions(this js.Value, args []js.Value) interface{} {
	var unsigned []modules.UnsignedTransaction

	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	phrase := args[0].String()
	currency := args[1].String()
	jsonTxns := args[2].String()
	callback := args[3]

	if err := json.Unmarshal([]byte(jsonTxns), &unsigned); err != nil {
		callback.Invoke(fmt.Sprintf("error decoding transactions: %s", err), js.Null())
		return err.Error()
	}

	go modules.SignTransactions(unsigned, phrase, currency, callback)

	return nil
}

func encodeUnlockHash(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
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

	return nil
}

func encodeUnlockHashes(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeObject, js.TypeFunction); err != nil {
		return err.Error()
	}

	length := args[0].Length()
	addresses := make([]interface{}, 0, length)
	callback := args[1]

	go func() {
		for i := 0; i < length; i++ {
			var uc siatypes.UnlockConditions

			if err := json.Unmarshal([]byte(args[0].Index(i).String()), &uc); err != nil {
				callback.Invoke(err.Error(), js.Null())
				return
			}

			addresses = append(addresses, uc.UnlockHash().String())
		}

		callback.Invoke(js.Null(), addresses)
	}()

	return nil
}

func generateSeed(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	seedType := args[0].String()
	callback := args[1]

	go modules.GenerateSeed(seedType, callback)

	return nil
}

func generateAddresses(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeFunction); err != nil {
		return err.Error()
	}

	phrase := args[0].String()
	currency := args[1].String()
	i := args[2].Int()
	n := args[3].Int()
	callback := args[4]

	go modules.GetAddresses(phrase, currency, uint64(i), uint64(n), callback)

	return nil
}

func recoverAddresses(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeString, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeNumber, js.TypeFunction); err != nil {
		return err.Error()
	}

	seed := args[0].String()
	currency := args[1].String()
	i := uint64(args[2].Int())
	lookahead := uint64(args[3].Int())
	lastKnownIdx := uint64(args[4].Int())
	callback := args[5]

	go modules.RecoverAddresses(seed, currency, i, lookahead, lastKnownIdx, callback)

	return nil
}

func getTransactions(this js.Value, args []js.Value) interface{} {
	if err := checkArgs(args, js.TypeObject, js.TypeString, js.TypeFunction); err != nil {
		return err.Error()
	}

	count := args[0].Length()
	currency := args[1].String()
	callback := args[2]
	addresses := make([]string, count)

	for i := 0; i < count; i++ {
		addresses[i] = args[0].Index(i).String()
	}

	go modules.GetTransactions(addresses, currency, callback)

	return nil
}

func exportTransactions(this js.Value, args []js.Value) interface{} {
	var min, max time.Time

	if err := checkArgs(args, js.TypeObject, js.TypeString, js.TypeNumber, js.TypeNumber, js.TypeFunction); err != nil {
		return err.Error()
	}

	count := args[0].Length()
	currency := args[1].String()
	minTimestamp := args[2].Int()
	maxTimestamp := args[3].Int()
	callback := args[4]
	addresses := make([]string, count)

	for i := 0; i < count; i++ {
		addresses[i] = args[0].Index(i).String()
	}

	if minTimestamp > 0 {
		min = time.Unix(int64(minTimestamp), 0)
	}

	if maxTimestamp > 0 {
		max = time.Unix(int64(maxTimestamp), 0)
	}

	go modules.ExportTransactions(addresses, currency, min, max, callback)

	return nil
}
