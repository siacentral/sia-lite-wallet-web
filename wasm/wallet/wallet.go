package wallet

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"gitlab.com/NebulousLabs/Sia/crypto"
	"gitlab.com/NebulousLabs/Sia/types"
	mnemonics "gitlab.com/NebulousLabs/entropy-mnemonics"
	"gitlab.com/NebulousLabs/fastrand"
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
	asicHardForkHeight     = types.BlockHeight(179001)
	fullCoveredFields      = types.CoveredFields{WholeTransaction: true}
	seedFormatEnglishRegex = regexp.MustCompile(`^([a-z]{4,12}){1}( {1}[a-z]{4,12}){27,28}$`)
)

func generateSpendableKey(seed [crypto.EntropySize]byte, index uint64) SpendableKey {
	sk, pk := crypto.GenerateKeyPairDeterministic(crypto.HashAll(seed, index))

	return SpendableKey{
		UnlockConditions: types.UnlockConditions{
			PublicKeys:         []types.SiaPublicKey{types.Ed25519PublicKey(pk)},
			SignaturesRequired: 1,
		},
		SecretKeys: []crypto.SecretKey{sk},
	}
}

//NewSeed creates a new unique wallet seed
func NewSeed() (wallet *SeedWallet) {
	wallet = new(SeedWallet)

	fastrand.Read(wallet.s[:])

	return
}

//RecoverSeed loads a standard 29 word wallet phrase.
//Wanted to import this directly from modules, but cannot because of bbolt
//https://gitlab.com/NebulousLabs/Sia/blob/fb65620/modules/wallet.go#L526
func RecoverSeed(phrase string) (wallet *SeedWallet, err error) {
	wallet = new(SeedWallet)

	for _, char := range phrase {
		if unicode.IsUpper(char) {
			return nil, errors.New("seed is not valid: all words must be lowercase")
		}
		if !unicode.IsLetter(char) && !unicode.IsSpace(char) {
			return nil, fmt.Errorf("seed is not valid: illegal character '%v'", char)
		}
	}

	// Check seed has 28 or 29 words
	if len(strings.Fields(phrase)) != 28 && len(strings.Fields(phrase)) != 29 {
		return nil, errors.New("seed is not valid: must be 28 or 29 words")
	}

	// Check for formatting errors
	if !seedFormatEnglishRegex.MatchString(phrase) {
		return nil, errors.New("seed is not valid: invalid formatting")
	}

	// Decode the string into the checksummed byte slice.
	checksumSeedBytes, err := mnemonics.FromString(phrase, mnemonics.DictionaryID("english"))

	if err != nil {
		return nil, err
	}

	copy(wallet.s[:], checksumSeedBytes)

	return
}

//RecoveryPhrase returns the 29 word seed recovery phrase.
//Wanted to import this directly from modules, but cannot because of bbolt
//https://gitlab.com/NebulousLabs/Sia/blob/fb65620/modules/wallet.go#L515
func (wallet *SeedWallet) RecoveryPhrase() (string, error) {
	fullChecksum := crypto.HashObject(wallet.s)
	checksumSeed := append(wallet.s[:], fullChecksum[:SeedChecksumSize]...)
	phrase, err := mnemonics.ToPhrase(checksumSeed, mnemonics.DictionaryID("english"))

	if err != nil {
		return "", err
	}

	return phrase.String(), nil
}

//GetAddress returns the spendable address at the specified index
func (wallet *SeedWallet) GetAddress(idx uint64) SpendableKey {
	return generateSpendableKey(wallet.s, idx)
}

//GetAddresses returns the n addresses starting at idx and incrementing by 1.
//Wanted to import this directly from modules, but cannot because of bbolt
//https://gitlab.com/NebulousLabs/Sia/blob/fb65620/modules/wallet/seed.go#L49
func (wallet *SeedWallet) GetAddresses(idx uint64, keys []SpendableKey) {
	var n int

	for ; n < len(keys); n++ {
		keys[n] = generateSpendableKey(wallet.s, idx+uint64(n))
	}
}

//SignTransaction signs a transaction for simplicity only supports standard 1 signature keys
//and siacoin inputs
func (wallet *SeedWallet) SignTransaction(txn types.Transaction, keys []SpendableKey) (types.Transaction, error) {
	unlockHashMap := make(map[string]SpendableKey)

	for _, key := range keys {
		unlockHashMap[key.UnlockConditions.UnlockHash().String()] = key
	}

	if len(txn.TransactionSignatures) != len(txn.SiacoinInputs) {
		return txn, errors.New("missing required signatures")
	}

	if len(txn.TransactionSignatures) != len(keys) {
		return txn, errors.New("missing signature key indexes")
	}

	for i, input := range txn.SiacoinInputs {
		key, exists := unlockHashMap[input.UnlockConditions.UnlockHash().String()]

		if !exists {
			return txn, errors.New("unknown unlock conditions")
		}

		sigHash := txn.SigHash(i, asicHardForkHeight)
		encodedSig := crypto.SignHash(sigHash, key.SecretKeys[0])

		txn.TransactionSignatures[i].Signature = encodedSig[:]
	}

	return txn, nil
}
