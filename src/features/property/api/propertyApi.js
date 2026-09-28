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
 * Callers want the payload itself (e.g. { properties: [...] }), so unwrap
 * it here once rather than in each page.
 */
const unwrap = (response) => response.data?.data ?? response.data;

export const propertyApi = {
  // Fetch properties owned by address
  getOwnerProperties: async (ownerAddress) => {
    const response = await api.get(`/properties/getOwnerProperty?ownerAddress=${ownerAddress}`);
    return unwrap(response);
  },

  // Fetch all marketplace properties summary
  getAllMarketplaceProperties: async () => {
    const response = await api.get(`/properties/marketPlace/getAllPropertiesSummary`);
    return unwrap(response);
  },

  // Fetch single property details by ID
  getPropertyById: async (propertyId) => {
    const response = await api.get(`/properties/marketPlace/getPropertyById/${propertyId}`);
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
    const response = await axios.post(`${envConfig.apiBaseUrl}/api/properties/nftUpload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  // Upload metadata JSON to IPFS via backend
  uploadMetadata: async (metadataJSON) => {
    const response = await api.post(`/properties/metadataUpload`, metadataJSON);
    return unwrap(response);
  },

  // Store property entry in backend DB
  addProperty: async (propertyPayload) => {
    const response = await api.post(`/properties/addProperty`, propertyPayload);
    return response.data;
  },
};

export default propertyApi;
