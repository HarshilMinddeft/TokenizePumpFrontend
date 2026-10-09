import { useCallback, useRef, useState } from 'react';

/**
 * The last step of tokenizing an asset: publish the gallery + PDF, then save
 * the asset in the VARELO backend.
 *
 * By then the NFT already exists on-chain, so a failure here must never look
 * like success and must never mean "mint it again". This hook keeps the minted
 * asset's identifiers, lets the admin retry just this step, doesn't re-upload
 * files that were already published, and remembers the finished record in
 * localStorage so a retry still works after a page reload.
 */

const PENDING_KEY = 'varelo:pending-asset-registration';

const loadPending = () => {
  try {
    const record = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    return record?.info?.tokenId && record?.payload ? record : null;
  } catch {
    return null;
  }
};

const savePending = (record) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (private mode etc.) — retry still works until reload.
  }
};

const clearPending = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to clear.
  }
};

/** Plain-language reason a registration call failed. */
export const describeRegistrationError = (err) =>
  err?.response?.data?.message ||
  (err?.request && !err?.response ? 'The VARELO server could not be reached.' : err?.message) ||
  'Something went wrong.';

/**
 * @param {object} deps
 * @param {(file: File) => Promise<string>} deps.uploadFile  publishes a file to IPFS, returns its URL
 * @param {(payload: object) => Promise<unknown>} deps.addAsset  saves the asset in the backend
 * @returns `finish(...)` resolves to 'registered' | 'already' | 'failed'
 */
export const useAssetRegistration = ({ uploadFile, addAsset }) => {
  const [minted, setMinted] = useState(null);
  const [saved, setSaved] = useState(loadPending); // finished record from a failed attempt or an earlier session
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const uploads = useRef({ gallery: null, pdf: null }); // published URLs, so a retry doesn't upload again
  const lastRun = useRef(null);

  const info = minted ?? saved?.info ?? null;

  const markRegistered = useCallback(() => {
    clearPending();
    setSaved(null);
    setRegistered(true);
  }, []);

  const submit = useCallback(
    async (payload) => {
      setStatus('Registering the asset…');
      try {
        await addAsset(payload);
        markRegistered();
        return 'registered';
      } catch (err) {
        // A first attempt can save the asset yet lose its reply; the retry
        // then finds it already there, which is the outcome we wanted.
        if (err?.response?.status === 409) {
          markRegistered();
          return 'already';
        }
        throw err;
      }
    },
    [addAsset, markRegistered],
  );

  /**
   * @param {{tokenId: string, owner: string, complianceAddress: string, singleImageUrl: string}} mintInfo
   * @param {{galleryFiles?: File[], pdfFile?: File|null, buildPayload: (parts: object) => object}} args
   */
  const finish = useCallback(
    async (mintInfo, args) => {
      lastRun.current = { mintInfo, args };
      setMinted(mintInfo);
      setBusy(true);
      setError('');
      try {
        const { galleryFiles = [], pdfFile = null, buildPayload } = args;
        if (!uploads.current.gallery) {
          const urls = [];
          for (const file of galleryFiles) {
            setStatus(`Publishing gallery image ${urls.length + 1} of ${galleryFiles.length}…`);
            urls.push(await uploadFile(file));
          }
          uploads.current.gallery = urls;
        }
        if (uploads.current.pdf === null) {
          setStatus('Publishing the offering PDF…');
          uploads.current.pdf = pdfFile ? await uploadFile(pdfFile) : '';
        }

        const payload = buildPayload({ ...mintInfo, gallery: uploads.current.gallery, pdf: uploads.current.pdf });
        const record = { info: mintInfo, payload };
        savePending(record); // before the save, so a failure (or a closed tab) can be retried
        setSaved(record);
        return await submit(payload);
      } catch (err) {
        setError(describeRegistrationError(err));
        return 'failed';
      } finally {
        setStatus('');
        setBusy(false);
      }
    },
    [uploadFile, submit],
  );

  /** Retry just the registration — never mints again. */
  const retry = useCallback(async () => {
    if (lastRun.current) return finish(lastRun.current.mintInfo, lastRun.current.args);
    if (!saved) return 'failed';

    // Fresh page after a reload: the finished payload is all we need.
    setMinted(saved.info);
    setBusy(true);
    setError('');
    try {
      return await submit(saved.payload);
    } catch (err) {
      setError(describeRegistrationError(err));
      return 'failed';
    } finally {
      setStatus('');
      setBusy(false);
    }
  }, [finish, saved, submit]);

  /** Give up on the unfinished registration (the NFT stays on-chain). */
  const discard = useCallback(() => {
    clearPending();
    setSaved(null);
    setMinted(null);
    setError('');
    lastRun.current = null;
    uploads.current = { gallery: null, pdf: null };
  }, []);

  return {
    info,
    registered,
    error,
    busy,
    status,
    /** The NFT exists but the backend doesn't know it yet. */
    unfinished: !registered && !busy && Boolean(info),
    finish,
    retry,
    discard,
  };
};

export default useAssetRegistration;
