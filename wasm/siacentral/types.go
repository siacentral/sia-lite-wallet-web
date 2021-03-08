package siacentral

import (
	"time"

	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

type (
	// response generic api response
	response struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	}

	// AddressUsage AddressUsage
	AddressUsage struct {
		Address   string `json:"address"`
		UsageType string `json:"usage_type"`
	}

	//Announcement a host announcement on the blockchain
	Announcement struct {
		TransactionID string    `json:"transaction_id"`
		BlockID       string    `json:"block_id"`
		PublicKey     string    `json:"public_key"`
		NetAddress    string    `json:"net_address"`
		Height        uint64    `json:"block_height"`
		Timestamp     time.Time `json:"timestamp,omitempty"`
	}

	//Block a block on the Sia blockchain
	Block struct {
		ID                string          `json:"id"`
		ParentID          string          `json:"parent_id"`
		Height            uint64          `json:"height"`
		Nonce             [8]byte         `json:"nonce"`
		HostAnnouncements []Announcement  `json:"host_announcements"`
		SiacoinOutputs    []SiacoinOutput `json:"siacoin_outputs"`
		Transactions      []Transaction   `json:"transactions"`
		Timestamp         time.Time       `json:"timestamp"`
	}

	//CoveredFields the covered fields of a transaction signature and their indexes
	CoveredFields struct {
		WholeTransaction         bool     `json:"whole_transaction"`
		SiacoinInputs            []uint64 `json:"siacoin_inputs"`
		SiacoinOutputs           []uint64 `json:"siacoin_outputs"`
		StorageContracts         []uint64 `json:"storage_contracts"`
		StorageContractRevisions []uint64 `json:"storage_contract_revisions"`
		StorageProofs            []uint64 `json:"storage_proofs"`
		MinerFees                []uint64 `json:"miner_fees"`
		ArbitraryData            []uint64 `json:"arbitrary_data"`
		TransactionSignatures    []uint64 `json:"transaction_signatures"`
	}

	//SiacoinInput an input of siacoins for a transaction
	SiacoinInput struct {
		OutputID         string            `json:"output_id"`
		TransactionID    string            `json:"transaction_id,omitempty"`
		BlockID          string            `json:"block_id,omitempty"`
		Source           string            `json:"source"`
		UnlockHash       string            `json:"unlock_hash"`
		BlockHeight      uint64            `json:"block_height"`
		Value            siatypes.Currency `json:"value"`
		UnlockConditions UnlockCondition   `json:"unlock_conditions"`
	}

	//SiacoinOutput an output of siacoins for a transaction
	SiacoinOutput struct {
		BlockID            string            `json:"block_id,omitempty"`
		OutputID           string            `json:"output_id"`
		TransactionID      string            `json:"transaction_id,omitempty"`
		Source             string            `json:"source"`
		UnlockHash         string            `json:"unlock_hash"`
		SpentTransactionID *string           `json:"spent_transaction_id"`
		MaturityHeight     uint64            `json:"maturity_height"`
		BlockHeight        uint64            `json:"block_height"`
		Value              siatypes.Currency `json:"value"`
	}

	//SiafundInput an input of siafunds for a transaction
	SiafundInput struct {
		OutputID         string            `json:"output_id"`
		BlockID          string            `json:"block_id,omitempty"`
		ClaimOutputID    string            `json:"claim_output_id"`
		ClaimUnlockHash  string            `json:"claim_unlock_hash"`
		TransactionID    string            `json:"transaction_id,omitempty"`
		UnlockHash       string            `json:"unlock_hash"`
		BlockHeight      uint64            `json:"block_height"`
		Value            siatypes.Currency `json:"value"`
		ClaimValue       siatypes.Currency `json:"claim_value"`
		UnlockConditions UnlockCondition   `json:"unlock_conditions"`
	}

	//SiafundOutput an output of siafunds for a transaction
	SiafundOutput struct {
		OutputID           string            `json:"output_id"`
		TransactionID      string            `json:"transaction_id,omitempty"`
		BlockID            string            `json:"block_id,omitempty"`
		SpentTransactionID *string           `json:"spent_transaction_id"`
		UnlockHash         string            `json:"unlock_hash"`
		BlockHeight        uint64            `json:"block_height"`
		Value              siatypes.Currency `json:"value"`
		ClaimStart         siatypes.Currency `json:"claim_start"`
		ClaimValue         siatypes.Currency `json:"claim_value"`
	}

	//StorageContract a storage contract on the blockchain
	StorageContract struct {
		ID                     string            `json:"id"`
		MerkleRoot             string            `json:"merkle_root"`
		TransactionID          string            `json:"transaction_id"`
		Status                 string            `json:"status"`
		UnlockHash             string            `json:"unlock_hash"`
		ExpirationHeight       uint64            `json:"expiration_height"`
		NegotiationHeight      uint64            `json:"negotiation_height"`
		ProofDeadline          uint64            `json:"proof_deadline"`
		ProofHeight            uint64            `json:"proof_height"`
		RevisionNumber         uint64            `json:"revision_number"`
		ProofConfirmed         bool              `json:"proof_confirmed"`
		Unused                 bool              `json:"unused"`
		FileSize               siatypes.Currency `json:"file_size"`
		Payout                 siatypes.Currency `json:"payout"`
		MissedProofOutputs     []SiacoinOutput   `json:"missed_proof_outputs"`
		ValidProofOutputs      []SiacoinOutput   `json:"valid_proof_outputs"`
		ExpirationTimestamp    time.Time         `json:"expiration_timestamp"`
		NegotiationTimestamp   time.Time         `json:"negotiation_timestamp"`
		ProofDeadlineTimestamp time.Time         `json:"proof_deadline_timestamp"`
		ProofTimestamp         time.Time         `json:"proof_timestamp"`
		PreviousRevisions      []StorageContract `json:"previous_revisions,omitempty"`
	}

	//StorageProof a storage proof on the blockchain
	StorageProof struct {
		ContractID            string    `json:"contract_id"`
		TransactionID         string    `json:"transaction_id"`
		TransactionBlockIndex int       `json:"-"`
		BlockID               string    `json:"block_id"`
		BlockHeight           uint64    `json:"block_height"`
		Segment               [64]byte  `json:"segment"`
		Hashset               []string  `json:"hashset"`
		Timestamp             time.Time `json:"timestamp"`
	}

	//TransactionSignature a signature verifying a part of the transaction
	TransactionSignature struct {
		ParentID       string        `json:"parent_id"`
		TransactionID  string        `json:"transaction_id"`
		BlockID        string        `json:"block_id"`
		Signature      string        `json:"signature"`
		PublicKeyIndex uint64        `json:"public_key_index"`
		CoveredFields  CoveredFields `json:"covered_fields"`
	}

	// Transaction a Sia transaction
	Transaction struct {
		ID                    string                 `json:"id"`
		BlockID               string                 `json:"block_id"`
		BlockHeight           uint64                 `json:"block_height,omitempty"`
		Confirmations         uint64                 `json:"confirmations"`
		Timestamp             time.Time              `json:"timestamp"`
		Size                  siatypes.Currency      `json:"size"`
		Fees                  siatypes.Currency      `json:"fees"`
		SiacoinInputs         []SiacoinInput         `json:"siacoin_inputs"`
		SiacoinOutputs        []SiacoinOutput        `json:"siacoin_outputs"`
		SiafundInputs         []SiafundInput         `json:"siafund_inputs"`
		SiafundOutputs        []SiafundOutput        `json:"siafund_outputs"`
		StorageContracts      []StorageContract      `json:"storage_contracts"`
		ContractRevisions     []StorageContract      `json:"contract_revisions"`
		StorageProofs         []StorageProof         `json:"storage_proofs"`
		HostAnnouncements     []Announcement         `json:"host_announcements"`
		ArbitraryData         [][]byte               `json:"arbitrary_data"`
		TransactionSignatures []TransactionSignature `json:"transaction_signatures"`
	}

	//UnlockCondition unlock conditions of a transaction input
	UnlockCondition struct {
		Timelock           uint64   `json:"timelock"`
		RequiredSignatures uint64   `json:"required_signatures"`
		PublicKeys         []string `json:"public_keys"`
	}

	// WalletBalance transactions and current balance of a wallet
	WalletBalance struct {
		SiafundClaim              siatypes.Currency `json:"siafund_claim"`
		UnspentSiacoins           siatypes.Currency `json:"unspent_siacoins"`
		UnspentSiafunds           siatypes.Currency `json:"unspent_siafunds"`
		SpentSiacoinOutputs       []string          `json:"spent_siacoin_outputs"`
		SpentSiafundOutputs       []string          `json:"spent_siafund_outputs"`
		Transactions              []Transaction     `json:"transactions"`
		UnconfirmedTransactions   []Transaction     `json:"unconfirmed_transactions"`
		UnconfirmedSiacoinOutputs []SiacoinOutput   `json:"unconfirmed_siacoin_outputs"`
		UnspentSiacoinOutputs     []SiacoinOutput   `json:"unspent_siacoin_outputs"`
		UnconfirmedSiafundOutputs []SiafundOutput   `json:"unconfirmed_siafund_outputs"`
		UnspentSiafundOutputs     []SiafundOutput   `json:"unspent_siafund_outputs"`
	}

	// transactionsResp response containing a wallets transactions
	transactionsResp struct {
		response
		WalletBalance
	}

	addressesResp struct {
		response
		Addresses []AddressUsage `json:"addresses"`
	}

	blockResp struct {
		response
		Block Block `json:"block"`
	}
)
