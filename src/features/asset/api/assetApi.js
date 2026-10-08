import axios from 'axios';
import envConfig from '../../../config/env.config';

const api = axios.create({
  baseURL: `${envConfig.apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Every read endpoint wraps its payload as { success, message, data }.
 * Callers want the payload itself (e.g. { assets: [...] }), so unwrap
 * it here once rather than in each page.
 */
const unwrap = (response) => response.data?.data ?? response.data;

export const assetApi = {
  // Fetch assets owned by address
  getOwnerAssets: async (ownerAddress) => {
    const response = await api.get(`/assets/getOwnerAsset?ownerAddress=${ownerAddress}`);
    return unwrap(response);
  },

  // Fetch all marketplace assets summary
  getAllMarketplaceAssets: async () => {
    const response = await api.get(`/assets/marketPlace/getAllAssetsSummary`);
    return unwrap(response);
  },

  // Fetch single asset details by ID
  getAssetById: async (assetId) => {
    const response = await api.get(`/assets/marketPlace/getAssetById/${assetId}`);
    return unwrap(response);
  },

  // Register new user
  addNewUser: async (payload) => {
    const response = await api.post(`/users/addnewUser`, payload);
    return response.data;
  },

  // Manually trigger the on-chain KYC identity flow (mints the OnchainID,
  // adds the KYC claim, registers it in IdentityRegistry) that Blockpass's
  // own webhook would normally call — used because webhook delivery
  // requires a paid Blockpass plan we're not on. Must be called after
  // addNewUser, since the handler looks the user up by refId and does
  // nothing if that row doesn't exist yet.
  triggerKycWebhook: async (refId) => {
    const response = await api.post(`/users/blockpass-webhook`, { refId, status: 'approved' });
    return response.data;
  },

  // Upload NFT file to IPFS via backend
  uploadNftImage: async (formData) => {
    const response = await axios.post(`${envConfig.apiBaseUrl}/api/assets/nftUpload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  // Upload metadata JSON to IPFS via backend
  uploadMetadata: async (metadataJSON) => {
    const response = await api.post(`/assets/metadataUpload`, metadataJSON);
    return unwrap(response);
  },

  // Store asset entry in backend DB
  addAsset: async (assetPayload) => {
    const response = await api.post(`/assets/addAsset`, assetPayload);
    return response.data;
  },
};

export default assetApi;
