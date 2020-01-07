package modules

import (
	"time"

	apitypes "github.com/siacentral/apisdkgo/types"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

type (
	//StorageContract a storage contract on the blockchain
	processedContract struct {
		ID                     string            `json:"id"`
		BlockID                string            `json:"block_id"`
		TransactionID          string            `json:"transaction_id"`
		MerkleRoot             string            `json:"merkle_root"`
		UnlockHash             string            `json:"unlock_hash"`
		Status                 string            `json:"status"`
		RevisionNumber         uint64            `json:"revision_number"`
		NegotiationHeight      uint64            `json:"negotiation_height"`
		ExpirationHeight       uint64            `json:"expiration_height"`
		ProofDeadline          uint64            `json:"proof_deadline"`
		ProofHeight            uint64            `json:"proof_height"`
		Payout                 siatypes.Currency `json:"payout"`
		FileSize               siatypes.Currency `json:"file_size"`
		ValidProofOutputs      []processedOutput `json:"valid_proof_outputs"`
		MissedProofOutputs     []processedOutput `json:"missed_proof_outputs"`
		NegotiationTimestamp   time.Time         `json:"negotiation_timestamp"`
		ExpirationTimestamp    time.Time         `json:"expiration_timestamp"`
		ProofDeadlineTimestamp time.Time         `json:"proof_deadline_timestamp"`
		ProofTimestamp         time.Time         `json:"proof_timestamp"`
		ProofConfirmed         bool              `json:"proof_confirmed"`
		Unused                 bool              `json:"unused"`
	}

	processedTransaction struct {
		TransactionID     string                  `json:"transaction_id"`
		Direction         string                  `json:"direction"`
		BlockHeight       uint64                  `json:"block_height"`
		Confirmations     uint64                  `json:"confirmations"`
		Fees              siatypes.Currency       `json:"fees"`
		Value             siatypes.Currency       `json:"value"`
		Timestamp         time.Time               `json:"timestamp"`
		Tags              []string                `json:"tags"`
		SiacoinInputs     []processedInput        `json:"siacoin_inputs"`
		SiacoinOutputs    []processedOutput       `json:"siacoin_outputs"`
		Contracts         []processedContract     `json:"contracts"`
		ContractRevisions []processedContract     `json:"contract_revisions"`
		StorageProofs     []apitypes.StorageProof `json:"storage_proofs"`
		HostAnnouncements []apitypes.Announcement `json:"host_announcements"`
	}

	processedOutput struct {
		apitypes.SiacoinOutput
		Owned bool `json:"owned"`
	}

	processedInput struct {
		apitypes.SiacoinInput
		Owned bool `json:"owned"`
	}

	transactionResp struct {
		Transactions     []processedTransaction   `json:"transactions"`
		UnspentOutputs   []apitypes.SiacoinOutput `json:"unspent_outputs"`
		UnconfirmedSpent []string                 `json:"unconfirmed_spent"`
		ConfirmedBalance siatypes.Currency        `json:"confirmed_balance"`
		UnconfirmedDelta string                   `json:"unconfirmed_delta"`
	}
)
