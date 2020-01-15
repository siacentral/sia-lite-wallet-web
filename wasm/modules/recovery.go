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
func RecoverAddresses(seed string, i uint64, minRounds uint64, addressCount uint64, callback js.Value) {
	var lastUsed, maxIndex uint64
	var lastUsedType string

	w, err := recoverWallet(seed)

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

		if len(used) != 0 {
			lastUsed = 0
		} else {
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
}
