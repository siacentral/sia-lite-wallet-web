package siacentral

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"
)

type (
	// API defines an interface for accessing the Sia Central API
	API interface {
		// FindAddressBalance gets the balance and transactions of the addresses
		FindAddressBalance(limit int, page int, currency string, addresses []string) (resp WalletBalance, err error)
		// FindUsedAddresses returns an array of all used addresses
		FindUsedAddresses(addresses []string) (used []AddressUsage, err error)

		// GetBlockHeight returns the current block height of the chain
		GetBlockHeight() (uint64, error)
	}
)

var (
	client = &http.Client{
		Timeout: 30 * time.Second,
	}
)

func drainAndClose(rc io.ReadCloser) {
	io.Copy(io.Discard, rc)
	rc.Close()
}

func makeAPIRequest(method string, url string, body interface{}, value interface{}) (statusCode int, err error) {
	var req *http.Request

	if method == http.MethodGet {
		req, err = http.NewRequest(method, url, nil)
	} else {
		var buf []byte

		if body != nil {
			buf, err = json.Marshal(body)

			if err != nil {
				return
			}
		}

		req, err = http.NewRequest(method, url, bytes.NewBuffer(buf))
	}

	if err != nil {
		return
	}

	resp, err := client.Do(req)

	if err != nil {
		return
	}

	defer drainAndClose(resp.Body)

	dec := json.NewDecoder(resp.Body)
	statusCode = resp.StatusCode
	err = dec.Decode(value)

	return
}
