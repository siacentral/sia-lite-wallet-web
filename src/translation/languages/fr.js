/**
 * UI translations in French.
 */

export default {
	key: 'fr',
	translations: {
		getStarted: 'Commencer',
		addWallet: 'Ajouter un portefeuille',
		rescanWallet: 'Rafraîchir le portefeuille',
		addAddresses: 'Ajouter des adresses',
		exportSeed: 'Exporter la seed',
		deleteWallet: 'Supprimer le portefeuille',
		unlockWallet: 'Déverrouiller le portefeuille',
		walletPassword: 'Mot de passe du portefeuille',
		unlockPassword: 'Mot de passe de déverrouillage',
		transactionFee: 'Frais de transaction',
		total: 'Total',
		minerFee: 'Frais des mineurs',
		address: 'Adresse',
		amount: 'Quantité',
		summary: 'Résumé',
		inputs: 'Entrées',
		outputs: 'Sorties',
		add: 'Ajouter',
		connect: 'Connecter',
		send: 'Envoyer',
		receive: 'Recevoir',
		verify: 'Vérifier',
		unlock: 'Déverrouiller',
		done: 'Fait',
		next: 'Suivant',
		export: 'Exporter',
		import: 'Importer',
		generate: 'Générer',
		recover: 'Rétablir',
		delete: 'Supprimer',
		cancel: 'Annuler',
		sign: 'Signer',
		requiredSignatures: 'Signatures requises',
		status: 'Status',
		wallet: 'Portefeuille',
		unconfirmed: 'Non confirmé',
		half: 'Moitié',
		full: 'Totalité',
		siacentral: 'Sia Central',
		walrus: 'Walrus',
		narwal: 'Narwal',
		walletStatus: {
			scanning: 'Rafraichir...',
			queued: 'Rafraichissement en attente...'
		},
		deleteWalletModal: {
			pDeleteConfirm: 'Êtes-vous sûr de vouloir supprimer le portefeuille "{{0}}" ? Cette action va supprimer toutes les données associées à ce portefeuille et sauvegardées sur cet appareil. Assurez-vous de détenir la seed de déverrouillage du portefeuille.',
			deleteHeader: 'Supprimer "{{0}}" ?'
		},
		exportSeedModal: {
			encryptionMode: 'Mode d\'encryptage',
			optUnencrypted: 'Non encrypté',
			optUnlockPassword: 'Encrypté - Mot de passe de déverrouillage',
			optCustomPassword: 'Encrypté - Mot de passe personnalisé'
		},
		importSeedModal: {
			importingFile: 'Importation de {{0}}',
			selectFile: 'Glissez-déposez un fichier contenant une seed Sia ou sélectionnez un fichier.'
		},
		menu: {
			wallets: 'Portefeuilles',
			settings: 'Paramètres'
		},
		setup: {
			welcomeHeader: 'Bienvenue sur le portefeuille lite de Sia Central',
			welcome1: 'Sia Central vous remercie d\'essayer son portefeuille lite. Ce service est en version beta. N\'hésitez pas à remonter d\'éventuels bugs et à faire part de votre avis au développeur sur GitHub.',
			welcome2: 'Ce portefeuille est totalement sécurisé. Toutes les seeds sont encryptées, sauvegardées localement et ne quittent jamais votre appareil. Elles ne peuvent être dévoilées à personne sans un accès direct à cet appareil et sans connaître le mot de passe de déverrouillage.',
			welcome3: 'Prenez les plus grandes précautions lors de la réception ou de l\'envoi de Siacoins afin d\'éviter toute perte. Sia Central ne pourra être tenu responsable d\'aucun dommage éventuel causé par l\'utilisation de son portefeuille.',
			welcome4: 'Ce portefeuille n\'est pas officiel et n\'est pas associé à NebulousLabs ou à l\'équipe de développement "Sia Core".',
			passwordHeader: 'Créer un mot de passe',
			password1: 'Créez un mot de passe "fort" pour encrypter votre portefeuille. Ce mot de passe sera nécessaire pour déverrouiller et utiliser vos portefeuilles.',
			password2: 'Toutes les seeds sont encryptées, sauvegardées localement, et ne quittent jamais votre appareil. Elles ne peuvent être dévoilées à personne sans un accès direct à cet appareil et sans connaître le mot de passe de déverrouillage.'
		},
		settings: {
			displayHeader: 'Affichage',
			securityHeader: 'Sécurité',
			advancedHeader: 'Avancé',
			lblDisplayCurrency: 'Devise',
			lblDisplayLanguage: 'Langue',
			lblAutomaticLock: 'Délai de verrouillage automatique (en minutes)',
			lblMinimumRounds: 'Nombre de rounds consécutifs minimum',
			lblAddressesPerRound: 'Adresses par round',
			chkShowAdvanced: 'Afficher les paramètres avancés',
			chkWalrusSeeds: 'Autoriser les seeds à 12 mots',
			chkChangeWalletServer: 'Autoriser les serveurs de portefeuilles tierces',
			pChangeSeedType: 'Les seeds à 12 mots sont incompatibles avec les portefeuilles Sia officiels. Elles sont généralement utilisées par les portefeuilles Walrus. Activer cette fonctionnalité fera apparaître une liste déroulante lors de la création d\'un nouveau portefeuille, permettant d\'utiliser au choix les seeds Sia ou les seeds à 12 mots.',
			pChangeServerType: '[EXPERIMENTAL] Permet l\'utilisation de serveurs de portefeuilles tierces, comme Walrus. Les serveurs de portefeuilles tierces permettent de réduire la centralisation et permettent de choisir entre Sia Central ou toute autre partie. Certaines fonctionnalités peuvent ne pas être supportées ou fonctionner de manière hasardeuse.',
			pExplainFullScan: 'Pendant le scan initial, les adresses utilisées sont scannées par groupes. Le portefeuille va scanner jusqu\'à ce qu\'aucun ensemble de deux numéros d\'adresses ne soient trouvés, autant de fois que le nombre minimum de rounds soit atteint.',
			pExplainRounds: 'Réduire le nombre minimum de rounds ou le nombre d\'adresses par round peut permettre d\'améliorer les performances, mais peut aussi augmenter les chances que des adresses ou des soldes ne soient pas trouvés. Avec les paramètres actuels, un minimum de {{0}} numéros d\'adresses consécutives doivent ne pas être utilisées pour valider le processus.'
		},
		unlockWalletModal: {
			pWalletsLocked: 'Vos portefeuilles sont encryptés et verrouillés. Entrez votre mot de passe pour débloquer vos portefeuilles et accéder à vos fonds.'
		},
		createWalletModal: {
			newWallet: 'Nouveau portefeuille',
			recoverWallet: 'Rétablir un portefeuille',
			ledgerWallet: 'Portefeuille matériel (Ledger Wallet)',
			watchWallet: 'Portefeuille en lecture seule (watch-only)',
			pNewWalletExplain: 'Créé une nouvelle seed pour de portefeuille dans le navigateur. Des transactions peuvent être reçus et envoyées.',
			pRecoverWalletExplain: 'Rétablit un portefeuille existant depuis une seed {{0}}. Des transactions peuvent être reçus et envoyées.',
			pCreateLedgerExplain: 'Créé un nouveau portefeuille matériel (Ledger wallet). Toutes les transactions doivent être signées par le dispositif physique.',
			pLedgerUnsupportedExplain: 'Seul le navigateur Chrome supporte cette fonctionnalité. Pour l\'activer, autorisez "Experimental Web Platform Features" dans les paramètres de Chrome.',
			pWatchWalletExplain: 'Créé un nouveau portefeuille en lecture seule (watch-only). Les adresses doivent être ajoutées manuellement et aucune transaction ne peut être envoyée.',
			pReviewLedger: 'Votre portefeuille matériel a bien été importé. Le solde et les transactions ne peuvent pas être visualisées sans le dispositif physique. Pour envoyer des transactions, vous devez brancher et déverrouiller le portefeuille matériel.',
			pReviewWatch: 'Un nouveau portefeuille en lecture seule a bien été importé. Ce portefeuille ne peut pas envoyer de transaction. Le solde et les transactions sont visualisables pour toutes les adresses importées.',
			pReviewNew: 'Un nouveau portefeuille a bien été créé. Prenez soin de conserver la seed du portefeuille en lieu sûr. Sans cette dernière, vos fonds ne pourront pas être récupérés.',
			pReviewRecover: 'Votre portefeuille a bien été rétablis. Le scan de la blockchain est en cours et le solde ainsi que les transactions seront bientôt disponibles. Prenez soin de conserver la seed du portefeuille en lieu sûr. Sans cette dernière, vos fonds ne pourront pas être récupérés.',
			lblWalletName: 'Nom du portefeuille',
			lblRecoverySeed: 'Seed du portefeuille',
			lblSeedType: 'Type de la seed',
			lblServerType: 'Type du serveur',
			lblServerURL: 'URL du serveur',
			siaSeed: 'Seed Sia',
			walrusSeed: 'Seed Walrus'
		},
		importAddresses: {
			importedHeader: 'Adresses importées',
			balance: 'Solde courant',
			addressPlaceholder: 'Adresses Sia à suivre...',
			publicKey: 'Importer la clé publique',
			addAddress: 'Ajouter une adresse',
			displayPublicKey: 'Afficher la clé publique',
			displayAddress: 'Afficher l\'adresse'
		},
		ledger: {
			connected: 'Connecté',
			disconnected: 'Déconnecté',
			instructions: 'Débloquez votre Ledger Nano S et ouvrez l\'application Sia.'
		},
		sendSiacoinsModal: {
			spendableBalance: 'Solde disponible',
			recipientAddress: 'Adresse de destination',
			spent: 'Dépensé',
			remainingBalance: 'Solde restant',
			txtRecipientPlaceholder: 'Envoyer des Siacoins à...',
			errorGreaterThan0: 'Le montant à envoyer doit être supérieur à 0 SC',
			errorNotEnough: 'Le montant à envoyer est supérieur au solde disponible',
			errorHighFee: 'Le montant à envoyer est inférieur aux frais de transaction',
			errorBadRecipient: 'Adresse de destination invalide',
			statusSigning: 'Signature de la transaction...',
			statusBroadcasting: 'Diffusion de la transaction...'
		},
		transactionTypes: {
			contractRevision: 'Révision de contrat',
			contractFormation: 'Formation de contrat',
			storageProof: 'Preuve de détention',
			hostAnnouncement: 'Annonce de l\'hôte',
			contractCompleted: 'Achèvement du contrat',
			blockReward: 'Récompense de bloc',
			siacoinTransaction: 'Transaction de Siacoins',
			siafundTransaction: 'Transaction de Siafunds',
			siafundClaim: 'Réclamation de Siafunds',
			defrag: 'Defrag'
		},
		outputTags: {
			received: 'Reçu',
			apiFee: 'Frais de l\'API',
			recipient: 'Destinataire',
			sent: 'Envoyé',
			sender: 'Émetteur'
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
			welcomeBack: 'Portefeuilles décryptés. Bienvenue !',
			unlockError: 'Impossible de décrypter les portefeuilles. Mot de passe incorrect.',
			unlockSuccess: 'Portefeuilles décryptés. Bienvenue !',
			rescanWallet: 'Le scan du portefeuille est en attente',
			transactionBroadcast: 'La transaction a été diffusée',
			addressesAdded: 'Les adresses ont été ajoutées. Scan du portefeuille en cours.',
			walletsLocked: 'Les portefeuilles ont été vérrouillés suite à une période d\'inactivité.'
		}
	}
};
