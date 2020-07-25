package wallet

import (
	"gitlab.com/NebulousLabs/fastrand"
	"golang.org/x/crypto/blake2b"
)

//NewBIP39RecoveryPhrase creates a new unique 12 word wallet seed
func NewBIP39RecoveryPhrase() (string, error) {
	var entropy [16]byte

	fastrand.Read(entropy[:])

	encodeBIP39Phrase(entropy)

	return encodeBIP39Phrase(entropy), nil
}

//RecoverBIP39Seed loads a 12 word BIP-39 seed phrase
func RecoverBIP39Seed(phrase, currency string) (*SeedWallet, error) {
	wallet := new(SeedWallet)

	entropy, err := decodeBIP39Phrase(phrase)

	if err != nil {
		return nil, err
	}

	seed := blake2b.Sum256(entropy[:])

	copy(wallet.s[:], seed[:])

	wallet.Currency = currency

	return wallet, nil
}
