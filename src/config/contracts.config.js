import envConfig from './env.config';

import MarketplaceArtifact from './abis/FractionalMarketplace.json';
import PropertyNFTArtifact from './abis/PropertyNFT.json';
import TokenArtifact from './abis/Token.json';
import OrderbookArtifact from './abis/Orderbook.json';
import ModularComplianceArtifact from './abis/ModularCompliance.json';
import IdentityRegistryArtifact from './abis/IdentityRegistry.json';
import FeeManagerArtifact from './abis/FeeManager.json';
import FractionalVaultArtifact from './abis/FractionalVault.json';

export const contractsConfig = {
  marketplace: {
    address: envConfig.marketplaceAddress,
    abi: MarketplaceArtifact.abi,
  },
  vault: {
    address: envConfig.vaultAddress,
    abi: FractionalVaultArtifact.abi,
  },
  // Per-property ERC-3643 share token; deployed by the vault, so the address
  // is looked up per property rather than configured.
  shareToken: {
    abi: TokenArtifact.abi,
  },
  propertyNft: {
    address: envConfig.nftContractAddress,
    abi: PropertyNFTArtifact.abi,
  },
  stableCoin: {
    address: envConfig.stableCoinAddress,
    abi: TokenArtifact.abi,
  },
  orderBook: {
    address: envConfig.orderBookAddress,
    abi: OrderbookArtifact.abi,
  },
  identityRegistry: {
    address: envConfig.identityRegistryAddress,
    abi: IdentityRegistryArtifact.abi,
  },
  feeManager: {
    // Address is read from the marketplace at call time (marketplace.feeManager()),
    // so it does not need to be configured here.
    abi: FeeManagerArtifact.abi,
  },
  compliance: {
    // Deployed per-property by TokenizePropertyPage; no fixed address.
    abi: ModularComplianceArtifact.abi,
    bytecode: ModularComplianceArtifact.bytecode,
  },
};

export default contractsConfig;
