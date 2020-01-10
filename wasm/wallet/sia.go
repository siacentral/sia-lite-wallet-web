package wallet

import (
	"errors"
	"fmt"
	"strings"
	"unicode"

	"gitlab.com/NebulousLabs/Sia/crypto"
	mnemonics "gitlab.com/NebulousLabs/entropy-mnemonics"
	"gitlab.com/NebulousLabs/fastrand"
)

var englishWordMap = func() map[string]bool {
	m := make(map[string]bool, len(mnemonics.EnglishDictionary))
	for _, v := range mnemonics.EnglishDictionary {
		m[v] = true
	}
	return m
}()

//NewSiaRecoveryPhrase creates a new unique 28 or 29 word wallet seed
func NewSiaRecoveryPhrase() (string, error) {
	var entropy [crypto.EntropySize]byte

	fastrand.Read(entropy[:])

	fullChecksum := crypto.HashObject(entropy)
	checksumSeed := append(entropy[:], fullChecksum[:SeedChecksumSize]...)
	phrase, err := mnemonics.ToPhrase(checksumSeed, mnemonics.DictionaryID("english"))

	if err != nil {
		return "", err
	}

	return phrase.String(), nil
}

//RecoverSiaSeed loads a standard 29 word wallet phrase.
//Wanted to import this directly from modules, but cannot because of bbolt
//https://gitlab.com/NebulousLabs/Sia/blob/fb65620/modules/go#L526
func RecoverSiaSeed(phrase string) (*SeedWallet, error) {
	wallet := new(SeedWallet)

	for _, char := range phrase {
		if unicode.IsUpper(char) {
			return nil, errors.New("seed is not valid: all words must be lowercase")
		}

		if !unicode.IsLetter(char) && !unicode.IsSpace(char) {
			return nil, fmt.Errorf("seed is not valid: illegal character '%v'", char)
		}
	}

	words := strings.Fields(phrase)

	// Check seed has 28 or 29 words
	if len(words) != 28 && len(words) != 29 {
		return nil, errors.New("seed is not valid: must be 28 or 29 words")
	}

	for _, word := range words {
		if _, ok := englishWordMap[word]; !ok {
			return nil, fmt.Errorf("unrecognized word %q in seed phrase", word)
		}
	}

	// Decode the string into the checksummed byte slice.
	checksumSeedBytes, err := mnemonics.FromString(phrase, mnemonics.DictionaryID("english"))

	if err != nil {
		return nil, err
	}

	copy(wallet.s[:], checksumSeedBytes)

	return wallet, nil
}
