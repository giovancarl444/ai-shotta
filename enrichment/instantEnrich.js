require('dotenv').config();
const { Connection, PublicKey }   = require('@solana/web3.js');
const { TokenListProvider, ENV } = require('@solana/spl-token-registry');

const RPC = process.env.SOLANA_RPC_URL;
const conn = new Connection(RPC, 'confirmed');

let cachedList = null;
async function loadTokenList() {
  if (!cachedList) {
    const all = await new TokenListProvider().resolve();
    cachedList = all.filterByChainId(ENV.MainnetBeta).getList();
  }
  return cachedList;
}

module.exports = async function instantEnrich(address) {
  // 1) Token registry
  const list = await loadTokenList();
  const info = list.find(t => t.address === address);
  if (info) {
    return {
      token:    info.symbol,
      name:     info.name,
      address,
      decimals: info.decimals,
      logoURI:  info.logoURI,
    };
  }

  // 2) On‑chain mint for decimals
  try {
    const pub = new PublicKey(address);
    const resp = await conn.getParsedAccountInfo(pub);
    const parsed = resp.value?.data?.parsed?.info;
    if (parsed?.decimals != null) {
      return { token: address.slice(0,8), name: address.slice(0,8), address, decimals: parsed.decimals, logoURI: null };
    }
  } catch (err) {
    console.warn('instantEnrich on-chain fallback error:', err.message);
  }

  // 3) Give up
  return null;
};
