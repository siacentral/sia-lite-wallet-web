package modules

import (
	"fmt"
	"log"
	"sync"
	"syscall/js"

	"github.com/siacentral/sia-lite-wallet-web/wasm/wallet"
)

type (
	recoveryWork struct {
		Round, Start, End uint64
	}

	recoveredAddress struct {
		Address          string                  `json:"address"`
		UsageType        string                  `json:"usage_type"`
		Index            uint64                  `json:"index"`
		UnlockConditions wallet.UnlockConditions `json:"unlock_conditions"`
	}

	recoveryResults struct {
		Round, LastUsedIndex, Start, End uint64
		LastUsedType                     string
		Addresses                        []recoveredAddress
		Error                            error
	}
)

func generateAddress(w *wallet.SeedWallet, i uint64) recoveredAddress {
	key := w.GetAddress(i)
	addr := recoveredAddress{
		Address:          key.UnlockConditions.UnlockHash().String(),
		Index:            i,
		UnlockConditions: mapUnlockConditions(key.UnlockConditions),
	}

	return addr
}

func recoveryWorker(w *wallet.SeedWallet, currency string, work <-chan recoveryWork, results chan<- recoveryResults) {
	for r := range work {
		var addresses []string
		recovered := recoveryResults{
			Round: r.Round,
			Start: r.Start,
			End:   r.End,
		}

		addressMap := make(map[string]recoveredAddress)

		for i := r.Start; i < r.End; i++ {
			addr := generateAddress(w, i)
			addressMap[addr.Address] = addr
			addresses = append(addresses, addr.Address)
		}

		apiclient := siacentralAPIClient(currency)
		used, err := apiclient.FindUsedAddresses(addresses)

		if err != nil {
			results <- recoveryResults{
				Error: fmt.Errorf("unable to get used addresses: %w", err),
			}
			return
		}

		for _, usage := range used {
			addr, exists := addressMap[usage.Address]
			if !exists {
				continue
			}

			addr.UsageType = usage.UsageType
			recovered.Addresses = append(recovered.Addresses, addr)

			if recovered.LastUsedIndex < addr.Index {
				recovered.LastUsedIndex = addr.Index
				recovered.LastUsedType = addr.UsageType
			}
		}

		results <- recovered
	}
}

// RecoverAddresses scans for addresses on the blockchain addressCount at a time up to a maximum of 100,000,000
//addresses. Considers all addresses found if the scan goes more than minRounds * addressCount
//addresses without seeing any used. It's possible the ranges will need to be tweaked for older or
//larger wallets
func RecoverAddresses(seed, currency string, startIndex, lookahead, lastKnownIndex uint64, callback js.Value) {
	var wg sync.WaitGroup

	w, err := recoverWallet(seed, currency)

	if err != nil {
		callback.Invoke(fmt.Errorf("unable to recover wallet: %w", err).Error(), js.Null())
		return
	}

	work := make(chan recoveryWork, workers)
	results := make(chan recoveryResults)
	done := make(chan bool)

	wg.Add(workers)

	for i := 0; i < workers; i++ {
		go func() {
			recoveryWorker(w, currency, work, results)
			wg.Done()
		}()
	}

	go func() {
		// wait for all workers to drain the work channel, then stop
		wg.Wait()
		close(results)
	}()

	go func() {
		var round uint64

		for i := startIndex; ; i += 500 {
			select {
			case <-done:
				close(work)
				return
			default:
			}

			work <- recoveryWork{
				Start: i,
				End:   i + 500,
				Round: round,
			}

			round++
		}
	}()

	var lastUsageType string
	lastScannedIndex, lastUsedIndex := startIndex, startIndex

	for res := range results {
		if res.Error != nil {
			//close the done channel to signal completion if it isn't already closed
			select {
			case <-done:
				break
			default:
				close(done)
			}
			continue
		}

		if res.LastUsedIndex > lastUsedIndex {
			lastUsedIndex = res.LastUsedIndex
		}

		if res.End > lastScannedIndex {
			lastScannedIndex = res.End
		}

		if lastScannedIndex >= lastKnownIndex && lastScannedIndex-lastUsedIndex > lookahead {
			//close the done channel to signal completion if it isn't already closed
			select {
			case <-done:
				break
			default:
				log.Printf("found gap of %d addresses from %d to %d (%d)", lastScannedIndex-lastUsedIndex, lastUsedIndex, res.End, lookahead)
				close(done)
			}
		}

		data, err := interfaceToJSON(map[string]interface{}{
			"found":     len(res.Addresses),
			"addresses": res.Addresses,
			"index":     lastUsedIndex,
		})

		if err != nil {
			callback.Invoke(err.Error(), js.Null())
			return
		}

		callback.Invoke("progress", data)
	}

	var additional []recoveredAddress

	if lastUsageType == "sent" {
		lastUsedIndex++

		additional = append(additional, generateAddress(w, lastUsedIndex))
	}

	data, err := interfaceToJSON(map[string]interface{}{
		"addresses": additional,
		"index":     lastUsedIndex,
	})

	if err != nil {
		callback.Invoke(err.Error(), js.Null())
		return
	}

	callback.Invoke(js.Null(), data)
}
