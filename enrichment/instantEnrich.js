// enrichment/instantEnrich.js
require('dotenv').config();
const { Connection } = require('@solana/web3.js');
const { TokenListProvider } = require('@solana/spl-token-registry');

const RPC = process.env.SOLANA_RPC_URL;
const MAX = parseInt(process.env.ENRICH_MAX_RETRIES) || 2;
const conn = new Connection(RPC);

let tokenList = null;
async function loadTokenList() {
  if (!tokenList) {
    tokenList = await new TokenListProvider().resolve();
    tokenList = tokenList.filterByChainId(101).getList(); // 101 = mainnet
  }
  return tokenList;
}

module.exports = async function instantEnrich(address) {
  const list = await loadTokenList();
  const info = list.find(t => t.address === address);
  if (info) {
    return {
      token:    info.symbol,
      name:     info.name,
      address,
      decimals: info.decimals,
      logoURI:  info.logoURI
    };
  }
  // no on‑chain metadata found
  return null;
};
