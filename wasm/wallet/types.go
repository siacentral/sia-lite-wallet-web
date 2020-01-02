package wallet

import (
	"gitlab.com/NebulousLabs/Sia/crypto"
	"gitlab.com/NebulousLabs/Sia/types"
)

type (
	//SeedWallet creates keys and addresses for the generated seed. Wallet is stateless for ease of use
	SeedWallet struct {
		s [crypto.EntropySize]byte
	}

	//SpendableKey a set of secret keys plus the corresponding unlock conditions. Siacoin and
	//Siafund outputs with unlock hashes matching the unlock conditions can be spent by the seed
	SpendableKey struct {
		UnlockConditions types.UnlockConditions `json:"unlock_conditions"`
		SecretKeys       []crypto.SecretKey     `json:"private_key"`
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
