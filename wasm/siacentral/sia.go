package siacentral

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/siacentral/apisdkgo"
)

type (
	siaAPI struct {
	}
)

// FindAddressBalance gets the balance and transactions of the addresses
func (s *siaAPI) FindAddressBalance(limit int, page int, currency string, addresses []string) (WalletBalance, error) {
	var resp transactionsResp

	v := make(url.Values)
	v.Set("limit", strconv.Itoa(limit))
	v.Set("page", strconv.Itoa(page))
	v.Set("currency", currency)

	u := fmt.Sprintf("https://api.siacentral.com/v2/wallet/addresses?%s", v.Encode())
	code, err := makeAPIRequest(http.MethodPost, u, map[string]interface{}{
		"addresses": addresses,
	}, &resp)

	if err != nil {
		return WalletBalance{}, err
	}

	if code < 200 || code >= 300 || resp.Type != "success" {
		return WalletBalance{}, fmt.Errorf(resp.Message)
	}

	return resp.WalletBalance, nil
}

// FindUsedAddresses returns an array of all used addresses
func (s *siaAPI) FindUsedAddresses(addresses []string) ([]AddressUsage, error) {
	var resp addressesResp

	code, err := makeAPIRequest(http.MethodPost, "https://api.siacentral.com/v2/wallet/addresses/used", map[string]interface{}{
		"addresses": addresses,
	}, &resp)

	if err != nil {
		return nil, err
	}

	if code < 200 || code >= 300 || resp.Type != "success" {
		return nil, fmt.Errorf(resp.Message)
	}

	return resp.Addresses, nil
}

func (s *siaAPI) GetBlockHeight() (uint64, error) {
	client := apisdkgo.NewSiaClient()
	index, err := client.GetChainIndex()
	return index.Height, err
}

// NewSiaAPI creates a new Sia client to access the Sia api
func NewSiaAPI() API {
	return new(siaAPI)
}
