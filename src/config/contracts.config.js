import envConfig from './env.config';

import MarketplaceArtifact from './abis/FractionalMarketplace.json';
import AssetNFTArtifact from './abis/AssetNFT.json';
import TokenArtifact from './abis/Token.json';
import OrderbookArtifact from './abis/Orderbook.json';
import ModularComplianceArtifact from './abis/ModularCompliance.json';
import IdentityRegistryArtifact from './abis/IdentityRegistry.json';
import FeeManagerArtifact from './abis/FeeManager.json';
import FractionalVaultArtifact from './abis/FractionalVault.json';
import RentDistributorArtifact from './abis/RentDistributor.json';

export const contractsConfig = {
  marketplace: {
    address: envConfig.marketplaceAddress,
    abi: MarketplaceArtifact.abi,
  },
  vault: {
    address: envConfig.vaultAddress,
    abi: FractionalVaultArtifact.abi,
  },
  // Per-asset ERC-3643 share token; deployed by the vault, so the address
  // is looked up per asset rather than configured.
  shareToken: {
    abi: TokenArtifact.abi,
  },
  assetNft: {
    address: envConfig.nftContractAddress,
    abi: AssetNFTArtifact.abi,
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
  // Pays a batch of monthly rent to many holders in one transaction; signed
  // from the admin's wallet on the Rent Distribution page.
  rentDistributor: {
    address: envConfig.rentDistributorAddress,
    abi: RentDistributorArtifact.abi,
  },
  feeManager: {
    // Address is read from the marketplace at call time (marketplace.feeManager()),
    // so it does not need to be configured here.
    abi: FeeManagerArtifact.abi,
  },
  compliance: {
    // Deployed per-asset by TokenizeAssetPage; no fixed address.
    abi: ModularComplianceArtifact.abi,
    bytecode: ModularComplianceArtifact.bytecode,
  },
};

export default contractsConfig;
