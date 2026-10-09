import { useCallback, useEffect, useState } from 'react';
import web3Service from '../../../services/web3Service';
import rentApi from '../api/rentApi';

const storageKey = (address) => `varelo-admin-session:${address}`;

const readStored = (address) => {
  try {
    const raw = sessionStorage.getItem(storageKey(address));
    if (!raw) return null;
    const session = JSON.parse(raw);
    return new Date(session.expiresAt) > new Date() ? session : null;
  } catch {
    return null;
  }
};

const store = (address, session) => {
  try {
    if (session) sessionStorage.setItem(storageKey(address), JSON.stringify(session));
    else sessionStorage.removeItem(storageKey(address));
  } catch {
    // Storage unavailable (private mode etc.) — the session just won't
    // survive a reload.
  }
};

/**
 * Backend admin session for the connected wallet: the wallet signs a
 * one-time message, the backend checks it is an admin and returns a token.
 * Kept in sessionStorage per wallet, so switching accounts drops it.
 */
export const useAdminSession = (address) => {
  const [session, setSession] = useState(() => (address ? readStored(address) : null));
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    setSession(address ? readStored(address) : null);
  }, [address]);

  const signIn = useCallback(async () => {
    if (!address) throw new Error('Connect your wallet first');
    setSigningIn(true);
    try {
      const { message } = await rentApi.requestAdminNonce(address);
      const signer = await web3Service.getSigner();
      const signature = await signer.signMessage(message);
      const result = await rentApi.verifyAdmin(address, signature);
      const next = { token: result.token, expiresAt: result.expiresAt };
      store(address, next);
      setSession(next);
      return next;
    } finally {
      setSigningIn(false);
    }
  }, [address]);

  /** Drop the session locally (on logout, or when the backend says 401). */
  const clear = useCallback(() => {
    if (address) store(address, null);
    setSession(null);
  }, [address]);

  const signOut = useCallback(async () => {
    if (session?.token) {
      try {
        await rentApi.logoutAdmin(session.token);
      } catch {
        // Already expired server-side — nothing more to do.
      }
    }
    clear();
  }, [session, clear]);

  return { token: session?.token ?? null, expiresAt: session?.expiresAt ?? null, signingIn, signIn, signOut, clear };
};

export default useAdminSession;
