/**
 * Default UI translations in English. To translate to another language replace all english values
 * with translations from your language.
 */

export default {
	key: 'en',
	translations: {
		getStarted: 'Get Started',
		addWallet: 'Add Wallet',
		rescanWallet: 'Rescan Wallet',
		defragWallet: 'Defrag Wallet',
		defrag: 'Defrag',
		addAddresses: 'Add Addresses',
		exportSeed: 'Export Seed',
		deleteWallet: 'Delete Wallet',
		unlockWallet: 'Unlock Wallet',
		walletPassword: 'Wallet Password',
		unlockPassword: 'Unlock Password',
		transactionFee: 'Transaction Fee',
		total: 'Total',
		minerFee: 'Miner Fee',
		address: 'Address',
		amount: 'Amount',
		summary: 'Summary',
		inputs: 'Inputs',
		outputs: 'Outputs',
		add: 'Add',
		connect: 'Connect',
		send: 'Send',
		receive: 'Receive',
		verify: 'Verify',
		unlock: 'Unlock',
		done: 'Done',
		next: 'Next',
		export: 'Export',
		import: 'Import',
		generate: 'Generate',
		recover: 'Recover',
		delete: 'Delete',
		cancel: 'Cancel',
		sign: 'Sign',
		requiredSignatures: 'Required Signatures',
		status: 'Status',
		wallet: 'Wallet',
		unconfirmed: 'Unconfirmed',
		half: 'Half',
		full: 'Full',
		siacentral: 'Sia Central',
		walrus: 'Walrus',
		narwal: 'Narwal',
		walletStatus: {
			scanning: 'Scanning...',
			queued: 'Scan Queued...'
		},
		deleteWalletModal: {
			pDeleteConfirm: 'Are you sure you want to delete the wallet named "{{0}}"? This will remove all data associated with this wallet from your device. Please make sure you have the recovery seed backed up.',
			deleteHeader: 'Delete "{{0}}"?'
		},
		exportSeedModal: {
			encryptionMode: 'Encryption Mode',
			optUnencrypted: 'Unencrypted',
			optUnlockPassword: 'Encrypted - Unlock Password',
			optCustomPassword: 'Encrypted - Custom Password'
		},
		importSeedModal: {
			importingFile: 'Importing {{0}}',
			selectFile: 'Drag and drop a Sia seed file or click to select a file'
		},
		menu: {
			wallets: 'Wallets',
			settings: 'Settings'
		},
		setup: {
			welcomeHeader: 'Welcome to the Sia Central Lite Wallet',
			welcome1: 'Thank you for trying out Sia Central Lite Wallet. This wallet is currently in open Beta testing. Please report any bugs or submit feedback on GitHub.',
			welcome2: 'This wallet is completely secure. All wallet seeds are encrypted, stored locally and never leave the device. They cannot be viewed by anyone without access to the device and the unlock password.',
			welcome3: 'Please use caution when sending or receiving Siacoins to prevent coin loss. Sia Central is not responsible for any damages incurred while using this wallet.',
			welcome4: 'This wallet is unofficial and is not associated with NebulousLabs or the core Sia team.',
			passwordHeader: 'Set a Password',
			password1: 'Please set a secure password to encrypt your wallets with. This password will be required to unlock and use your wallets.',
			password2: 'All wallet seeds are encrypted, stored locally and never leave the device. They cannot be viewed by anyone without access to the device and the unlock password.'
		},
		settings: {
			displayHeader: 'Display',
			securityHeader: 'Security',
			advancedHeader: 'Advanced',
			lblDisplayCurrency: 'Currency',
			lblDisplayLanguage: 'Language',
			lblAutomaticLock: 'Automatic Lock Timeout (Minutes)',
			lblMinimumRounds: 'Minimum Consecutive Rounds',
			lblAddressesPerRound: 'Addresses Per Round',
			chkShowAdvanced: 'Show Advanced',
			chkWalrusSeeds: 'Enable 12 word seeds',
			chkChangeWalletServer: 'Enable 3rd-party wallet servers',
			pChangeSeedType: '12 word seeds are not compatible with the official Sia wallets. They are commonly used with Walrus wallets. Enabling this setting will show a dropdown when creating a new wallet allowing you to generate either a new Sia seed or a 12 word seed.',
			pChangeServerType: '[EXPERIMENTAL] Allows the usage of 3rd-party wallet servers, like Walrus. 3rd-party servers help reduce centralization and allow for choice between trusting Sia Central or another party. Some wallet features may be broken or unsupported.',
			pExplainFullScan: 'During the initial full scan, used addresses are scanned in batches. The wallet will scan until no consecutively used address indices are found on the blockchain for the minimum number of scan rounds.',
			pExplainRounds: 'Decreasing the number of rounds or the number of addresses per round may increase performance, but will increase the chance addresses or balance will not be found. With the current settings, a minimum of {{0}} consecutive address indices must be unused before completion.'
		},
		unlockWalletModal: {
			pWalletsLocked: 'Your wallets are currently encrypted and locked. Enter your password to unlock your wallets and access your funds.'
		},
		createWalletModal: {
			newWallet: 'New Wallet',
			recoverWallet: 'Recover Wallet',
			ledgerWallet: 'Ledger Wallet',
			watchWallet: 'Watch-Only Wallet',
			pNewWalletExplain: 'Generates a new wallet seed in the browser. Transactions can be sent and received.',
			pRecoverWalletExplain: 'Recovers an existing wallet from a {{0}} seed. Transactions can be sent and received.',
			pCreateLedgerExplain: 'Creates a new hardware backed wallet. All transactions must be signed by the Ledger device.',
			pLedgerUnsupportedExplain: 'Ledger support is only available in the Chrome browser. Enable "Experimental Web Platform Features" in Chrome to connect to the Ledger device.',
			pWatchWalletExplain: 'Creates a new watch-only wallet. Addresses must be added manually and transactions cannot be sent.',
			pReviewLedger: 'Your Ledger wallet has been imported. Balance and transactions can now be viewed without the Ledger device. To send transactions you will need to plugin and unlock the device.',
			pReviewWatch: 'A new watch-only wallet has been created. This wallet cannot send transactions. Balance and transactions will be shown for all imported addresses.',
			pReviewNew: 'A new wallet has been created. Please backup your recovery seed to a safe location, without your seed your funds cannot be recovered.',
			pReviewRecover: 'Your wallet has been successfully recovered. The blockchain is now being scanned for balance and transactions. Please backup your recovery seed to a safe location, without your seed your funds cannot be recovered.',
			lblWalletName: 'Wallet Name',
			lblRecoverySeed: 'Recovery Seed',
			lblSeedType: 'Seed Type',
			lblServerType: 'Server Type',
			lblServerURL: 'Server URL',
			siaSeed: 'Sia Seed',
			walrusSeed: 'Walrus Seed'
		},
		importAddresses: {
			importedHeader: 'Imported Addresses',
			balance: 'Current Balance',
			addressPlaceholder: 'Sia address to watch...',
			publicKey: 'Import Public Key',
			addAddress: 'Add Address',
			displayPublicKey: 'Show Public Key',
			displayAddress: 'Show Address'
		},
		ledger: {
			connected: 'Connected',
			disconnected: 'Disconnected',
			instructions: 'Unlock your Ledger Nano S and open the Sia App.'
		},
		sendSiacoinsModal: {
			spendableBalance: 'Spendable Balance',
			recipientAddress: 'Recipient Address',
			receiveAddress: 'Receive Address',
			spent: 'Spent',
			remainingBalance: 'Remaining Balance',
			txtRecipientPlaceholder: 'Send Siacoin to...',
			errorGreaterThan0: 'Must send more than 0 SC',
			errorNotEnough: 'Send amount more than balance',
			errorHighFee: 'Amount sent is less than transaction fees',
			errorBadRecipient: 'Invalid recipient address',
			statusSigning: 'Signing transaction...',
			statusBroadcasting: 'Broadcasting transaction...'
		},
		defragModal: {
			defragExplain: 'Defragmenting a wallet creates transactions to combine spendable Siacoin outputs into as few as possible to make it easier to send transactions. This is only necessary if your wallet controls a lot of small outputs or you have had trouble sending transactions. Transactions on the Sia network are limited to 32 KB, or about 95 Siacoin inputs.',
			defragUnnecessary: 'Wallet does not need to be defragmented',
			receiveAmount: 'Receive Amount',
			sendAmount: 'Send Amount'
		},
		transactionTypes: {
			contractRevision: 'Contract Revision',
			contractFormation: 'Contract Formation',
			storageProof: 'Storage Proof',
			hostAnnouncement: 'Host Announcement',
			contractCompleted: 'Contract Completion',
			blockReward: 'Block Reward',
			siacoinTransaction: 'Siacoin Transaction',
			siafundTransaction: 'Siafund Transaction',
			siafundClaim: 'Siafund Claim',
			defrag: 'Defrag'
		},
		outputTags: {
			received: 'Received',
			apiFee: 'API Fee',
			recipient: 'Recipient',
			sent: 'Sent',
			sender: 'Sender'
		},
		currency: {
			fiat: 'Fiat',
			crypto: 'Crypto',
			sc: 'SC',
			sf: 'SF',
			usd: 'USD',
			jpy: 'JPY',
			eur: 'EUR',
			gbp: 'GBP',
			aus: 'AUS',
			cad: 'CAD',
			rub: 'RUB',
			cny: 'CNY',
			btc: 'BTC',
			bch: 'BCH',
			eth: 'ETH',
			xrp: 'XRP',
			ltc: 'LTC'
		},
		alerts: {
			welcomeBack: 'Wallets decrypted. Welcome back!',
			unlockError: 'Unable to decrypt wallets. Incorrect password',
			unlockSuccess: 'Wallets decrypted. Welcome back!',
			rescanWallet: 'Wallet has been queued for rescan',
			transactionBroadcast: 'Transaction broadcast successfully',
			addressesAdded: 'Addresses added. Wallet scan queued.',
			walletsLocked: 'Wallets automatically locked due to inactivity'
		},
		language: {
			automatic: 'Automatic',
			en: 'English',
			cn: '中文',
			fr: 'Français'
		}
	}
};
