package modules

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"syscall/js"

	"github.com/shopspring/decimal"
	"github.com/siacentral/sia-lite-wallet-web/wasm/siacentral"
	siatypes "go.sia.tech/siad/types"
)

type (
	exportTransaction struct {
		ID             string
		BlockHeight    uint64
		BlockIndex     int
		Type           string
		SiacoinInputs  siatypes.Currency
		SiacoinOutputs siatypes.Currency
		SiafundInputs  siatypes.Currency
		SiafundOutputs siatypes.Currency
		Fee            siatypes.Currency
		CostBasis      siacentral.CostBasis
		Timestamp      time.Time
	}

	apiResults struct {
		Done         bool
		Transactions []exportTransaction
	}
)

func transactionType(txn siacentral.Transaction, currency string) string {
	if len(txn.SiafundInputs) != 0 && len(txn.SiafundOutputs) != 0 {
		return "Siafund Transaction"
	}

	if len(txn.SiacoinInputs) == 0 && len(txn.SiacoinOutputs) != 0 {
		switch txn.SiacoinOutputs[0].Source {
		case "contract_valid_output":
			fallthrough
		case "contract_missed_output":
			return "Contract Completion"
		case "block_reward":
			return "Block Reward"
		case "siafund_claim":
			return "Siafund Dividend"
		default:
			return txn.SiacoinOutputs[0].Source
		}
	}

	if len(txn.StorageProofs) != 0 {
		return "Storage Proof"
	}

	if len(txn.StorageContracts) != 0 && len(txn.ContractRevisions) != 0 {
		return "Contract Renewal"
	}

	if len(txn.StorageContracts) != 0 {
		return "Contract Formation"
	}

	if len(txn.ContractRevisions) != 0 {
		return "Contract Revision"
	}

	if len(txn.HostAnnouncements) != 0 {
		return "Host Announcement"
	}
	return "Siacoin Transaction"
}

// feesPaid attempts to determine if the wallet owner paid the transaction fees of if
// another party paid the fee.
func feesPaid(txn siacentral.Transaction, ownedInput, unownedInput siatypes.Currency, ownedOutput, unownedOutput siatypes.Currency) siatypes.Currency {
	if unownedInput.Equals64(0) {
		return txn.Fees
	}

	if txn.Fees.Cmp(ownedInput) == 1 || ownedOutput.Cmp(ownedInput) == 1 {
		return siatypes.ZeroCurrency
	}

	return txn.Fees
}

func siacoinString(c siatypes.Currency, currency string) string {
	var precision int32 = -24
	d := decimal.NewFromBigInt(c.Big(), precision)

	return d.String()
}

func siafundString(c siatypes.Currency) string {
	return c.String()
}

func exportAddressWorker(ownedAddresses map[string]bool, walletCurrency, displayCurrency string, work <-chan []string, results chan<- apiResults, errors chan<- error) {
	for addresses := range work {
		for j := 0; j < 1e4; j++ {
			var transactions []exportTransaction

			apiclient := siacentralAPIClient(walletCurrency)

			balanceResp, err := apiclient.FindAddressBalance(500, j, displayCurrency, addresses)
			if err != nil {
				errors <- fmt.Errorf("unable to get wallet transactions: %s", err)
				return
			}

			if len(balanceResp.Transactions) == 0 {
				break
			}

			for _, txn := range balanceResp.Transactions {
				var unownedInputs, unownedOutputs siatypes.Currency

				ownedInputs := 0
				exportTxn := exportTransaction{
					ID:          txn.ID,
					BlockHeight: txn.BlockHeight,
					BlockIndex:  txn.BlockIndex,
					Type:        transactionType(txn, walletCurrency),
					Timestamp:   txn.Timestamp,
					CostBasis:   txn.ExchangeRate,
				}

				for _, output := range txn.SiacoinOutputs {
					if _, exists := ownedAddresses[output.UnlockHash]; !exists {
						unownedOutputs = unownedOutputs.Add(output.Value)
						continue
					}

					exportTxn.SiacoinOutputs = exportTxn.SiacoinOutputs.Add(output.Value)
				}

				for _, input := range txn.SiacoinInputs {
					if _, exists := ownedAddresses[input.UnlockHash]; !exists {
						unownedInputs = unownedInputs.Add(input.Value)
						continue
					}

					exportTxn.SiacoinInputs = exportTxn.SiacoinInputs.Add(input.Value)
					ownedInputs++
				}

				for _, output := range txn.SiafundOutputs {
					if _, exists := ownedAddresses[output.UnlockHash]; !exists {
						continue
					}

					exportTxn.SiafundOutputs = exportTxn.SiafundOutputs.Add(output.Value)
				}

				for _, input := range txn.SiafundInputs {
					if _, exists := ownedAddresses[input.UnlockHash]; !exists {
						continue
					}

					exportTxn.SiafundInputs = exportTxn.SiafundInputs.Add(input.Value)
				}

				exportTxn.Fee = feesPaid(txn, exportTxn.SiacoinInputs, unownedInputs, exportTxn.SiacoinOutputs, unownedOutputs)

				transactions = append(transactions, exportTxn)
			}

			results <- apiResults{
				Transactions: transactions,
			}
		}

		results <- apiResults{
			Done: true,
		}
	}
}

