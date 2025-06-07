package siad

import (
	"bytes"
	"encoding/hex"
	"testing"

	"go.sia.tech/core/types"
	"go.sia.tech/coreutils/wallet"
)

func TestMnemonic28(t *testing.T) {
	const phrase = "rodent colony illness junk waist leopard pierce oust wield viewpoint slackens axis jittery vampire rockets cistern eels oaks cell emotion eagle vortex pests cedar business cactus inorganic cocoa"

	expectedSeed, err := hex.DecodeString("0da9b0562d06a6142a5e7f5a8073e01631981a7968c6070f7e4e177ae333f3c1")
	if err != nil {
		t.Fatal(err)
	}

	expectedAddresses := map[uint64]string{
		0:                    "46446ff0e159e326d9794bb9814744cf50e4c3138874b42b72e849392f096bc6e5398dc9b3e9",
		1:                    "2a3236826809a14ae4fed7d461f148762711152e1bacd564079e2fe98fa24830c91c9ea5b3d1",
		2:                    "362c160b779ed1d6150f2292a25cbe0c7b630c0d129d1622a6e366c3e8d4bdfeb64ca30c61a5",
		3:                    "e6e15c4672ef59cdb6113ef55914446f5015dccb5b377881507f4745c11333576383f7ea8d3c",
		4:                    "975faa56ce1bdf760dc46f8b81ef54f8e227f8de3fc224b0e330e562e7d7cd899381d7b21944",
		5:                    "57da3c006d2fa64b81e8e4b94961efaee7d138a79c0ec92e9aef94c8551c2bfd32b217b55b9c",
		100:                  "8e8fb4c3449d1e7eca7f2913893785379bd0d28464315a465b2d003caf33f935bf647696e683",
		256:                  "7f3f65b1f215dce63405091fcd9d5ee29ac0610dc38f5e83063fee3b3dec02f5a3f324a8fac2",
		1000:                 "024a6d1c32a25ff80805f10d2c9e44cd8977e958b9228a61b2295e43056dcda429e934aa73ff",
		1001:                 "d4c23dfa7570fe1e3784183db84a3ddaaba8f4a0116262b71be9b81bfb2023b83a18e29ad7ca",
		9223372036854775807:  "bb1e2377bbd5af91fd17db201c5882a91173e77f1dbc72d5eaac1a93acc72d745f78062104e1",
		18446744073709551615: "65a526e0fd14b3fe2ecdd03364e63b8003e73ecdc4c8ec140766591c9e94b077ad8257eb3255",
	}

	var seed [32]byte
	if err = SeedFromPhrase(&seed, phrase); err != nil {
		t.Fatal(err)
	} else if !bytes.Equal(seed[:], expectedSeed) {
		t.Fatalf("unexpected seed: expected %x, got %x", expectedSeed, seed)
	}

	for i, expected := range expectedAddresses {
		addr := types.StandardUnlockHash(wallet.KeyFromSeed(&seed, i).PublicKey())
		if addr.String() != expected {
			t.Fatalf("unexpected address: expected %q, got %q", expected, addr.String())
		}
	}

	roundtrip := SeedToPhrase(&seed)
	if roundtrip != phrase {
		t.Fatalf("roundtrip failed: expected %q, got %q", phrase, roundtrip)
	}
}

func TestMnemonic29(t *testing.T) {
	const phrase = "mocked southern dehydrate unusual navy pegs aided ruined festival yearbook total building wife greater befit drunk judge thwart erosion hefty saucepan hijack request welders bomb remedy each sayings actress"

	expectedSeed, err := hex.DecodeString("de67ef93cd0adb3418aa4ce71d2504636533b36d36a0d5211bfccc331dea7b41")
	if err != nil {
		t.Fatal(err)
	}

	expectedAddresses := map[uint64]string{
		0:                    "744584e33df37f0f80a0904bba9d2a49eab1a740688c30cd100a662e096ada0941ab1076a84b",
		1:                    "2ff6a95ff4e9c182a87c9bfadccaa683efa6c4c76eff029cf020b1a027e85de785f916c16037",
		2:                    "5066c72993c12cd3e891fab423f8263e6178fedccdc82c4a227d9cbf4ff48a960c06a74815d7",
		3:                    "ccc4c3d5f1ea9d1a8884084951e39d801ed282372e555fbcb9240b61de94e4546b71067bd33a",
		4:                    "759dfb6fb93c26569156e23dd28700bffac5f3e2e42f5656ab5e24913b76df23b6e67321e901",
		5:                    "bbba104ef6aa42961c639911680bfa961c51a4e127d886048519d626516bc01e0e338ca75f21",
		100:                  "a3950c4e10699bcd1f27a986ee37a9667809fc992de2eea5fc3044d10da03937890527dffef7",
		256:                  "7d7957f4555fa7c5b9fc88ead8241759875ff580e816f525443fc9d33e1852cc1fcd8532f40a",
		1000:                 "53fa4781db4234534e6a27ed263c3c98feae12f9546fa9c08f76cc5646eaba13ae843e9aab75",
		1001:                 "8fdc032227fa40ce376469b792cdb762194435f81a0a15813e09d03dac7f4b16b7a5be48202d",
		9223372036854775807:  "44a5019071a2c6b9633a16c654bee5c4f576acb0329f555317c974f84f3cfef746708ce85442",
		18446744073709551615: "66fc751bb94f4706d067f3f71f36aa34be558257ee67a32b9892257325c2b64b98aef427b7d6",
	}

	var seed [32]byte
	if err = SeedFromPhrase(&seed, phrase); err != nil {
		t.Fatal(err)
	} else if !bytes.Equal(seed[:], expectedSeed) {
		t.Fatalf("unexpected seed: expected %x, got %x", expectedSeed, seed)
	}

	for i, expected := range expectedAddresses {
		addr := types.StandardUnlockHash(wallet.KeyFromSeed(&seed, i).PublicKey())
		if addr.String() != expected {
			t.Fatalf("unexpected address: expected %q, got %q", expected, addr.String())
		}
	}

	roundtrip := SeedToPhrase(&seed)
	if roundtrip != phrase {
		t.Fatalf("roundtrip failed: expected %q, got %q", phrase, roundtrip)
	}
}
