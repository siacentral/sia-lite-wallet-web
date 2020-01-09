<template>
	<div class="address-list">
		<table>
			<tbody>
				<tr v-for="(address, i) in value" :key="i">
					<td class="text-right fit-text">{{ formatNumber(value[i].index) }}</td>
					<td v-if="walletType === 'ledger'"><input v-model="value[i].pubkey" placeholder="Sia address to watch..." readonly /></td>
					<td v-else><input v-model="value[i].address" placeholder="Sia address to watch..." @input="$emit('change', value)" /></td>
					<td class="fit-text" v-if="value.length > 1 && walletType !== 'ledger'">
						<button class="delete-btn" @click="$emit('delete', i)">
							<icon icon="times" />
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import { formatNumber } from '@/utils/format';

export default {
	props: {
		wallet: Object,
		value: Array
	},
	computed: {
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		}
	},
	methods: {
		formatNumber
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
</style>