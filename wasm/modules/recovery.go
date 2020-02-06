package modules

import (
	"syscall/js"

	apiclient "github.com/siacentral/apisdkgo"
	"github.com/siacentral/sia-lite-wallet-web/wasm/wallet"
)

//RecoverAddresses scans for addresses on the blockchain addressCount at a time up to a maximum of 100,000,000
//addresses. Considers all addresses found if the scan goes more than minRounds * addressCount
//addresses without seeing any used. It's possible the ranges will need to be tweaked for older or
//larger wallets
func RecoverAddresses(seed string, i uint64, maxEmptyRounds uint64, addressCount uint64, lastKnownIndex uint64, callback js.Value) {
	var emptyRounds, lastUsedIndex uint64

	w, err := recoverWallet(seed)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	//hard limit of 1e7 addresses after the starting index
	limit := i + 1e7

	for i < limit && emptyRounds < maxEmptyRounds {
		addresses := make([]string, 0, addressCount)
		indexMap := make(map[string]uint64)
		unlockMap := make(map[string]wallet.UnlockConditions)

		for ; uint64(len(addresses)) < addressCount; i++ {
			key := w.GetAddress(i)
			address := key.UnlockConditions.UnlockHash().String()
			addresses = append(addresses, address)
			unlockMap[address] = mapUnlockConditions(key.UnlockConditions)
			indexMap[address] = i
		}

		used, err := apiclient.FindUsedAddresses(addresses)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		if len(used) != 0 {
			emptyRounds = 0
		} else if i >= lastKnownIndex {
			emptyRounds++
		}

		foundAddresses := []interface{}{}

		for _, addr := range used {
			if indexMap[addr.Address] > lastUsedIndex {
				lastUsedIndex = indexMap[addr.Address]
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
			"index":     lastUsedIndex,
			"done":      false,
		})

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke(js.Null(), data)
	}

	additional := []map[string]interface{}{}
	key := w.GetAddress(lastUsedIndex + 1)

	additional = append(additional, map[string]interface{}{
		"index":             lastUsedIndex + 1,
		"unlock_conditions": mapUnlockConditions(key.UnlockConditions),
		"address":           key.UnlockConditions.UnlockHash().String(),
		"usage_type":        "none",
	})

	data, err := interfaceToJSON(map[string]interface{}{
		"addresses": additional,
		"index":     lastUsedIndex + 1,
		"done":      true,
	})

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), data)
}
