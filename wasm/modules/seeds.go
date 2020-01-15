package modules

import (
	"strings"

	"syscall/js"

	"github.com/siacentral/sia-lite-wallet-web/wasm/wallet"
)

//GenerateSeed generates a new 12 or 29 word seed phrase
func GenerateSeed(seedType string, callback js.Value) {
	var phrase string
	var err error

	switch strings.ToLower(seedType) {
	case "walrus":
		phrase, err = wallet.NewBIP39RecoveryPhrase()
		break
	default:
		phrase, err = wallet.NewSiaRecoveryPhrase()
		break
	}

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), phrase)
}

//GetAddresses generates n addresses using the seed phrase starting at index i
func GetAddresses(phrase string, i uint64, n uint64, callback js.Value) {
	w, err := recoverWallet(phrase)

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	keys := make([]wallet.SpendableKey, n)
	addresses := make([]interface{}, n)

	w.GetAddresses(uint64(i), keys)

	for a, key := range keys {
		unlockConditions, err := interfaceToJSON(key.UnlockConditions)

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		addresses[a] = map[string]interface{}{
			"unlock_conditions": unlockConditions,
			"address":           key.UnlockConditions.UnlockHash().String(),
			"index":             uint64(a) + i,
		}
	}

	callback.Invoke(js.Null(), addresses)
}
