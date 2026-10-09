import axios from 'axios';
import envConfig from '../../../config/env.config';

const api = axios.create({
  baseURL: `${envConfig.apiBaseUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
});

/** Every endpoint wraps its payload as { success, message, data }. */
const unwrap = (response) => response.data?.data;

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

/** The backend's error message, when there is one, for toasts. */
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || fallback;

export const isUnauthorized = (error) => error?.response?.status === 401;

export const rentApi = {
  // ── Public ──────────────────────────────────────────────────────────────────
  getStatus: async () => unwrap(await api.get('/rent/status')),

  // ── Investor ────────────────────────────────────────────────────────────────
  getInvestorSummary: async (address) => unwrap(await api.get(`/rent/investor/${address}/summary`)),
  getInvestorPayouts: async (address, page = 1, limit = 10) =>
    unwrap(await api.get(`/rent/investor/${address}/payouts`, { params: { page, limit } })),
  getInvestorActivity: async (address, page = 1, limit = 10) =>
    unwrap(await api.get(`/rent/investor/${address}/activity`, { params: { page, limit } })),

  // ── Admin sign-in ───────────────────────────────────────────────────────────
  requestAdminNonce: async (address) => unwrap(await api.post('/auth/admin/nonce', { address })),
  verifyAdmin: async (address, signature) => unwrap(await api.post('/auth/admin/verify', { address, signature })),
  getAdminSession: async (token) => unwrap(await api.get('/auth/admin/me', auth(token))),
  logoutAdmin: async (token) => unwrap(await api.post('/auth/admin/logout', {}, auth(token))),

  // ── Admin rent ──────────────────────────────────────────────────────────────
  getOverview: async (token) => unwrap(await api.get('/rent/admin/overview', auth(token))),
  getAssets: async (token) => unwrap(await api.get('/rent/admin/assets', auth(token))),
  getAssetStreams: async (token, tokenId) => unwrap(await api.get(`/rent/admin/assets/${tokenId}/streams`, auth(token))),
  updateAssetStreams: async (token, tokenId, payload) =>
    unwrap(await api.put(`/rent/admin/assets/${tokenId}/streams`, payload, auth(token))),
  getHolders: async (token, tokenId) => unwrap(await api.get(`/rent/admin/assets/${tokenId}/holders`, auth(token))),
  createDistribution: async (token, payload) => unwrap(await api.post('/rent/admin/distributions', payload, auth(token))),
  listDistributions: async (token, params = {}) =>
    unwrap(await api.get('/rent/admin/distributions', { ...auth(token), params })),
  getDistribution: async (token, id) => unwrap(await api.get(`/rent/admin/distributions/${id}`, auth(token))),
  submitBatch: async (token, id, batchIndex, txHash) =>
    unwrap(await api.post(`/rent/admin/distributions/${id}/batches/${batchIndex}/submit`, { txHash }, auth(token))),
  syncDistribution: async (token, id) => unwrap(await api.post(`/rent/admin/distributions/${id}/sync`, {}, auth(token))),
  cancelDistribution: async (token, id) => unwrap(await api.delete(`/rent/admin/distributions/${id}`, auth(token))),
};

export default rentApi;
