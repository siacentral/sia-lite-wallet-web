<template>
  <div class="page">
    <div class="about">
      <h1 class="text-primary text-center">About</h1>
      <p>
        Sia Central's Lite Wallet is a secure non-custodial cryptocurrency
        wallet with support for Siacoin (SC) and ScPrimeCoin (SCP). Sensitive data, like your wallet keys,
		are encrypted and never leave your device. This wallet has been tested and supports
		Chromium based browsers on Desktop, iOS 11, and Chrome on Android.
      </p>
      <h3>Features</h3>
      <ul>
        <li>
          <b>Secure</b> - keep control of your seeds. All sensitive information
          is stored and encrypted locally, never leaving your device.
        </li>
        <li>
          <b>No blockchain download</b> - instantly create a new wallet. Recover
          an existing wallet in under 2 minutes.
        </li>
        <li>
          <b>Ledger Nano S</b> - easily send and receive transactions with full
          Ledger Nano S support
        </li>
        <li>
          <b>Multiple Wallets</b> - create any number of separate wallets.
          Easily track host or renter wallets and top them up from a Ledger
          wallet.
        </li>
        <li>
          <b>Compatible</b> - generate or recover wallets using 29 word seeds.
        </li>
        <li>
          <b>Multilingual</b> - supports English, Chinese and French. Additional
          languages can be easily added by the community.
        </li>
        <li>
          <b>Multiplatform</b> - Works on modern desktop browsers, iOS and
          Android
        </li>
      </ul>
      <h3>Supported Wallet Types</h3>
      <h4>Seed Wallets</h4>
      <p>
        Seed wallets are created or recovered from a 29-word recovery phrase.
        These wallets are fully compatible with the official Sia and ScPrime
        wallets. The seed is encrypted and stored locally with a user provided
        unlock password. The seed never leaves the device, removing any risk of
        exposure.
      </p>
      <h4>Ledger Hardware Wallets</h4>
      <p>
        Ledger hardware wallets communicate using Ledger's secure transport. The
        seed cannot be retrieved from the Ledger device. Addresses are imported
        from the device to view balance and build transactions. The Ledger
        device is required to sign and confirm any transactions before being
        broadcast to the Sia network.
      </p>
      <p>
        To enable Ledger support you need to be on a recent Chromium based
        desktop browser (Chrome, Brave, Opera, Microsoft Edge) and enable
        Experimental Web Platform Features from
        <i>chrome://flags/#enable-experimental-web-platform-features</i>
      </p>
      <h4>Watch-Only Wallets</h4>
      <p>
        Watch-Only wallets are read-only wallets used to monitor the balance of
        a group of addresses. Addresses to watch are imported manually to view
        balance.
      </p>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.page {
  display: grid;
  align-content: safe center;
  justify-content: center;
}

.about {
	padding: 15px;
	max-width: 700px;
}

h3 {
  color: primary;
}

h4 {
	font-weight: 400;
}
</style>