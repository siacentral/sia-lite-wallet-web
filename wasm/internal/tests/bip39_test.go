package tests

import (
	"bytes"
	"encoding/hex"
	"testing"

	"go.sia.tech/core/types"
	"go.sia.tech/coreutils/wallet"
)

// TestBIP39Golden pins the 12-word BIP39 phrase->seed->address contract used by
// the JS seed screens. The constants are produced by coreutils, not hand-typed.
func TestBIP39Golden(t *testing.T) {
	const (
		goldenPhrase  = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
		goldenSeedHex = "94c1c088cc9453996779630ad3af45cbd92814828dd784cf2aa12df95d1b8afe"
		goldenAddr0   = "a2a3773f76136bdb05a0ff79a0f4fcc2826436794f8db36db6408355c5ca32345002db43c2eb"
	)

	expectedSeed, err := hex.DecodeString(goldenSeedHex)
	if err != nil {
		t.Fatal(err)
	}

	var seed [32]byte
	if err = wallet.SeedFromPhrase(&seed, goldenPhrase); err != nil {
		t.Fatal(err)
	} else if !bytes.Equal(seed[:], expectedSeed) {
		t.Fatalf("unexpected seed: expected %x, got %x", expectedSeed, seed)
	}

	addr := types.StandardUnlockHash(wallet.KeyFromSeed(&seed, 0).PublicKey())
	if addr.String() != goldenAddr0 {
		t.Fatalf("unexpected address: expected %q, got %q", goldenAddr0, addr.String())
	}
}

// TestBIP39RejectsBadChecksum confirms the WASM validation path rejects a
// phrase whose final word fails the BIP39 checksum.
func TestBIP39RejectsBadChecksum(t *testing.T) {
	const badPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"

	var seed [32]byte
	if err := wallet.SeedFromPhrase(&seed, badPhrase); err == nil {
		t.Fatal("expected checksum error for bad BIP39 phrase")
	}
}
