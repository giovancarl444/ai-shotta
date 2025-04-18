// enrichment/instantEnrich.js
require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { TokenListProvider, ENV }     = require('@solana/spl-token-registry');

const connection = new Connection(process.env.SOLANA_RPC_URL);

module.exports = async function instantEnrich(address) {
  try {
    // 1) Try the on‑chain token registry
    const allTokens = await new TokenListProvider().resolve();
    const tokenList = allTokens
      .filterByChainId(ENV.MainnetBeta)
      .getList();
    const info = tokenList.find(t => t.address === address);

    if (info) {
      return {
        token:     info.symbol,
        address:   info.address,
        name:      info.name,
        logoURI:   info.logoURI,
        decimals:  info.decimals
      };
    }

    // 2) Fallback: fetch mint account on‑chain for decimals
    const pubkey = new PublicKey(address);
    const resp   = await connection.getParsedAccountInfo(pubkey);
    const parsed = resp.value?.data?.parsed?.info;
    if (parsed && parsed.decimals != null) {
      return {
        token:     address.slice(0, 8),
        address,
        name:      address.slice(0, 8),
        logoURI:   null,
        decimals:  parsed.decimals
      };
    }

    // 3) If that also fails, give up
    return null;
  } catch (err) {
    throw new Error(`instantEnrich failed: ${err.message}`);
  }
};