// ExportTransactions gets all transactions belonging to the addresses
func ExportTransactions(addresses []string, walletCurrency, displayCurrency string, min, max time.Time, callback js.Value) {
	var currencyLabel, fundLabel string

	var buf []byte
	var transactions []exportTransaction
	var matching uint64

	switch walletCurrency {
	default:
		currencyLabel = "SC"
		fundLabel = "SF"
	}

	ownedAddresses := make(map[string]bool)
	count := len(addresses)

	for _, addr := range addresses {
		ownedAddresses[addr] = true
	}

	rounds := int(math.Ceil(float64(len(addresses)) / 1000))
	work := make(chan []string, workers)
	results := make(chan apiResults)
	errors := make(chan error, 1)

	for i := 0; i < workers; i++ {
		go exportAddressWorker(ownedAddresses, walletCurrency, displayCurrency, work, results, errors)
	}

	go func() {
		for i := 0; i < count; i += 1000 {
			end := i + 1000

			if end > count {
				end = count
			}

			work <- addresses[i:end]
		}
	}()

	walletTransactions := make(map[string]bool)

	for n := rounds; n > 0; {
		select {
		case res := <-results:
			for _, txn := range res.Transactions {
				if _, exists := walletTransactions[txn.ID]; exists {
					continue
				}

				walletTransactions[txn.ID] = true

				if txn.SiacoinOutputs.Equals(txn.SiacoinInputs) && txn.SiafundOutputs.Equals(txn.SiafundInputs) {
					continue
				}

				if (min.IsZero() || txn.Timestamp.After(min)) && (max.IsZero() || txn.Timestamp.Before(max)) {
					matching++
				}

				transactions = append(transactions, txn)
			}

			if res.Done {
				n--
			}

			callback.Invoke("progress", map[string]interface{}{
				"progress":     int(100 - math.Ceil((float64(n) / float64(rounds) * 100))),
				"transactions": len(transactions),
				"matching":     matching,
				"addresses":    len(addresses),
			})
		case err := <-errors:
			if err != nil {
				callback.Invoke(err.Error(), js.Null())
				return
			}
		}
	}

	close(work)
	close(results)
	close(errors)

	sort.Slice(transactions, func(i, j int) bool {
		if transactions[i].BlockHeight != transactions[j].BlockHeight {
			return transactions[i].BlockHeight < transactions[j].BlockHeight
		} else if transactions[i].BlockIndex != transactions[j].BlockIndex {
			return transactions[i].BlockIndex < transactions[j].BlockIndex
		}
		return false
	})

	out := bytes.NewBuffer(buf)
	cw := csv.NewWriter(out)
	siacoinBalance := siatypes.ZeroCurrency
	siafundBalance := siatypes.ZeroCurrency

	cw.Write([]string{
		"ID",
		"Type",
		"Timestamp",
		fmt.Sprintf("Exchange Rate (%s)", strings.ToUpper(displayCurrency)),
		"Fee",
		fmt.Sprintf("Fee (%s)", strings.ToUpper(displayCurrency)),
		fmt.Sprintf("%s Amount", currencyLabel),
		fmt.Sprintf("%s Cost Basis (%s)", currencyLabel, strings.ToUpper(displayCurrency)),
		fmt.Sprintf("%s Balance", currencyLabel),
		fmt.Sprintf("%s Amount", fundLabel),
		fmt.Sprintf("%s Balance", fundLabel),
	})

	for _, txn := range transactions {
		var siacoinAmount, siafundAmount string

		siacoinBalance = siacoinBalance.Add(txn.SiacoinOutputs).Sub(txn.SiacoinInputs)
		siafundBalance = siafundBalance.Add(txn.SiafundOutputs).Sub(txn.SiafundInputs)

		if txn.SiacoinInputs.Cmp(txn.SiacoinOutputs) == 1 {
			siacoinAmount = "-" + siacoinString(txn.SiacoinInputs.Sub(txn.SiacoinOutputs), walletCurrency)
		} else {
			siacoinAmount = siacoinString(txn.SiacoinOutputs.Sub(txn.SiacoinInputs), walletCurrency)
		}

		if txn.SiafundInputs.Cmp(txn.SiafundOutputs) == 1 {
			siafundAmount = "-" + siafundString(txn.SiafundInputs.Sub(txn.SiafundOutputs))
		} else {
			siafundAmount = siafundString(txn.SiafundOutputs.Sub(txn.SiafundInputs))
		}

		if (!min.IsZero() && txn.Timestamp.Before(min)) || (!max.IsZero() && txn.Timestamp.After(max)) {
			continue
		}

		siacoinCostBasis := decimal.NewFromBigInt(txn.SiacoinOutputs.Big(), -24).
			Sub(decimal.NewFromBigInt(txn.SiacoinInputs.Big(), -24)).
			Mul(txn.CostBasis.Rate)

		feeCostBasis := decimal.NewFromBigInt(txn.Fee.Big(), -24).Mul(txn.CostBasis.Rate)

		err := cw.Write([]string{
			txn.ID,
			txn.Type,
			txn.Timestamp.Local().Format(time.RFC1123Z),
			txn.CostBasis.Rate.Round(4).String(),
			siacoinString(txn.Fee, walletCurrency),
			feeCostBasis.Round(4).String(),
			siacoinAmount,
			siacoinCostBasis.Round(4).String(),
			siacoinString(siacoinBalance, walletCurrency),
			siafundAmount,
			siafundString(siafundBalance),
		})
		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}
	}

	cw.Flush()
	callback.Invoke(js.Null(), out.String())
}
