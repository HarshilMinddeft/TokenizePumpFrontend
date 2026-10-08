import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import envConfig from '../../../config/env.config';
import contractsConfig from '../../../config/contracts.config';
import { useWeb3 } from '../../../context/Web3Context';
import { useZodForm } from '../../../hooks/useZodForm';
import { tokenizeAssetSchema, parseLeadingNumber } from '../schemas/assetSchema';
import { evenlyDividingTiers, PRICE_STEP } from '../../../utils/units';
import { formatUsd, shortenAddress } from '../../../lib/utils';

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

const SectionHead = ({ title }) => (
  <h2 className="mb-5 text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">{title}</h2>
);

const WalletGlyph = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const Icons = {
  image: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z"
      />
    </svg>
  ),
  gallery: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  ),
  pdf: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  ),
  file: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
      />
    </svg>
  ),
};

const fmtSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Drop-zone style picker row. Preview image optional (object URL for the primary shot). */
const FilePicker = ({ kind = 'file', preview, fileName, meta, description, accept, multiple, required, error, onFiles }) => (
  <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5">
    <input type="file" className="sr-only" accept={accept} multiple={multiple} required={required} onChange={onFiles} />
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition-colors group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </span>
        </>
      ) : (
        Icons[kind] || Icons.file
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{fileName || description}</span>
        {required && <span className="text-red-400">*</span>}
      </span>
      <span className="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
        {error || meta || 'Click to browse'}
      </span>
    </span>
    <span className="flex shrink-0 items-center gap-2">
      {fileName && <Badge tone="success">Ready</Badge>}
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-indigo-300 group-hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </span>
    </span>
  </label>
);

/**
 * Live check on whether the entered asset price can later be split into
 * whole shares at Fractionalize time. FractionalVault mints
 * assetPrice / basePrice shares with no remainder allowed
 * (SHARE_DECIMALS == 0), and basePrice is offered in $10 steps there — so a
 * price with no evenly-dividing $10 tier can never be fractionalized. Flags
 * that at entry time rather than letting it surface as a dead end later.
 */
const getPriceDivisibilityHint = (rawValue) => {
  const price = parseLeadingNumber(rawValue);
  if (Number.isNaN(price) || price <= 0) return null;

  const validTiers = evenlyDividingTiers(price);
  if (validTiers.length === 0) {
    return {
      tone: 'negative',
      text: `No $${PRICE_STEP}-multiple price per share divides $${price} evenly — this asset won't be fractionalizable later. Choose a price that's a multiple of $${PRICE_STEP}.`,
    };
  }

  return {
    tone: 'positive',
    text: `Divisible at $${validTiers.join(', $')} per share once fractionalized.`,
  };
};

