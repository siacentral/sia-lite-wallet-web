/**
 * UI translations in Chinese. Translations provided by Discord user ps2xu#5946
 *
 */

export default {
	key: 'cn',
	translations: {
		getStarted: '继续',
		addWallet: '增加钱包',
		rescanWallet: '重新扫描钱包',
		addAddresses: '增加地址',
		exportSeed: '导出种子',
		deleteWallet: '删除钱包',
		unlockWallet: '解锁钱包',
		walletPassword: '钱包密码',
		unlockPassword: '解锁密码',
		transactionFee: '交易费',
		total: '共计',
		minerFee: '矿工费',
		address: '地址',
		amount: '金额',
		summary: '概况',
		inputs: '输入',
		outputs: '输出',
		add: '增加',
		connect: '连接',
		send: '发送',
		receive: '接收',
		verify: '校验',
		unlock: '解锁',
		done: '确认',
		next: '继续',
		export: '导出',
		import: '导入',
		generate: '生成',
		recover: '恢复',
		delete: '删除',
		cancel: '取消',
		sign: '签名',
		requiredSignatures: '必需的签名',
		status: '状态',
		wallet: '钱包',
		unconfirmed: '未确认',
		walletStatus: {
			scanning: '扫描中...',
			queued: '列队扫描...'
		},
		deleteWalletModal: {
			pDeleteConfirm: '您确定要删除名为“{{0}}”的钱包吗？ 这将从您的设备中删除与此钱包相关的所有数据。 请确保您已备份恢复种子。',
			deleteHeader: '删除“{{0}}”？'
		},
		exportSeedModal: {
			encryptionMode: '加密方式',
			optUnencrypted: '不加密',
			optUnlockPassword: '使用解锁密码加密',
			optCustomPassword: '使用自定义密码加密'
		},
		importSeedModal: {
			importingFile: '导入中 {{0}}',
			selectFile: '拖入或点击选择Sia种子文件'
		},
		menu: {
			wallets: '钱包',
			settings: '设置'
		},
		setup: {
			welcomeHeader: '欢迎来到Sia Central轻钱包',
			welcome1: '感谢您试用Sia Central的Sia轻钱包。 该钱包目前正在开发中。 如果发现任何问题或想提交反馈，请在GitHub上创建一个问题。',
			welcome2: '这个钱包是完全安全的。 所有钱包种子均已加密，存储在本地，永远不会离开设备。 没有访问设备和解锁密码的任何人都无法查看它们。',
			welcome3: '在发送或接收Siacoin时请务必小心，以防止硬币丢失。 Sia Central对于使用此钱包造成的任何损失不承担任何责任。',
			welcome4: '此钱包是非官方钱包，与NebulousLabs或Sia核心团队无关。',
			passwordHeader: '设置密码',
			password1: '请设置一个安全密码来加密您的钱包。 用以解锁和使用您的钱包。',
			password2: '所有钱包种子均已加密，存储在本地，永远不会离开设备。 无权访问设备和没有解锁的人都无法查看。'
		},
		settings: {
			displayHeader: '显示',
			securityHeader: '安全',
			advancedHeader: '高级',
			lblDisplayCurrency: '显示币种',
			lblDisplayLanguage: '语言',
			lblAutomaticLock: '锁定时间（分钟)',
			lblMinimumRounds: '最小的连续次数',
			lblAddressesPerRound: '每次地址数',
			chkShowAdvanced: '高级选项',
			chkWalrusSeeds: '生成12字种子',
			pChangeSeedType: '12字种子与官方Sia钱包不兼容。它们通常与Walrus钱包一起使用。启用此设置将在创建新钱包时显示一个下拉列表，允许您生成新的Sia种子或12字种子。',
			pExplainFullScan: '在开始完整扫描余额和输出地址期间，会分批扫描地址。直到在区块链上找不到最小扫描次数的地址为止。',
			pExplainRounds: '减少次数或地址数可以提高性能，但会增加找不到地址或余额的机会。使用当前设置，在完成之前至少使用{{0}}个连续地址索引。'
		},
		unlockWalletModal: {
			pWalletsLocked: '您的钱包目前已加密并锁定，输入密码解锁您的钱包并查看您的资金。'
		},
		createWalletModal: {
			newWallet: '新建钱包',
			recoverWallet: '恢复钱包',
			ledgerWallet: 'Ledger硬件钱包',
			watchWallet: '只读钱包',
			pNewWalletExplain: '在浏览器中生成一个新的钱包种子， 可以发送和接收交易。',
			pRecoverWalletExplain: '用29字的种子中恢复现有的钱包， 可以发送和接收交易。',
			pCreateLedgerExplain: '创建一个新的硬件支持的钱包，所有交易必须由Ledger设备签名。',
			pLedgerUnsupportedExplain: 'Ledger硬件钱包仅支持在Chrome浏览器中使用。 在Chrome中启用“Experimental Web Platform Features”并连接到Ledger设备。',
			pWatchWalletExplain: '创建一个新的只读钱包。 必须手动添加地址，并且无法发送交易。',
			pReviewLedger: '您的Ledger钱包已导入。现在无需分类帐设备即可查看余额和交易。要发送交易，您需要插入并解锁设备。',
			pReviewWatch: '已创建一个新的只读钱包。 该钱包无法发送交易。 将显示所有导入地址的余额和交易。',
			pReviewNew: '恭喜您！成功创建了一个新的钱包。请将您的恢复种子备份到安全的位置。没有种子，您的资金将无法恢复。',
			pReviewRecover: '恭喜您！钱包已成功恢复。现在正在扫描余额和交易。请备份您的恢复种子到一个安全的位置，没有种子，您的资金将无法恢复。',
			lblWalletName: '钱包名称',
			lblRecoverySeed: '恢复种子',
			lblSeedType: '种子类型',
			siaSeed: 'Sia种子',
			walrusSeed: 'Walrus种子'
		},
		importAddresses: {
			importedHeader: '输入地址',
			balance: '当前余额',
			addressPlaceholder: '查看的Sia地址...',
			publicKey: '导入公钥',
			addAddress: '增加地址'
		},
		ledger: {
			connected: '已连接',
			disconnected: '已断开',
			instructions: '当前余额'
		},
		sendSiacoinsModal: {
			spendableBalance: '可用余额',
			recipientAddress: '接收地址',
			spent: '花费',
			remainingBalance: '余额',
			txtRecipientPlaceholder: '发送Siacoin到...',
			errorGreaterThan0: '至少发送0个以上SC',
			errorNotEnough: '发送金额超过余额',
			errorHighFee: '发送的金额少于交易费',
			errorBadRecipient: '无效的接收地址',
			statusSigning: '正在签署交易...',
			statusBroadcasting: '正在广播交易...'
		},
		transactionTypes: {
			contractRevision: '合同修订',
			contractFormation: '合同形成',
			storageProof: '储存证明',
			hostAnnouncement: '主机宣布',
			contractCompleted: '合同完成',
			blockReward: '区块奖励',
			siacoinTransaction: 'Siacoin交易',
			siafundTransaction: 'Siafund交易',
			siafundClaim: 'Siafund Claim',
			defrag: '碎片整理'
		},
		outputTags: {
			received: '已收到',
			apiFee: 'API费',
			recipient: '接收者',
			sent: '已发送',
			sender: '发送者'
		},
		currency: {
			fiat: '法定货币',
			crypto: '加密货币',
			sc: 'SC',
			sf: 'SF',
			usd: '美元',
			jpy: '日元',
			eur: '欧元',
			gbp: '德元',
			aus: '澳元',
			cad: '加元',
			rub: '卢布',
			cny: '人民币',
			btc: '比特币',
			bch: '比特币现金',
			eth: '以太币',
			xrp: '瑞波币',
			ltc: '莱特币'
		},
		alerts: {
			welcomeBack: '钱包已解锁，欢迎回来！',
			unlockError: '无法解锁钱包，密码错误！',
			unlockSuccess: '钱包已解密。欢迎回来！',
			rescanWallet: '钱包已等待重新扫描。',
			transactionBroadcast: '广播交易成功。',
			addressesAdded: '已增加地址，钱包扫描已排队。',
			walletsLocked: '因不活动钱包已自动锁定。'
		},
		language: {
			automatic: '自动',
			en: 'English',
			cn: '中文'
		}
	}
};
