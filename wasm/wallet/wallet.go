package wallet

import (
	"errors"
	"fmt"
	"log"

	"github.com/siacentral/sia-lite-wallet-web/wasm/siacentral"
	"go.sia.tech/siad/build"
	siacrypto "go.sia.tech/siad/crypto"
	"go.sia.tech/siad/types"
)

type (
	//SeedWallet creates keys and addresses for the generated seed. Wallet is stateless for ease of use
	SeedWallet struct {
		s        [siacrypto.EntropySize]byte
		Currency string
	}
)

// GetAddress returns the spendable address at the specified index
func (wallet *SeedWallet) GetAddress(index uint64) SpendableKey {
	sk, pk := siacrypto.GenerateKeyPairDeterministic(siacrypto.HashAll(wallet.s, index))

	return SpendableKey{
		UnlockConditions: types.UnlockConditions{
			PublicKeys:         []types.SiaPublicKey{types.Ed25519PublicKey(pk)},
			SignaturesRequired: 1,
		},
		SecretKeys: []siacrypto.SecretKey{sk},
	}
}

// GetAddresses returns the n addresses starting at idx and incrementing by 1.
// Wanted to import this directly from modules, but cannot because of bbolt
// https://go.sia.tech/siad/blob/fb65620/modules/wallet/seed.go#L49
func (wallet *SeedWallet) GetAddresses(idx uint64, keys []SpendableKey) {
	var n int

	for ; n < len(keys); n++ {
		keys[n] = wallet.GetAddress(idx + uint64(n))
	}
}

func apiClient(currency string) siacentral.API {
	switch currency {
	default:
		return siacentral.NewSiaAPI()
	}
}

func (wallet *SeedWallet) currentHeight() (types.BlockHeight, error) {
	height, err := apiClient(wallet.Currency).GetBlockHeight()
	if err != nil {
		return 0, err
	}

	return types.BlockHeight(height), nil
}

// SignTransaction signs a transaction, for simplicity only supports standard 1 signature keys
// and siacoin inputs
func (wallet *SeedWallet) SignTransaction(txn *types.Transaction, requiredSigIndices []uint64) error {
	unlockHashMap := make(map[string]SpendableKey)

	for _, index := range requiredSigIndices {
		key := wallet.GetAddress(index)

		unlockHashMap[key.UnlockConditions.UnlockHash().String()] = key
	}

	if len(txn.TransactionSignatures) != len(txn.SiacoinInputs) {
		return errors.New("missing required signatures")
	}

	if len(txn.TransactionSignatures) != len(requiredSigIndices) {
		return errors.New("missing signature key indexes")
	}

	height, err := wallet.currentHeight()
	if err != nil {
		return fmt.Errorf("unable to get current block height: %w", err)
	}

	log.Println("sign height", height, types.FoundationHardforkHeight, types.ASICHardforkHeight, build.Release)

	for i, input := range txn.SiacoinInputs {
		key, exists := unlockHashMap[input.UnlockConditions.UnlockHash().String()]

		if !exists {
			return errors.New("unknown unlock conditions")
		}

		sigHash := txn.SigHash(i, height)
		encodedSig := siacrypto.SignHash(sigHash, key.SecretKeys[0])

		txn.TransactionSignatures[i].Signature = encodedSig[:]
	}

	return nil
}
