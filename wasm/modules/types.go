package modules

import (
	"time"

	"github.com/siacentral/sia-lite-wallet-web/wasm/siacentral"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

type (
	//StorageContract a storage contract on the blockchain
	processedContract struct {
		ID                     string                   `json:"id"`
		BlockID                string                   `json:"block_id"`
		TransactionID          string                   `json:"transaction_id"`
		MerkleRoot             string                   `json:"merkle_root"`
		UnlockHash             string                   `json:"unlock_hash"`
		Status                 string                   `json:"status"`
		RevisionNumber         uint64                   `json:"revision_number"`
		NegotiationHeight      uint64                   `json:"negotiation_height"`
		ExpirationHeight       uint64                   `json:"expiration_height"`
		ProofDeadline          uint64                   `json:"proof_deadline"`
		ProofHeight            uint64                   `json:"proof_height"`
		Payout                 siatypes.Currency        `json:"payout"`
		FileSize               siatypes.Currency        `json:"file_size"`
		ValidProofOutputs      []processedSiacoinOutput `json:"valid_proof_outputs"`
		MissedProofOutputs     []processedSiacoinOutput `json:"missed_proof_outputs"`
		NegotiationTimestamp   time.Time                `json:"negotiation_timestamp"`
		ExpirationTimestamp    time.Time                `json:"expiration_timestamp"`
		ProofDeadlineTimestamp time.Time                `json:"proof_deadline_timestamp"`
		ProofTimestamp         time.Time                `json:"proof_timestamp"`
		ProofConfirmed         bool                     `json:"proof_confirmed"`
		Unused                 bool                     `json:"unused"`
	}

	processedTransaction struct {
		TransactionID     string                    `json:"transaction_id"`
		BlockHeight       uint64                    `json:"block_height"`
		Confirmations     uint64                    `json:"confirmations"`
		Fees              siatypes.Currency         `json:"fees"`
		SiacoinValue      processedTxnValue         `json:"siacoin_value"`
		SiafundValue      processedTxnValue         `json:"siafund_value"`
		Timestamp         time.Time                 `json:"timestamp"`
		Tags              []string                  `json:"tags"`
		SiacoinInputs     []processedSiacoinInput   `json:"siacoin_inputs"`
		SiacoinOutputs    []processedSiacoinOutput  `json:"siacoin_outputs"`
		SiafundOutputs    []processedSiafundOutput  `json:"siafund_outputs"`
		SiafundInputs     []processedSiafundInput   `json:"siafund_inputs"`
		Contracts         []processedContract       `json:"contracts"`
		ContractRevisions []processedContract       `json:"contract_revisions"`
		StorageProofs     []siacentral.StorageProof `json:"storage_proofs"`
		HostAnnouncements []siacentral.Announcement `json:"host_announcements"`
	}

	processedTxnValue struct {
		Value     siatypes.Currency `json:"value"`
		Direction string            `json:"direction"`
	}

	processedSiacoinOutput struct {
		siacentral.SiacoinOutput
		Owned bool `json:"owned"`
	}

	processedSiacoinInput struct {
		siacentral.SiacoinInput
		Owned bool `json:"owned"`
	}

	processedSiafundOutput struct {
		siacentral.SiafundOutput
		Owned bool `json:"owned"`
	}

	processedSiafundInput struct {
		siacentral.SiafundInput
		Owned bool `json:"owned"`
	}

	walletBalance struct {
		SiafundClaim            siatypes.Currency          `json:"siafund_claim"`
		Transactions            []processedTransaction     `json:"transactions"`
		UnspentSiacoinOutputs   []siacentral.SiacoinOutput `json:"unspent_siacoin_outputs"`
		UnspentSiafundOutputs   []siacentral.SiafundOutput `json:"unspent_siafund_outputs"`
		SpentSiacoinOutputs     []string                   `json:"spent_siacoin_outputs"`
		SpentSiafundOutputs     []string                   `json:"spent_siafund_outputs"`
		ConfirmedSiafundBalance siatypes.Currency          `json:"confirmed_siafund_balance"`
		ConfirmedSiacoinBalance siatypes.Currency          `json:"confirmed_siacoin_balance"`
		UnconfirmedSiacoinDelta string                     `json:"unconfirmed_siacoin_delta"`
		UnconfirmedSiafundDelta string                     `json:"unconfirmed_siafund_delta"`
	}

	// UnsignedTransaction a transaction and the required signature indices to sign that transaction
	UnsignedTransaction struct {
		Transaction  siatypes.Transaction `json:"transaction"`
		RequiredSigs []uint64             `json:"requiredSignatures"`
	}
)
