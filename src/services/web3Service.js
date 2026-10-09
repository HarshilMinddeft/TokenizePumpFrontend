import { ethers } from 'ethers';
import envConfig from '../config/env.config';
import contractsConfig from '../config/contracts.config';

/**
 * The EIP-1193 provider behind the wallet Web3Modal connected — set once by
 * Web3Context whenever its connection state changes. This is deliberately
 * the *only* source of a wallet provider in this module: with multiple
 * wallet extensions installed, a `window.ethereum` fallback here would
 * silently pick whichever extension last claimed that global, bypassing
 * the wallet the user actually selected in the modal (EIP-6963 exists
 * precisely so Web3Modal can disambiguate that choice correctly).
 */
let activeWalletProvider = null;

export const setModalProvider = (provider) => {
  activeWalletProvider = provider;
};

export const web3Service = {
  /**
   * Guaranteed Read-Only Robinhood Testnet RPC Provider
   * Bypasses wallet/network mismatch issues for instant reads.
   */
  getReadOnlyProvider: () => {
    return new ethers.providers.JsonRpcProvider(envConfig.robinhoodRpcUrl);
  },

  /**
   * Ethers provider for the connected wallet, or the read-only RPC provider
   * if no wallet is connected. Never falls back to a raw injected provider.
   */
  getProvider: () => {
    if (activeWalletProvider) {
      return new ethers.providers.Web3Provider(activeWalletProvider);
    }
    return web3Service.getReadOnlyProvider();
  },

  /**
   * Signer for the connected wallet. Throws if no wallet is connected —
   * callers that can run before/without a wallet should guard on
   * `useWeb3().isConnected` first rather than relying on this to fail late.
   */
  getSigner: async () => {
    if (!activeWalletProvider) {
      throw new Error('No wallet connected');
    }
    const provider = new ethers.providers.Web3Provider(activeWalletProvider);
    return provider.getSigner();
  },

  /**
   * Switch/Add Robinhood testnet network on the connected wallet.
   */
  ensureRobinhoodNetwork: async () => {
    const targetEthereum = activeWalletProvider;
    if (!targetEthereum) return true;

    try {
      const provider = new ethers.providers.Web3Provider(targetEthereum);
      const network = await provider.getNetwork();

      if (network.chainId !== envConfig.robinhoodChainIdDec) {
        try {
          await targetEthereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: envConfig.robinhoodChainIdHex }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await targetEthereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: envConfig.robinhoodChainIdHex,
                  chainName: 'Robinhood Testnet',
                  rpcUrls: [envConfig.robinhoodRpcUrl],
                  nativeCurrency: {
                    name: 'Robinhood',
                    symbol: 'RH',
                    decimals: 18,
                  },
                  blockExplorerUrls: envConfig.robinhoodExplorerUrl ? [envConfig.robinhoodExplorerUrl] : [],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to switch to Robinhood network:', error);
      return false;
    }
  },

  /**
   * Read-Only Contract Helpers (Uses Robinhood RPC directly, independent of MetaMask network)
   */
  getReadOnlyMarketplaceContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.marketplace.address, contractsConfig.marketplace.abi, provider);
  },

  getReadOnlyVaultContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.vault.address, contractsConfig.vault.abi, provider);
  },

  getReadOnlyAssetNftContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.assetNft.address, contractsConfig.assetNft.abi, provider);
  },

  getReadOnlyStableCoinContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.stableCoin.address, contractsConfig.stableCoin.abi, provider);
  },

  getReadOnlyOrderBookContract: () => {
    const provider = web3Service.getReadOnlyProvider();
    return new ethers.Contract(contractsConfig.orderBook.address, contractsConfig.orderBook.abi, provider);
  },

  /**
   * Write Contract Helpers (Requires signer)
   */
  getMarketplaceContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.marketplace.address, contractsConfig.marketplace.abi, signer);
  },

  getVaultContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.vault.address, contractsConfig.vault.abi, signer);
  },

  getAssetNftContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.assetNft.address, contractsConfig.assetNft.abi, signer);
  },

  getStableCoinContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.stableCoin.address, contractsConfig.stableCoin.abi, signer);
  },

  getOrderBookContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.orderBook.address, contractsConfig.orderBook.abi, signer);
  },

  getRentDistributorContract: async () => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(contractsConfig.rentDistributor.address, contractsConfig.rentDistributor.abi, signer);
  },

  /**
   * Share token (ERC-3643) for a listing, bound to the connected signer.
   * Each asset has its own token address, so this can't be a fixed
   * contract like the ones above.
   */
  getShareTokenContract: async (shareTokenAddress) => {
    const signer = await web3Service.getSigner();
    return new ethers.Contract(shareTokenAddress, contractsConfig.shareToken.abi, signer);
  },

  /**
   * Checks admin/authority permission directly against the AssetNFT
   * contract instead of comparing to a hardcoded env address. Covers both
   * AUTHORITY_ROLE (the operational minter role) and DEFAULT_ADMIN_ROLE
   * (the AccessControl super-admin), since either should be allowed to
   * mint. Read-only, so it works even before a signer is available.
   */
  /**
   * Asks the connected wallet to show an NFT (EIP-747 wallet_watchAsset,
   * type ERC721 — supported by MetaMask; other wallets may reject it).
   * The connected account must own the token. Resolves true if the wallet
   * accepted, false if the user declined; throws if the wallet can't do it.
   */
  watchNft: async (address, tokenId) => {
    if (!activeWalletProvider) throw new Error('No wallet connected');
    return activeWalletProvider.request({
      method: 'wallet_watchAsset',
      params: { type: 'ERC721', options: { address, tokenId: String(tokenId) } },
    });
  },

  /**
   * Asks the connected wallet to track an ERC-20 (EIP-747 wallet_watchAsset).
   * MetaMask caps symbols at 11 characters, so longer ones are shortened.
   */
  watchToken: async ({ address, symbol, decimals = 0 }) => {
    if (!activeWalletProvider) throw new Error('No wallet connected');
    return activeWalletProvider.request({
      method: 'wallet_watchAsset',
      params: { type: 'ERC20', options: { address, symbol: String(symbol || 'SHARE').slice(0, 11), decimals } },
    });
  },

  isAssetNftAdmin: async (address) => {
    if (!address) return false;
    try {
      const contract = web3Service.getReadOnlyAssetNftContract();
      const [authorityRole, defaultAdminRole] = await Promise.all([
        contract.AUTHORITY_ROLE(),
        contract.DEFAULT_ADMIN_ROLE(),
      ]);
      const [hasAuthority, hasDefaultAdmin] = await Promise.all([
        contract.hasRole(authorityRole, address),
        contract.hasRole(defaultAdminRole, address),
      ]);
      return hasAuthority || hasDefaultAdmin;
    } catch (err) {
      console.error('Error checking AssetNFT admin role:', err);
      return false;
    }
  },
};

export default web3Service;
