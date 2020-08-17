<template>
	<div class="address-list">
		<table>
			<tbody>
				<tr v-for="(address, i) in value" :key="i">
					<td class="text-right fit-text">{{ formatNumber(value[i].index) }}</td>
					<td v-if="publickey"><input :value="`ed25519:${value[i].pubkey}`" :placeholder="translate('importAddresses.addressPlaceholder')" readonly /></td>
					<td v-else><input v-model="value[i].address" :placeholder="translate('importAddresses.addressPlaceholder')" @input="$emit('change', value)" :readonly="readonly" />
					<td class="fit-text" v-if="value.length > 1 && walletType === 'watch'">
						<button class="delete-btn" @click="$emit('delete', i)">
							<icon icon="times" />
						</button>
					</td>
					<td class="fit-text" v-else-if="walletType === 'ledger'">
						<button class="btn btn-inline" @click="onVerifyLedger(value[i].index)">{{ translate('verify') }}</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import { formatNumber } from '@/utils/format';
import { getPublicKey, getAddress } from '@/ledger';

export default {
	props: {
		wallet: Object,
		value: Array,
		publickey: Boolean,
		readonly: Boolean
	},
	computed: {
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		}
	},
	methods: {
		formatNumber,
		async onVerifyLedger(i) {
			try {
				if (this.publickey)
					await getPublicKey(i);
				else
					await getAddress(i);
			} catch (ex) {
				console.error('ImportAddressList.onVerifyLedger', ex);
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.address-list {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;

	table tbody tr {
		border-top: 1px solid dark-gray;
		border-bottom: 1px solid dark-gray;
		background: transparent;

		td {
			padding: 20px 8px;
		}
	}

	input {
		display: block;
		height: 36px;
		padding: 0 5px;
		font-size: 1.2rem;
		width: 100%;
		background: transparent;
		border-radius: 4px;
		border: 1px solid dark-gray;
		color: rgba(255, 255, 255, 0.84);
		outline: none;
		line-height: 36px;
		text-overflow: ellipsis;
	}
}

.fit-text {
	.btn {
		margin-right: 0;
	}
}
</style>