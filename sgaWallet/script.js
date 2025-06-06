(() => {
  const generateBtn = document.getElementById('generateBtn');
  generateBtn.addEventListener('click', () => {
    const chain = document.getElementById('chainSelect').value;
    let address, privateKey, mnemonic;
    if (chain === 'evm') {
      const wallet = ethers.Wallet.createRandom();
      address = wallet.address;
      privateKey = wallet.privateKey;
      mnemonic = wallet.mnemonic.phrase;
    } else if (chain === 'solana') {
      const keypair = solanaWeb3.Keypair.generate();
      address = keypair.publicKey.toBase58();
      privateKey = Array.from(keypair.secretKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    document.getElementById('walletInfo').classList.remove('d-none');
    document.getElementById('address').value = address;
    document.getElementById('privateKey').value = privateKey;
    const mnemonicGroup = document.getElementById('mnemonicGroup');
    const mnemonicEl = document.getElementById('mnemonic');
    const copyMnemonicBtn = document.getElementById('copyMnemonicBtn');
    if (mnemonic) {
      mnemonicGroup.classList.remove('d-none');
      mnemonicEl.value = mnemonic;
      copyMnemonicBtn.classList.remove('d-none');
    } else {
      mnemonicGroup.classList.add('d-none');
      copyMnemonicBtn.classList.add('d-none');
    }
  });
  document
    .getElementById('copyAddressBtn')
    .addEventListener('click', () => copyText('address'));
  document
    .getElementById('copyPrivateKeyBtn')
    .addEventListener('click', () => copyText('privateKey'));
  document
    .getElementById('copyMnemonicBtn')
    .addEventListener('click', () => copyText('mnemonic'));
})();

function copyText(id) {
  const el = document.getElementById(id);
  el.select();
  el.setSelectionRange(0, el.value.length);
  document.execCommand('copy');
}