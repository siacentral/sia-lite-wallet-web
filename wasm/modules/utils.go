package modules

import (
	"encoding/json"
	"strings"

	"github.com/siacentral/sia-lite/wasm/wallet"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

func interfaceToJSON(obj interface{}) (con map[string]interface{}, err error) {
	buf, err := json.Marshal(obj)

	if err != nil {
		return
	}

	err = json.Unmarshal(buf, &con)

	return
}

func recoverWallet(seed string) (*wallet.SeedWallet, error) {
	if len(strings.Split(seed, " ")) < 20 {
		return wallet.RecoverBIP39Seed(seed)
	}

	return wallet.RecoverSiaSeed(seed)
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