const FLOW_STEPS = [
  { title: 'Primary image → IPFS', detail: 'Stored on IPFS; used as the NFT artwork' },
  { title: 'Deploy compliance contract', detail: 'Security wrapper for the asset' },
  { title: 'Ownership hand-over', detail: 'Compliance moved to the asset owner' },
  { title: 'Mint asset NFT', detail: 'One NFT per real-world asset' },
  { title: 'Register with VARELO', detail: 'Gallery, metadata & documents published' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const TokenizeAssetPage = () => {
  const { address, isConnected } = useWeb3();
  const [singleImage, setSingleImage] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [multipleImages, setMultipleImages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [propUploadStatus, setProUploadStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [busy, setBusy] = useState(false);
  // Index into FLOW_STEPS for the step currently in flight — -1 before
  // submit. Drives the sidebar's per-step check/spinner state instead of a
  // single `busy` flag, which previously marked every step "done" the
  // instant the whole submit started.
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    assetPrice: '',
    assetSize: '',
    assetOwnerWallet: '',
    features: '',
    offering: '',
    details: '',
    management: '',
    location: '',
  });

  const { errors, validate, clearError } = useZodForm(tokenizeAssetSchema);

  // Estimated share count once fractionalized, using the cheapest evenly-
  // dividing $10 tier so the preview stays a useful upper bound rather than
  // assuming a fixed $40/share price that may not even divide evenly.
  const expectedTokenCount = useMemo(() => {
    const price = parseLeadingNumber(formData.assetPrice);
    if (Number.isNaN(price) || price <= 0) return 0;
    const [cheapestTier] = evenlyDividingTiers(price);
    return cheapestTier ? Math.floor(price / cheapestTier) : 0;
  }, [formData.assetPrice]);

  const fileCount = (singleImage ? 1 : 0) + multipleImages.length + (pdfFile ? 1 : 0);

  const priceHint = useMemo(
    () => (formData.assetPrice ? getPriceDivisibilityHint(formData.assetPrice) : null),
    [formData.assetPrice],
  );

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearError(e.target.name);
  };

  const handleSingleImageChange = (e) => {
    setSingleImage(e.target.files[0]);
    clearError('singleImage');
  };
  const handleMultipleImagesChange = (e) => setMultipleImages([...e.target.files]);
  const handlePdfChange = (e) => setPdfFile(e.target.files[0]);

  useEffect(() => {
    if (!singleImage) {
      setPrimaryPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(singleImage);
    setPrimaryPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [singleImage]);

  const uploadToPinata = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const data = await assetApi.uploadNftImage(fd);
    return data.url || `${envConfig.ipfsGateway}${data.IpfsHash}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { success, data } = validate({ ...formData, singleImage });
    if (!success) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const assetSize = parseLeadingNumber(data.assetSize);
    const assetPrice = parseLeadingNumber(data.assetPrice);

    setBusy(true);
    setCurrentStep(0);
    setUploadStatus('Uploading to IPFS…');

    try {
      let tokenpId = '';
      let singleImageUrl = '';
      let complianceAddress = '';

      if (singleImage) {
        setUploadStatus('Uploading primary image to IPFS…');
        singleImageUrl = await uploadToPinata(singleImage);

        const metadata = {
          description: formData.details,
          external_url: 'https://openseacreatures.io/3',
          image: singleImageUrl,
          name: formData.name,
          attributes: [
            {
              trait_type: 'PDF',
              value: 'Doc',
            },
          ],
        };

        setUploadStatus('Publishing NFT metadata…');
        const metadataData = await assetApi.uploadMetadata(metadata);
        const metadataUrl = `${envConfig.publicIpfsGateway}${metadataData.IpfsHash}`;

        const signer = await web3Service.getSigner();

        const complianceFactory = new ethers.ContractFactory(
          contractsConfig.compliance.abi,
          contractsConfig.compliance.bytecode,
          signer,
        );
        setCurrentStep(1);
        setUploadStatus('Deploying compliance contract…');
        const complianceContract = await complianceFactory.deploy();
        await complianceContract.deployed();

        complianceAddress = complianceContract.address;

        setUploadStatus('Initializing compliance contract…');
        const initTx = await complianceContract.init();
        await initTx.wait();

        const complianceCont = new ethers.Contract(complianceAddress, contractsConfig.compliance.abi, signer);
        setCurrentStep(2);
        setUploadStatus('Transferring ownership to the asset owner…');
        const changeOwnerCompliance = await complianceCont.transferOwnership(formData.assetOwnerWallet);
        await changeOwnerCompliance.wait();

        const assetNftContract = await web3Service.getAssetNftContract();
        setCurrentStep(3);
        setUploadStatus('Minting the asset NFT…');
        const transaction = await assetNftContract.mintAsset(
          formData.name,
          formData.name,
          formData.assetOwnerWallet,
          metadataUrl,
          formData.location,
          assetSize,
          assetPrice,
        );

        const receipt = await transaction.wait();
        const mintedEvent = receipt.events.find((event) => event.event === 'AssetMinted');
        const tokenId = mintedEvent.args.tokenId.toString();
        tokenpId = tokenId;
        const recipient = mintedEvent.args.recipient;

        setProUploadStatus(
          `NFT Minted!\nAsset NFT ID: ${tokenId}\nOwner Address: ${recipient}\nNft Address: ${contractsConfig.assetNft.address}`,
        );
      }

      setCurrentStep(4);
      setUploadStatus('');
      const multiImageUrls = [];
      for (const file of multipleImages) {
        const url = await uploadToPinata(file);
        multiImageUrls.push(url);
      }

      let pdfUrl = '';
      if (pdfFile) pdfUrl = await uploadToPinata(pdfFile);

      setUploadStatus('Registering the asset…');
      const finalPayload = {
        assetId: tokenpId,
        assetName: formData.name,
        assetPrice: formData.assetPrice,
        assetSize: formData.assetSize,
        assetOwnerWallet: formData.assetOwnerWallet,
        assetFeatures: formData.features,
        offeringDetails: formData.offering,
        assetDetails: formData.details,
        assetManagement: formData.management,
        locationDetails: formData.location,
        assetDocuments: [pdfUrl],
        assetImages: multiImageUrls,
        assetThumbImages: [singleImageUrl],
        complianceAddress: complianceAddress,
        active: true,
      };

      await assetApi.addAsset(finalPayload);

      setUploadStatus('');
      toast.success('Process Completed successfully.');
    } catch (err) {
      console.error(err);
      setUploadStatus('');
      setCurrentStep(-1);
      if (err instanceof Error) {
        if (err.message.includes('user rejected')) {
          toast.error('Transaction Rejected.');
        } else if (err.message.includes('cannot estimate gas')) {
          toast.error('Unauthorized Account');
        } else {
          toast.error('Please try after some time');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  // Admin gate reads AUTHORITY_ROLE / DEFAULT_ADMIN_ROLE from AssetNFT
  // directly rather than comparing to a single configured address — a
  // wallet granted the role on-chain works without redeploying this app,
  // and one that had it revoked stops seeing a form that would only revert.
  useEffect(() => {
    if (!isConnected || !address) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    web3Service.isAssetNftAdmin(address).then((result) => {
      if (!cancelled) setIsAdmin(result);
    });
    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const hasSummary = formData.name || formData.location || formData.assetPrice || formData.assetOwnerWallet;

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Tokenize Asset"
        description="Register a real-world asset on-chain — publish its evidence, deploy a compliance wrapper and mint the asset NFT in one guided flow."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18M3.75 3h16.5M9 6.75h.008v.008H9V6.75Zm0 3h.008v.008H9V9.75Zm0 3h.008v.008H9v-.008Zm3-6h.008v.008H12V6.75Zm0 3h.008v.008H12V9.75Zm0 3h.008v.008H12v-.008Z"
          />
        }
      />

      {!isAdmin && address ? (
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin access required</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Only the marketplace authority or admin wallet can register new assets. Connect an authorized wallet
            to continue.
          </p>
          <Badge tone="warning" className="mt-4">
            Unauthorized account
          </Badge>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* ==================== MAIN FORM ==================== */}
          <Card className="overflow-hidden">
            {propUploadStatus && busy ? (
              <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-[3px] border-indigo-100 dark:border-indigo-500/20" />
                  <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-indigo-600 dark:border-t-indigo-400" />
                  <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  NFT minted — finishing up
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {uploadStatus || 'Publishing the gallery and registering the asset…'}
                </p>
              </div>
            ) : propUploadStatus ? (
              <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
                <div className="relative mb-5">
                  <span className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-xl" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                    <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Asset registered on-chain
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  The NFT is minted and the asset is live in the registry. Save these identifiers.
                </p>
                <div className="mt-6 w-full max-w-md space-y-2 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-950/60">
                  {propUploadStatus.split('\n').map((line) => {
                    const idx = line.indexOf(':');
                    if (idx === -1) {
                      return (
                        <p key={line} className="text-xs font-bold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <div key={line} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {line.slice(0, idx)}:
                        </span>
                        <span className="break-all text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                          {line.slice(idx + 1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button variant="secondary" className="mt-8" onClick={() => window.location.reload()}>
                  Register another asset
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="divide-y divide-slate-100 px-6 pb-6 sm:px-10 dark:divide-slate-800">
                  {/* 01 Asset identity */}
                  <section className="py-6 first:pt-6">
                    <SectionHead title="Asset" />
                    <div className="space-y-4">
                      <Input
                        name="name"
                        label="Asset name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Harbourview Tower, Unit 4B"
                        error={errors.name}
                        required
                      />
                      <Input
                        name="location"
                        label="Location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. Dubai Marina"
                        error={errors.location}
                        required
                      />
                      <Input
                        name="assetPrice"
                        label="Asset price (USD)"
                        type="number"
                        min="0"
                        prefix="$"
                        value={formData.assetPrice}
                        onChange={handleInputChange}
                        placeholder="500,000"
                        error={errors.assetPrice}
                        hint={priceHint?.text}
                        hintTone={priceHint?.tone}
                        required
                      />
                      <Input
                        name="assetSize"
                        label="Asset size"
                        type="number"
                        min="0"
                        suffix="sqft"
                        value={formData.assetSize}
                        onChange={handleInputChange}
                        placeholder="1,850"
                        error={errors.assetSize}
                        required
                      />
                    </div>
                  </section>

                  {/* 02 Ownership */}
                  <section className="py-6 first:pt-6">
                    <SectionHead title="Ownership" />
                    <Input
                      name="assetOwnerWallet"
                      label="Owner wallet address"
                      leadingIcon={<WalletGlyph />}
                      value={formData.assetOwnerWallet}
                      onChange={handleInputChange}
                      placeholder="0x…"
                      className="font-mono text-[13px]"
                      error={errors.assetOwnerWallet}
                      required
                    />
                  </section>

                  {/* 03 Story & details */}
                  <section className="py-6 first:pt-6">
                    <SectionHead title="Listing content" />
                    <div className="space-y-4">
                      <Input
                        name="features"
                        label="Features"
                        value={formData.features}
                        onChange={handleInputChange}
                        placeholder="e.g. 3 bedrooms, 2 bathrooms, pool, gym…"
                        error={errors.features}
                      />
                      <Textarea
                        name="offering"
                        label="Offering details"
                        rows={4}
                        value={formData.offering}
                        onChange={handleInputChange}
                        placeholder="e.g. neighborhood livability, local job market, commuter access, and demand drivers behind this offering…"
                        error={errors.offering}
                      />
                      <Textarea
                        name="details"
                        label="Asset details"
                        rows={4}
                        value={formData.details}
                        onChange={handleInputChange}
                        placeholder="Condition, build year, renovations…"
                        error={errors.details}
                      />
                      <Textarea
                        name="management"
                        label="Managed by"
                        rows={2}
                        value={formData.management}
                        onChange={handleInputChange}
                        placeholder="Asset management company"
                        error={errors.management}
                      />
                    </div>
                  </section>

                  {/* 04 Media & documents */}
                  <section className="py-6 first:pt-6">
                    <SectionHead title="Media & documents" />
                    <div className="space-y-4">
                      <FilePicker
                        kind="image"
                        label="Primary image"
                        required
                        accept="image/*"
                        description="JPG or PNG · becomes the NFT artwork"
                        preview={primaryPreview}
                        fileName={singleImage?.name}
                        meta={singleImage ? fmtSize(singleImage.size) : 'Click to browse'}
                        error={errors.singleImage}
                        onFiles={handleSingleImageChange}
                      />
                      <FilePicker
                        kind="gallery"
                        label="Gallery images"
                        multiple
                        accept="image/*"
                        description="Interior & exterior photos for the asset page"
                        fileName={multipleImages.length > 0 ? `${multipleImages.length} image${multipleImages.length > 1 ? 's' : ''}` : ''}
                        meta={
                          multipleImages.length > 0
                            ? `${fmtSize(multipleImages.reduce((s, f) => s + f.size, 0))} total`
                            : 'Click to browse'
                        }
                        onFiles={handleMultipleImagesChange}
                      />
                      <FilePicker
                        kind="pdf"
                        label="Offering PDF"
                        accept="application/pdf"
                        description="Legal & offering memorandum"
                        fileName={pdfFile?.name}
                        meta={pdfFile ? fmtSize(pdfFile.size) : 'Click to browse'}
                        onFiles={handlePdfChange}
                      />
                    </div>
                  </section>
                </div>

                {/* Submit bar */}
                <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-slate-800 dark:bg-slate-950/30">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className={fileCount > 0 ? 'text-emerald-500' : ''}>●</span>
                      {fileCount > 0 ? `${fileCount} file${fileCount > 1 ? 's' : ''} ready` : 'No files attached'}
                    </span>
                    {expectedTokenCount > 0 && (
                      <span className="hidden sm:inline">
                        Est. supply · <span className="font-semibold text-slate-600 dark:text-slate-300">{expectedTokenCount.toLocaleString('en-US')}</span> tokens
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    loading={busy}
                    disabled={priceHint?.tone === 'negative'}
                    className="sm:min-w-52"
                  >
                    {busy ? 'Registering…' : 'Register asset'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* ==================== SIDE RAIL ==================== */}
          <div className="space-y-5 xl:sticky xl:top-24">
            {/* Execution flow */}
            <Card className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase dark:text-slate-500">
                  Execution flow
                </p>
                <Badge tone="warning" dot>
                  {busy ? 'Running' : 'Approvals'}
                </Badge>
              </div>
              <ol className="space-y-4">
                {FLOW_STEPS.map((step, i) => {
                  // currentStep is the step in flight; anything before it is
                  // done, and nothing is "done" before submit (-1).
                  const running = i === currentStep;
                  const done = currentStep > i || (currentStep === -1 && Boolean(propUploadStatus) && !busy);
                  return (
                    <li key={step.title} className="relative flex items-start gap-3">
                      {i < FLOW_STEPS.length - 1 && (
                        <span className="absolute top-6 left-[11px] h-[calc(100%-8px)] w-px bg-slate-100 dark:bg-slate-800" />
                      )}
                      <span
                        className={`relative z-10 mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-white dark:ring-slate-900 ${
                          done || running
                            ? 'bg-indigo-400 text-[#1a140e]'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}
                      >
                        {running ? (
                          <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-current/30 border-t-current" />
                        ) : done ? (
                          '✓'
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{step.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {uploadStatus && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-indigo-50/80 px-3.5 py-2.5 text-[13px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                  </svg>
                  <span className="truncate">{uploadStatus}</span>
                </div>
              )}
            </Card>

            {/* Live summary */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase dark:text-slate-500">
                  Asset summary
                </p>
                <svg className="h-4 w-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              </div>

              {hasSummary ? (
                <div className="space-y-2.5">
                  <SummaryRow label="Name" value={formData.name} />
                  <SummaryRow label="Location" value={formData.location} />
                  <SummaryRow label="Value" value={formData.assetPrice ? formatUsd(formData.assetPrice, 0) : undefined} />
                  <SummaryRow label="Size" value={formData.assetSize ? `${Number(formData.assetSize).toLocaleString('en-US')} sqft` : undefined} />
                  <SummaryRow label="Est. share supply" value={expectedTokenCount > 0 ? expectedTokenCount.toLocaleString('en-US') : undefined} mono />
                  <SummaryRow
                    label="Owner"
                    value={
                      formData.assetOwnerWallet?.startsWith('0x') && formData.assetOwnerWallet.length > 20
                        ? shortenAddress(formData.assetOwnerWallet, 8, 6)
                        : undefined
                    }
                    mono
                  />
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3.5 py-6 text-center text-xs leading-relaxed text-slate-400 dark:bg-slate-950/50 dark:text-slate-500">
                  Start typing in the form and a live summary will appear here before you sign.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const SummaryRow = ({ label, value, mono = false }) => (
  <div className="flex items-center justify-between gap-3 text-[13px]">
    <span className="shrink-0 text-slate-400 dark:text-slate-500">{label}</span>
    <span
      className={`min-w-0 truncate text-right font-medium text-slate-700 dark:text-slate-200 ${
        mono ? 'font-mono text-xs' : ''
      } ${value ? '' : 'text-slate-300 dark:text-slate-600'}`}
    >
      {value || '—'}
    </span>
  </div>
);

export default TokenizeAssetPage;
