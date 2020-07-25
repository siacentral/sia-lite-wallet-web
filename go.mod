module github.com/siacentral/sia-lite-wallet-web

go 1.13

replace github.com/siacentral/apisdkgo => /Users/n8maninger/Projects/github.com/siacentral/api/sdk/apisdkgo

require (
	github.com/pkg/errors v0.9.1
	github.com/shopspring/decimal v1.2.0
	github.com/siacentral/apisdkgo v0.0.0-20200519014622-e4ad2522209c
	gitlab.com/NebulousLabs/Sia v1.4.11
	gitlab.com/NebulousLabs/entropy-mnemonics v0.0.0-20181018051301-7532f67e3500
	gitlab.com/NebulousLabs/fastrand v0.0.0-20181126182046-603482d69e40
	golang.org/x/crypto v0.0.0-20200709230013-948cd5f35899
	lukechampine.com/frand v1.2.0
)
