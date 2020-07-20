package modules

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"log"
	"math"
	"sort"
	"strings"
	"time"

	"syscall/js"

	"github.com/shopspring/decimal"
	apiclient "github.com/siacentral/apisdkgo"
	"github.com/siacentral/apisdkgo/types"
	siatypes "gitlab.com/NebulousLabs/Sia/types"
)

type exportTransaction struct {
	ID        string
	Type      string
	Inputs    siatypes.Currency
	Outputs   siatypes.Currency
	Timestamp time.Time
}

func transactionType(txn types.Transaction) string {
	if len(txn.SiafundInputs) != 0 && len(txn.SiafundOutputs) != 0 {
		return "Siafund Transaction"
	}

	if len(txn.SiacoinInputs) == 0 && len(txn.SiacoinOutputs) != 0 {
		return txn.SiacoinOutputs[0].Source
	}

	if len(txn.StorageProofs) != 0 {
		return "Storage Proof"
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

func currencyString(c siatypes.Currency) string {
	d := decimal.NewFromBigInt(c.Big(), -24)

	return fmt.Sprintf("%s SC", d)
}

func addressWorker(ownedAddresses map[string]bool, work <-chan []string, results chan<- []exportTransaction, errors chan<- error) {
	for addresses := range work {
		var transactions []exportTransaction

		for j := 0; j < 1e4; j++ {
			balanceResp, err := apiclient.FindAddressBalance(500, j, addresses)
			if err != nil {
				errors <- fmt.Errorf("unable to get wallet transactions: %s", err)
				return
			}

			if len(balanceResp.Transactions) == 0 {
				break
			}

			for _, txn := range balanceResp.Transactions {
				exportTxn := exportTransaction{
					ID:        txn.ID,
					Type:      transactionType(txn),
					Timestamp: txn.Timestamp,
				}

				if strings.HasPrefix(txn.ID, "nontxn") && len(txn.SiacoinOutputs) != 0 {
					exportTxn.Type = txn.SiacoinOutputs[0].Source
				}

				for _, output := range txn.SiacoinOutputs {
					if _, exists := ownedAddresses[output.UnlockHash]; !exists {
						continue
					}

					exportTxn.Outputs = exportTxn.Outputs.Add(output.Value)
				}

				for _, input := range txn.SiacoinInputs {
					if _, exists := ownedAddresses[input.UnlockHash]; !exists {
						continue
					}

					exportTxn.Inputs = exportTxn.Inputs.Add(input.Value)
				}

				if exportTxn.Outputs.Equals(exportTxn.Inputs) {
					continue
				}

				transactions = append(transactions, exportTxn)
			}
		}

		results <- transactions
	}
}

//ExportTransactions gets all transactions belonging to the addresses
func ExportTransactions(addresses []string, callback js.Value) {
	var buf []byte
	var transactions []exportTransaction

	ownedAddresses := make(map[string]bool)
	count := len(addresses)

	for _, addr := range addresses {
		ownedAddresses[addr] = true
	}

	rounds := int(math.Ceil(float64(len(addresses)) / 5000))

	work := make(chan []string, 5)
	results := make(chan []exportTransaction)
	errors := make(chan error, 1)

	log.Println(len(addresses), rounds)

	for i := 0; i < 5; i++ {
		go addressWorker(ownedAddresses, work, results, errors)
	}

	go func() {
		for i := 0; i < count; i += 5000 {
			var round []string

			end := i + 5000

			if len(addresses) < end {
				end = len(addresses)
			}

			for _, addr := range addresses[i:end] {
				round = append(round, addr)
			}

			work <- round
		}
	}()

	walletTransactions := make(map[string]bool)

	for n := rounds; n > 0; {
		select {
		case res := <-results:
			for _, txn := range res {
				if _, exists := walletTransactions[txn.ID]; exists {
					continue
				}

				walletTransactions[txn.ID] = true
				transactions = append(transactions, txn)
			}

			n--
			callback.Invoke("progress", map[string]interface{}{
				"progress":     int(100 - math.Ceil((float64(n) / float64(rounds) * 100))),
				"transactions": len(transactions),
				"addresses":    len(addresses),
			})
		case err := <-errors:
			if err != nil {
				callback.Invoke(err.Error(), js.Null())
				return
			}
		}
	}

	log.Println(len(transactions))

	close(work)
	close(results)
	close(errors)

	sort.Slice(transactions, func(i, j int) bool {
		return transactions[i].Timestamp.Before(transactions[j].Timestamp)
	})

	out := bytes.NewBuffer(buf)
	cw := csv.NewWriter(out)
	balance := siatypes.ZeroCurrency

	cw.Write([]string{
		"ID",
		"Type",
		"Timestamp",
		"Amount",
		"Balance",
	})

	for _, txn := range transactions {
		var fee, amount string

		balance = balance.Sub(txn.Inputs).Add(txn.Outputs)

		if txn.Inputs.Cmp(txn.Outputs) == 1 {
			amount = "-" + currencyString(txn.Inputs.Sub(txn.Outputs))
		} else {
			amount = currencyString(txn.Outputs.Sub(txn.Inputs))
		}

		err := cw.Write([]string{
			txn.ID,
			txn.Type,
			txn.Timestamp.UTC().Format(time.RFC1123Z),
			amount,
			fee,
			currencyString(balance),
		})
		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}
	}

	cw.Flush()
	callback.Invoke(js.Null(), string(out.Bytes()))
}
