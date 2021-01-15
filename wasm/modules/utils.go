package modules

import (
	"encoding/json"
	"strings"

	"github.com/siacentral/apisdkgo"
	"github.com/siacentral/sia-lite-wallet-web/wasm/wallet"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

const (
	workers = 5
)

func siacentralAPIClient(currency string) *apisdkgo.APIClient {
	var baseAddress string

	switch currency {
	case "scp":
		baseAddress = "https://api.siacentral.com/v2/scprime"
	default:
		baseAddress = "https://api.siacentral.com/v2"
	}

	return &apisdkgo.APIClient{
		BaseAddress: baseAddress,
	}
}

func interfaceToJSON(obj interface{}) (con map[string]interface{}, err error) {
	buf, err := json.Marshal(obj)

	if err != nil {
		return
	}

	err = json.Unmarshal(buf, &con)

	return
}

func recoverWallet(seed, currency string) (*wallet.SeedWallet, error) {
	if len(strings.Fields(seed)) < 20 {
		return wallet.RecoverBIP39Seed(seed, currency)
	}

	return wallet.RecoverSiaSeed(seed, currency)
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
