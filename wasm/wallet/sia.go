package wallet

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"unicode"

	mnemonics "gitlab.com/NebulousLabs/entropy-mnemonics"
	siacrypto "go.sia.tech/siad/crypto"
	"lukechampine.com/frand"
)

var englishWordMap = func() map[string]bool {
	m := make(map[string]bool, len(mnemonics.EnglishDictionary))
	for _, v := range mnemonics.EnglishDictionary {
		m[v] = true
	}
	return m
}()

// NewSiaRecoveryPhrase creates a new unique 28 or 29 word wallet seed
func NewSiaRecoveryPhrase() (string, error) {
	var entropy [siacrypto.EntropySize]byte

	frand.Read(entropy[:])

	fullChecksum := siacrypto.HashObject(entropy)
	checksumSeed := append(entropy[:], fullChecksum[:SeedChecksumSize]...)
	phrase, err := mnemonics.ToPhrase(checksumSeed, mnemonics.DictionaryID("english"))

	if err != nil {
		return "", err
	}

	return phrase.String(), nil
}

// RecoverSiaSeed loads a standard 29 word wallet phrase.
// Wanted to import this directly from modules, but cannot because of bbolt
// https://go.sia.tech/siad/blob/fb65620/modules/go#L526
func RecoverSiaSeed(phrase, currency string) (*SeedWallet, error) {
	wallet := new(SeedWallet)

	for _, char := range phrase {
		if unicode.IsUpper(char) {
			return nil, errors.New("seed is not valid: all words must be lowercase")
		}

		if !unicode.IsLetter(char) && !unicode.IsSpace(char) {
			return nil, fmt.Errorf("seed is not valid: illegal character '%v'", char)
		}
	}

	words := strings.Fields(strings.TrimSpace(phrase))

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
	checksumSeedBytes, err := mnemonics.FromString(strings.Join(words, " "), mnemonics.DictionaryID("english"))

	if err != nil {
		return nil, err
	}

	if len(checksumSeedBytes) != 38 {
		return nil, fmt.Errorf("seed is not valid: wrong number of bytes %d expected 38", len(checksumSeedBytes))
	}

	copy(wallet.s[:], checksumSeedBytes)

	fullChecksum := siacrypto.HashObject(wallet.s)
	if len(checksumSeedBytes) != siacrypto.EntropySize+6 || !bytes.Equal(fullChecksum[:6], checksumSeedBytes[siacrypto.EntropySize:]) {
		return nil, fmt.Errorf("unable to validate seed: incorrect checksum: usually a flipped or missing word")
	}

	wallet.Currency = currency

	return wallet, nil
}
