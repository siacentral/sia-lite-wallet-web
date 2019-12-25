<template>
	<div class="page page-contacts">
		<mobile-nav></mobile-nav>
		<div class="contact-controls">
			<button class="btn btn-inline"><icon icon="plus" /> Add Address</button>
		</div>
		<div class="contacts">
			<div class="contact" v-for="address in contacts" :key="address.address">
				<div class="contact-icon"><identicon :value="address.address" /></div>
				<div class="contact-title">{{ address.title }}</div>
				<div class="contact-address">{{ address.address }}</div>
			</div>
		</div>
	</div>
</template>
<script>
import MobileNav from '@/components/MobileNav';
import Identicon from '@/components/Identicon';

export default {
	components: {
		MobileNav,
		Identicon
	},
	data() {
		return {
			contacts: [
				{
					title: 'Test Address 1',
					address: '8b35f5dcb2488dff6523c6e531a449ce2938ec1e9b4df89438b8f810d1997b50f8a583a20592'
				},
				{
					title: 'Test Address 1',
					address: '4ce2f8eb3304fd8ba7854c83b8493b386104de8fbb906f81090713c30d24c370cc22c83affdc'
				},
				{
					title: 'Test Address 1',
					address: '02bbd7ebb9be390f5bc03387d61941c63986a5b5000f2c54f974a664dbec2b7caa8ed2f614f1'
				},
				{
					title: 'Test Address 1',
					address: '4a10bc68c539edb9a3b347bbc91bfed5a2ff2f9b1a23036e2c307fbfa90d04f4a426c0ebc67d'
				},
				{
					title: 'Test Address 1',
					address: '65ba8227a47e731468a04d645f69c27b5110277821ce32c6e221ed0426182fd902ed35d56855'
				},
				{
					title: 'Test Address 1',
					address: '6605a5e2ab3b45237858dd26d618cb5752491fffdbc050d57526976c6f06503e7d33e66eda52'
				},
				{
					title: 'Test Address 1',
					address: '43fa308fd9eb449a970c28154dd33a9e6a348f0718e573d0d0f772d9c6f872898acb990a8028'
				},
				{
					title: 'Test Address 1',
					address: '95aefd9f10c62a1c68c75f0822aedf49db596a87d69f8954aa265204c9ea1756bc69cc0ebfb7'
				},
				{
					title: 'Test Address 1',
					address: 'bbae7b815c947b3829f46990c629fe1fe46243c80af3fa075d7431624e2d2e62b5d341710ffc'
				},
				{
					title: 'Test Address 1',
					address: '01d2f78fbe213251a9dc467569bd1f8a9537db8d236bdcf7bc2cf090c7ed01a7e6c6715258c3'
				},
				{
					title: 'Test Address 2',
					address: '28b244f27be188e837e0610822b0f2c6085d351b307886d55a625c8a9d4977fdf0eea07d6245'
				},
				{
					title: 'Test Address 2',
					address: 'ecf5c13d8310672cf2dbce95984ad010a4c3f626fab3e7f98e17fa5331cc536f2811cc884948'
				},
				{
					title: 'Test Address 2',
					address: '360da1afbb686f910bfb351a78e7d963b5f4be2049d6da59ff5e4ba6a98737d715eecd47df4b'
				},
				{
					title: 'Test Address 2',
					address: '98dea529c9a0dfabcc40a6218b2dd68f0910de356a09654696aaaef4b493d8cf2bbf0e2f4ce6'
				},
				{
					title: 'Test Address 2',
					address: '54515f96f9e4b6167249a1712f1217fd3b8f530a5c45b824c19c72e36e241a756c497c05219c'
				},
				{
					title: 'Test Address 2',
					address: 'e70a707a7fe12da82910e7e77d65fcb6de82f5315260606d8da17c04dc931116a87c2ad14a0a'
				},
				{
					title: 'Test Address 2',
					address: '51d25c23527f620fc5934ece51c35e103f7a3082d6d2baaf394f6f2e87214562067be01da2b5'
				},
				{
					title: 'Test Address 2',
					address: '7c22263b47e6db539087edd2357f2d48e57ab471328d289a2a7ba98b62736fd82cd99cfbc1e4'
				},
				{
					title: 'Test Address 2',
					address: '0570a2c1982837f9090c9dbdc681918bd61e4b8763216ea93950e046d6bd5ef82027e6e29b7b'
				},
				{
					title: 'Test Address 2',
					address: '8c6442bc0a14e21aab4adae5dfcfae90123f6b2810b7dd020cc4061239480fe27abf098a12e2'
				}
			]
		};
	}
};
</script>
<style lang="stylus" scoped>
.page.page-contacts {
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	overflow: hidden;
}

.contact-controls {
	padding: 15px;
	text-align: right;

	button:last-of-type {
		margin-right: 0;
	}
}

.contacts {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
}

.contact {
	display: grid;
	grid-template-columns: 48px minmax(0, 1fr);
	padding: 15px;
	grid-gap: 5px 15px;
	align-items: center;
	border-bottom: 1px solid dark-gray;
	cursor: pointer;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	transition: all 0.3s linear;

	.contact-icon {
		grid-row: 1 / span 2;

		svg {
			border-radius: 4px;
		}
	}

	.contact-title, .contact-address {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-title {
		font-size: 1.1rem;
	}

	.contact-address {
		color: rgba(255, 255, 255, 0.54);
	}

	&:hover, &:active {
		background: dark-gray;
	}
}
</style>