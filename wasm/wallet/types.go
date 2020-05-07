package wallet

import (
	siacrypto "gitlab.com/NebulousLabs/Sia/crypto"
	"gitlab.com/NebulousLabs/Sia/types"
)

//Some of these funcs and consts are copied directly from the Sia code base. Unfortunately we can't
//use some of the packages directly because of the wasm target
const (
	//SeedChecksumSize is the number of bytes that are used to checksum
	//addresses to prevent accidental spending.
	//https://gitlab.com/NebulousLabs/Sia/blob/fb65620/modules/wallet.go#L24
	SeedChecksumSize = 6
)

var (
	asicHardForkHeight = types.BlockHeight(179001)
	fullCoveredFields  = types.CoveredFields{WholeTransaction: true}
)

type (
	//SpendableKey a set of secret keys plus the corresponding unlock conditions. Siacoin and
	//Siafund outputs with unlock hashes matching the unlock conditions can be spent by the seed
	SpendableKey struct {
		UnlockConditions types.UnlockConditions `json:"unlock_conditions"`
		SecretKeys       []siacrypto.SecretKey  `json:"private_key"`
	}

	//SpendableOutput an output known to be spendable by a seed with the index of the seed used
	//to generate the unlock hash
	SpendableOutput struct {
		ID         [32]byte       `json:"id"`
		UnlockHash string         `json:"unlock_hash"`
		SeedIndex  uint64         `json:"seed_index"`
		Value      types.Currency `json:"value"`
	}

	//UnlockConditions maps sia unlock conditions to a more managable type
	UnlockConditions struct {
		PublicKeys         []string `json:"publickeys"`
		SignaturesRequired uint64   `json:"signaturesrequired"`
		Timelock           uint64   `json:"timelock"`
	}
)
