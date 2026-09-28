import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'motion/react';
import PublicLayout from '../../../components/layout/PublicLayout';
import AppLayout from '../../../components/layout/AppLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';
import Progress from '../../../components/ui/Progress';
import Badge from '../../../components/ui/Badge';
import Dialog from '../../../components/ui/Dialog';
import CopyButton from '../../../components/ui/CopyButton';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import contractsConfig from '../../../config/contracts.config';
import { ROUTES } from '../../../config/routes';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import {
  formatShares,
  formatStable,
  parseShares,
  parseStable,
  sharesTimesPrice,
} from '../../../utils/units';
import { cn, formatNumber, formatUsd, shortenAddress, toPercent } from '../../../lib/utils';

/**
 * Upper bound used only when the FeeManager can't be read; the marketplace
 * transfers the real fee, so approving this much is safe, never binding.
 */
const FEE_FALLBACK_BPS = 500;

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                          */
/* ------------------------------------------------------------------ */

const SectionLabel = ({ children, tone = 'slate' }) => (
  <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
    <span className={cn('h-4 w-1 rounded-full', tone === 'red' ? 'bg-red-400' : 'bg-gradient-to-b from-indigo-500 to-violet-500')} />
    <span className={cn(tone === 'red' ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500')}>
      {children}
    </span>
  </h3>
);

const BackButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Go back"
    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  </button>
);

const FACT_ICONS = {
  id: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
  ),
  token: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  ),
  price: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.552-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659L14.5 8.5" />
  ),
  perToken: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-4.5v9m-3.75-3.375c0 1.036 1.679 1.875 3.75 1.875s3.75-.84 3.75-1.875-1.679-1.875-3.75-1.875-3.75-.84-3.75-1.875S10.179 7 12.25 7s3.75.84 3.75 1.875" />
  ),
  remaining: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  total: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
  ),
  size: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  ),
  features: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  ),
  location: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  ),
  doc: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
  ),
};

const FactItem = ({ icon, label, value, mono = false, copyValue, className = '' }) => (
  <div
    className={cn(
      'flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20',
      className,
    )}
  >
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-700">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        {FACT_ICONS[icon]}
      </svg>
    </div>
    <div className="min-w-0 flex-1 text-left">
      <p className="text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{label}</p>
      <p className={cn('mt-0.5 font-semibold text-slate-800 dark:text-slate-100', mono ? 'font-mono text-xs leading-relaxed break-all' : 'text-sm truncate')}>
        {value}
      </p>
      {copyValue && (
        <CopyButton value={copyValue} label="Copy address" copiedLabel="Copied" className="mt-1" />
      )}
    </div>
  </div>
);

const Accordion = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {icon}
            </svg>
          </span>
          {title}
        </span>
        <svg
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={cn('grid transition-all duration-200 ease-in-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-left text-sm leading-relaxed whitespace-pre-line text-slate-500 dark:text-slate-400">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Image gallery                                                        */
/* ------------------------------------------------------------------ */

const Gallery = ({ images = [] }) => {
  const [active, setActive] = useState(0);

  if (!images?.length) {
    return (
      <Card className="flex aspect-[16/9] items-center justify-center text-slate-400 dark:text-slate-600">
        No images available for this property
      </Card>
    );
  }

  const goTo = (i) => setActive((i + images.length) % images.length);

  return (
    <Card className="overflow-hidden p-2.5 sm:p-3">
      <div className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={active}
            src={images[active]}
            alt={`Property view ${active + 1}`}
            initial={{ opacity: 0.4, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="aspect-[16/9] w-full object-cover"
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

        {images.length > 1 && (
          <>
            <ArrowButton dir="prev" onClick={() => goTo(active - 1)} />
            <ArrowButton dir="next" onClick={() => goTo(active + 1)} />
            <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="tf-scroll mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={url + index}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                'relative shrink-0 overflow-hidden rounded-lg ring-2 transition-all duration-150',
                index === active
                  ? 'ring-indigo-500 opacity-100'
                  : 'ring-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img src={url} alt={`Thumbnail ${index + 1}`} className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

const ArrowButton = ({ dir, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={dir === 'prev' ? 'Previous image' : 'Next image'}
    className={cn(
      'absolute top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-md backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:bg-white dark:bg-slate-900/85 dark:text-slate-100 dark:hover:bg-slate-900',
      dir === 'prev' ? 'left-3' : 'right-3',
    )}
  >
    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      {dir === 'prev' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  </button>
);

/* ------------------------------------------------------------------ */
/* Status                                                               */
/* ------------------------------------------------------------------ */

const StatusBanner = ({ buyBack, buyBackPrice }) =>
  buyBack ? (
    <Card className="flex items-start gap-2.5 border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span className="text-sm">
        <strong>Buyback in progress.</strong> The owner has escrowed funds to repurchase shares at{' '}
        {formatUsd(buyBackPrice)} each. New purchases are paused — you can sell your shares back at that price.
      </span>
    </Card>
  ) : null;

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const PropertyDetailPage = ({ isPublic = false }) => {
  const Layout = isPublic ? PublicLayout : AppLayout;
  const { id } = useParams();
  const navigate = useNavigate();
  const { address: currentSigner } = useWeb3();

  const [property, setProperty] = useState(null);
  const [buyTokensAmount, setBuyTokensAmount] = useState('');
  const [orderSellAmount, setOrderSellAmount] = useState('');
  const [opricePerToken, setPricePerToken] = useState('');
  const [contractListingData, setContractListingData] = useState({});
  // Sale fee rate (bps / denominator), read once from the FeeManager the
  // marketplace points at. Kept as a rate rather than a computed amount so
  // the "Estimated total" preview can recompute instantly as the buyer
  // types, without an on-chain round trip per keystroke.
  const [saleFeeRate, setSaleFeeRate] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [shareBalance, setShareBalance] = useState(null);
  const [orders, setOrders] = useState([]);
  const [buyAmounts, setBuyAmounts] = useState({});
  const [sellingTokens, setSellingTokens] = useState('');
  const [refId, setRefId] = useState('');
  // Set once the user confirms their reference ID — only then is the
  // Blockpass widget armed, so it isn't re-instantiated on every keystroke.
  const [confirmedRefId, setConfirmedRefId] = useState('');
  const [kycStatus, setKycStatus] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteKYCClick = () => {
    setConfirmedRefId('');
    setShowPopup(true);
  };

  const handleConfirmRefId = () => {
    if (!refId) {
      toast.error('Please enter a reference ID (e.g., email)');
      return;
    }
    setConfirmedRefId(refId);
  };

  /**
   * Wires the Blockpass widget to the "Continue with Blockpass" button.
   *
   * Blockpass's SDK works by attaching its own click listener to the
   * element named by `elementId` when `startKYCConnect()` runs — it does
   * not expose an imperative "open" call. Calling it from inside that same
   * button's onClick is one tick too late: the click has already finished
   * dispatching by the time the listener attaches, so the widget never
   * opens. It has to be armed while the dialog is open and the button
   * already exists in the DOM, before the user clicks it.
   *
   * The SDK has no `.off()` — `startKYCConnect()` only removes its *own*
   * previous click listener by reference, so a second instance created for
   * the same button (e.g. React StrictMode's dev-mode double-invoke of this
   * effect) leaves both instances' click handlers attached at once. Clicking
   * then opens two independent iframe sessions, and whichever one the user
   * actually completes may not be the instance this effect's closures point
   * to — so the real callback silently never fires. `instanceRef` makes sure
   * only one `BlockpassKYCConnect` is ever constructed per `confirmedRefId`,
   * so the effect's second StrictMode invocation is a no-op.
   */
  const blockpassInstanceRef = useRef(null);

  useEffect(() => {
    if (!showPopup || !confirmedRefId || !window.BlockpassKYCConnect) return undefined;
    if (blockpassInstanceRef.current?.refId === confirmedRefId) return undefined;

    const blockpass = new window.BlockpassKYCConnect('truefraction_12597', {
      refId: confirmedRefId,
      // Pre-fills the applicant email field in the widget so it defaults to
      // what the user typed here, rather than silently falling back to
      // whichever Blockpass account happens to be logged in in this
      // browser. The user can still switch accounts inside the widget —
      // Blockpass doesn't let a merchant force a specific identity — but
      // this at least makes the default match what they entered.
      email: confirmedRefId,
      elementId: 'blockpass-kyc-connect-button',
      mainColor: '800080',
    });
    blockpassInstanceRef.current = { refId: confirmedRefId, blockpass };

    const handleSuccess = async () => {
      setIsSubmitting(true);
      try {
        // Blockpass's own webhook would normally call /blockpass-webhook
        // once its review completes, but that requires a paid plan we're
        // not on — so the frontend triggers the same on-chain identity
        // flow directly once the widget itself reports success. addNewUser
        // must run first: the webhook handler looks the user up by refId
        // and does nothing if that row doesn't exist yet.
        await propertyApi.addNewUser({
          refId: confirmedRefId,
          userWalletAddress: currentSigner,
          kycActive: false,
        });
        toast.info('Verifying your identity on-chain — this can take a moment…');
        await propertyApi.triggerKycWebhook(confirmedRefId);
        await checkKyc();
        toast.success('Identity verified successfully!');
        setShowPopup(false);
      } catch (err) {
        console.error('Error completing KYC registration:', err);
        toast.error('Verified with Blockpass, but on-chain registration failed. Please contact support.');
      } finally {
        setIsSubmitting(false);
      }
    };
    const handleCancelled = () => setIsSubmitting(false);

    // 'KYCConnectCancel', not '...Cancelled' — matches the SDK's own event name.
    blockpass.on('KYCConnectSuccess', handleSuccess);
    blockpass.on('KYCConnectCancel', handleCancelled);
    blockpass.startKYCConnect();

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup, confirmedRefId, currentSigner]);

  // Widget instance is tied to one dialog session — drop it once the dialog
  // closes so reopening starts clean instead of reusing a stale instance.
  useEffect(() => {
    if (!showPopup) blockpassInstanceRef.current = null;
  }, [showPopup]);

  const fetchDetails = async () => {
    try {
      const data = await propertyApi.getPropertyById(id);
      if (data && data.property) {
        setProperty(data.property);
      }

      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const checkListing = await marketplaceContract.listings(id);
      const listingData = {
        shareToken: checkListing.propertyToken,
        totalShares: formatShares(checkListing.totalTokens),
        pricePerToken: formatStable(checkListing.pricePerToken),
        remainingTokens: formatShares(checkListing.remainingTokens),
        buyBackPrice: formatStable(checkListing.buyBackPrice),
        buyBack: checkListing.buyBack,
      };
      setContractListingData(listingData);
    } catch (err) {
      console.error('Error fetching property details:', err);
    }
  };

  /**
   * Connected wallet's USDC and share-token balances for this property, so
   * the buy/sell cards can show what the user actually holds rather than
   * making them check a wallet extension separately.
   */
  const fetchWalletBalances = async (shareTokenAddress) => {
    if (!currentSigner) {
      setUsdcBalance(null);
      setShareBalance(null);
      return;
    }
    try {
      const provider = web3Service.getReadOnlyProvider();
      const stableCoinContract = new ethers.Contract(
        contractsConfig.stableCoin.address,
        contractsConfig.stableCoin.abi,
        provider,
      );
      const usdc = await stableCoinContract.balanceOf(currentSigner);
      setUsdcBalance(formatStable(usdc));
    } catch (err) {
      console.error('Error fetching USDC balance:', err);
    }

    if (!shareTokenAddress || shareTokenAddress === ethers.constants.AddressZero) {
      setShareBalance(null);
      return;
    }
    try {
      const provider = web3Service.getReadOnlyProvider();
      const shareTokenContract = new ethers.Contract(shareTokenAddress, contractsConfig.shareToken.abi, provider);
      const shares = await shareTokenContract.balanceOf(currentSigner);
      setShareBalance(formatShares(shares));
    } catch (err) {
      console.error('Error fetching share token balance:', err);
    }
  };

  /**
   * Reads the marketplace's current sale fee rate once, so both the live
   * "Estimated total" preview and the actual purchase approval agree on the
   * same number without re-hitting the chain on every render or keystroke.
   */
  const fetchSaleFeeRate = async () => {
    try {
      const provider = web3Service.getReadOnlyProvider();
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const feeManager = new ethers.Contract(
        await marketplace.feeManager(),
        contractsConfig.feeManager.abi,
        provider,
      );

      const version = await feeManager.currentFeeVersion();
      const [config, denominator] = await Promise.all([
        feeManager.getFeeConfig(version),
        feeManager.BPS_DENOMINATOR(),
      ]);
      setSaleFeeRate({ bps: config.saleFeeBps, denominator });
    } catch (err) {
      console.error('Could not read sale fee rate, falling back to a safe upper bound:', err);
      setSaleFeeRate({ bps: FEE_FALLBACK_BPS, denominator: 10000 });
    }
  };

  /**
   * Sale fee the marketplace will pull from the buyer on top of the price,
   * as an on-chain BigNumber. Used to size the approval so the fee transfer
   * never reverts for coming up short.
   */
  const estimateSaleFee = (totalPrice) => {
    if (!saleFeeRate) {
      return totalPrice.mul(FEE_FALLBACK_BPS).div(10000);
    }
    return totalPrice.mul(saleFeeRate.bps).div(saleFeeRate.denominator);
  };

  const buyPropertyTokens = async () => {
    if (!buyTokensAmount || Number(buyTokensAmount) <= 0) {
      toast.error('Please enter the number of tokens to buy.');
      return;
    }
    try {
      const tokensToBuy = parseShares(buyTokensAmount);

      // The marketplace pulls the sale price *and* the sale fee from the
      // buyer, so the allowance has to cover both — approving only the
      // token amount leaves the fee transfer to revert.
      const marketplaceRead = web3Service.getReadOnlyMarketplaceContract();
      const listing = await marketplaceRead.listings(id);
      const totalPrice = sharesTimesPrice(tokensToBuy, listing.pricePerToken);
      const feeAllowance = estimateSaleFee(totalPrice);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(
        contractsConfig.marketplace.address,
        totalPrice.add(feeAllowance),
      );
      await approveTx.wait();

      const marketplaceContract = await web3Service.getMarketplaceContract();
      const buyTx = await marketplaceContract.buyTokens(id, tokensToBuy);
      await buyTx.wait();
      toast.success('Tokens purchased successfully!');
      setBuyTokensAmount('');
      fetchDetails();
      fetchWalletBalances(contractListingData.shareToken);
    } catch (error) {
      console.error('Error buying property tokens:', error);
      toast.error(getContractErrorMessage(error));
    }
  };

  const fetchOrders = async () => {
    try {
      const marketplaceContract = web3Service.getReadOnlyMarketplaceContract();
      const checkListing = await marketplaceContract.listings(id);
      const addressCheck = checkListing.propertyToken;

      const orderBookContract = web3Service.getReadOnlyOrderBookContract();
      const nextOrderId = await orderBookContract.nextOrderId();
      const fetchedOrders = [];

      for (let i = 0; i < nextOrderId; i++) {
        const order = await orderBookContract.orders(i);
        if (order.active && order.token === addressCheck) {
          fetchedOrders.push({
            id: order.id.toString(),
            token: order.token,
            seller: order.seller,
            amount: formatShares(order.amount),
            pricePerToken: formatStable(order.pricePerToken),
          });
        }
      }
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const buyFromLimit = async (orderId, buyAmount) => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast.error('Enter the quantity you want to buy.');
      return;
    }
    try {
      const formBuyAmount = parseShares(buyAmount);

      // fillOrder takes a share count, but the allowance it spends is
      // stablecoin — approve the cost of those shares, not the share count.
      const orderBookRead = web3Service.getReadOnlyOrderBookContract();
      const order = await orderBookRead.orders(orderId);
      const cost = sharesTimesPrice(formBuyAmount, order.pricePerToken);

      const stableCoinContract = await web3Service.getStableCoinContract();
      const approveTx = await stableCoinContract.approve(contractsConfig.orderBook.address, cost);
      await approveTx.wait();

      const orderBookContract = await web3Service.getOrderBookContract();
      const fillTx = await orderBookContract.fillOrder(orderId, formBuyAmount);
      await fillTx.wait();

      toast.success('Order filled successfully!');
      fetchOrders();
      fetchWalletBalances(contractListingData.shareToken);
    } catch (error) {
      console.error('Error buying from limit order:', error);
      toast.error(getContractErrorMessage(error));
    }
  };

  const createLimitOrder = async () => {
    if (!orderSellAmount || Number(orderSellAmount) <= 0 || !opricePerToken || Number(opricePerToken) <= 0) {
      toast.error('Enter a valid amount and price per token.');
      return;
    }
    try {
      const formBuyAmount = parseShares(orderSellAmount);
      const formOrderTokenAmount = parseStable(opricePerToken);

      const propertyTokenContract = await web3Service.getShareTokenContract(contractListingData.shareToken);

      const approveTx = await propertyTokenContract.approve(contractsConfig.orderBook.address, formBuyAmount);
      await approveTx.wait();

      const orderBookContract = await web3Service.getOrderBookContract();
      const createTx = await orderBookContract.createOrder(
        contractListingData.shareToken,
        formBuyAmount,
        formOrderTokenAmount,
      );
      await createTx.wait();

      toast.success('Sell order created successfully!');
      setOrderSellAmount('');
      setPricePerToken('');
      fetchOrders();
      fetchWalletBalances(contractListingData.shareToken);
    } catch (error) {
      console.error('Error creating limit order:', error);
      toast.error(getContractErrorMessage(error));
    }
  };

  const cancelLimitOrder = async (orderId) => {
    try {
      const orderBookContract = await web3Service.getOrderBookContract();
      const cancelTx = await orderBookContract.cancelOrder(orderId);
      await cancelTx.wait();

      toast.success('Order cancelled successfully!');
      fetchOrders();
      fetchWalletBalances(contractListingData.shareToken);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(getContractErrorMessage(error, 'Failed to cancel order. Please try again.'));
    }
  };

  const sellBackTokensContract = async () => {
    if (!sellingTokens || Number(sellingTokens) <= 0) {
      toast.error('Enter the number of tokens to sell back.');
      return;
    }
    try {
      const convertTokens = parseShares(sellingTokens);

      // sellTokensBack now burns the caller's shares directly via the
      // marketplace's agent role on the Token contract (Token.burn), rather
      // than pulling them in with transferFrom — no ERC-20 approval needed.
      const marketplaceContract = await web3Service.getMarketplaceContract();
      const sellTx = await marketplaceContract.sellTokensBack(id, convertTokens);
      await sellTx.wait();

      setSellingTokens('');
      fetchDetails();
      fetchWalletBalances(contractListingData.shareToken);
      toast.success('Tokens sold back successfully!');
    } catch (error) {
      console.error('Error selling back tokens:', error);
      toast.error(getContractErrorMessage(error, 'Failed to sell back tokens. Please try again.'));
    }
  };

  const handleBuyAmountChange = (orderId, value) => {
    setBuyAmounts((prev) => ({ ...prev, [orderId]: value }));
  };

  useEffect(() => {
    const scriptId = 'blockpass-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://cdn.blockpass.org/widget/scripts/release/3.0.2/blockpass-kyc-connect.prod.js';
      script.id = scriptId;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    fetchDetails();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fee rate is a marketplace-wide setting, not per-property — fetch once.
  useEffect(() => {
    fetchSaleFeeRate();
  }, []);

  useEffect(() => {
    fetchWalletBalances(contractListingData.shareToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSigner, contractListingData.shareToken]);

  const checkKyc = async () => {
    if (!currentSigner) {
      setKycStatus(false);
      return;
    }
    try {
      const provider = web3Service.getProvider();
      const identityRegistryCheck = new ethers.Contract(
        contractsConfig.identityRegistry.address,
        contractsConfig.identityRegistry.abi,
        provider,
      );
      const kycCheck = await identityRegistryCheck.isVerified(currentSigner);
      setKycStatus(kycCheck);
    } catch (kycErr) {
      console.error('KYC check error:', kycErr);
    }
  };

  useEffect(() => {
    checkKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSigner]);

  const isOwner = useMemo(
    () => property?.propertyOwnerWallet?.toLowerCase() === currentSigner.toLowerCase(),
    [property, currentSigner],
  );

  if (!property) {
    return (
      <Layout>
        <Spinner words={['details', 'images', 'pricing', 'listings']} />
      </Layout>
    );
  }

  const listing = contractListingData;
  const soldPct = toPercent(Number(listing.totalShares || 0) - Number(listing.remainingTokens || 0), listing.totalShares);
  const pricePerToken = Number(listing.pricePerToken);
  const buyBackPrice = Number(listing.buyBackPrice);
  const quickBuySubtotal =
    buyTokensAmount && Number(buyTokensAmount) > 0 && pricePerToken > 0
      ? Number(buyTokensAmount) * pricePerToken
      : null;
  // Mirrors estimateSaleFee's on-chain math (subtotal * bps / denominator)
  // in plain numbers, so the buyer sees the fee before signing anything.
  const quickBuyFee =
    quickBuySubtotal !== null && saleFeeRate
      ? (quickBuySubtotal * Number(saleFeeRate.bps)) / Number(saleFeeRate.denominator)
      : null;
  const quickBuyCost = quickBuySubtotal !== null ? quickBuySubtotal + (quickBuyFee || 0) : null;
  const quickSellValue =
    sellingTokens && Number(sellingTokens) > 0 && buyBackPrice > 0
      ? Number(sellingTokens) * buyBackPrice
      : null;

  const KycGate = ({ children }) =>
    kycStatus ? (
      children
    ) : (
      <Button variant="secondary" fullWidth onClick={handleCompleteKYCClick}>
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Complete KYC to continue
        </span>
      </Button>
    );

  const quickAmounts = [1, 10, 100, 500];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-start gap-3 sm:gap-4">
        <BackButton onClick={() => navigate(-1)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              {property.propertyName}
            </h1>
            {listing.buyBack ? (
              <Badge tone="danger" dot>
                Buyback active
              </Badge>
            ) : (
              <Badge tone="success" dot>
                Live listing
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            {property.locationDetailes && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {property.locationDetailes}
              </span>
            )}
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">Property ID #{property.propertyId}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <StatusBanner buyBack={listing.buyBack} buyBackPrice={listing.buyBackPrice} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* ---------------- LEFT COLUMN ---------------- */}
        <div className="space-y-6 lg:col-span-2">
          <Gallery images={property.propertyImages} />

          {/* Key facts */}
          <Card className="p-5 sm:p-6">
            <SectionLabel>Property overview</SectionLabel>
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
              <FactItem icon="id" label="Property ID" value={`#${property.propertyId}`} />
              <FactItem icon="size" label="Property size" value={property.propertySize ? `${formatNumber(property.propertySize)} sqft` : '—'} />
              <FactItem icon="price" label="Underlying asset value" value={formatUsd(property.propertyPrice, 0)} />
              <FactItem
                icon="perToken"
                label="Price per token"
                value={listing.pricePerToken ? formatUsd(listing.pricePerToken) : '—'}
              />
              {listing.buyBack && (
                <FactItem icon="price" label="Buyback price" value={formatUsd(listing.buyBackPrice)} />
              )}
              <FactItem
                icon="total"
                label="Total token supply"
                value={listing.totalShares ? formatNumber(listing.totalShares) : '—'}
              />
              <FactItem
                icon="remaining"
                label="Available on marketplace"
                value={
                  listing.remainingTokens !== undefined
                    ? `${formatNumber(listing.remainingTokens)} tokens`
                    : '—'
                }
              />
              <FactItem icon="location" label="Location" value={property.locationDetailes || '—'} />
              {property.propertyFeatures && (
                <FactItem icon="features" label="Features" value={property.propertyFeatures} className="sm:col-span-2" />
              )}
              {listing.shareToken && (
                <FactItem
                  icon="token"
                  label="Share token address"
                  value={shortenAddress(listing.shareToken)}
                  mono
                  copyValue={listing.shareToken}
                  className="sm:col-span-2"
                />
              )}
            </div>
          </Card>

          {/* Story / docs */}
          {(property.offringDetailes || property.propertyDetailes || property.propertyManagement) && (
            <Card className="p-5 sm:p-6">
              <SectionLabel>About this asset</SectionLabel>
              <div className="space-y-3">
                {property.offringDetailes && (
                  <Accordion
                    title="Offering details"
                    defaultOpen
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                    }
                  >
                    {property.offringDetailes}
                  </Accordion>
                )}
                {property.propertyDetailes && (
                  <Accordion
                    title="Property details"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    }
                  >
                    {property.propertyDetailes}
                  </Accordion>
                )}
                {property.propertyManagement && (
                  <Accordion
                    title="Management details"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    }
                  >
                    {property.propertyManagement}
                  </Accordion>
                )}
              </div>
            </Card>
          )}

          {property.propertyDocuments && (
            <a
              href={property.propertyDocuments}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-3.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/60 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  {FACT_ICONS.doc}
                </svg>
              </span>
              <span className="flex-1 text-left">View offering documents</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>

        {/* ---------------- RIGHT RAIL ---------------- */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {listing.buyBack && isOwner ? (
            <Card className="overflow-hidden border-amber-200/70 p-0 dark:border-amber-900/50">
              <div className="items-center justify-between gap-3 border-b border-amber-200/70 bg-amber-50/70 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <Badge tone="warning" dot className="shrink-0">
                  Owner view
                </Badge>
              </div>

              <div className="p-5">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Buyback price / token
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {formatUsd(listing.buyBackPrice)}
                </p>

                <p className="mt-3 mb-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {formatNumber(listing.remainingTokens)} tokens still eligible for buyback. Holders can sell back at
                  this price until the claim window closes.
                </p>

                <Button fullWidth variant="secondary" onClick={() => navigate(ROUTES.withdrawBuyBack)}>
                  Manage escrow &amp; withdraw
                </Button>
              </div>
            </Card>
          ) : listing.buyBack ? (
            <Card className="overflow-hidden border-emerald-200/70 p-0 dark:border-emerald-900/50">
              <div className="items-center justify-between gap-3 border-b border-emerald-200/70 bg-emerald-50/70 px-5 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <SectionLabel>Sell back to treasury</SectionLabel>

              </div>

              <div className="p-5">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Buyback price / token
                </p>
                <p className="mt-1 text-2xl mb-3 font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {formatUsd(listing.buyBackPrice)}
                </p>
 
                {currentSigner && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                    <span className="text-slate-500 dark:text-slate-400">Your balances</span>
                    <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {shareBalance !== null ? formatNumber(shareBalance) : '—'} tokens ·{' '}
                      {usdcBalance !== null ? formatUsd(usdcBalance) : '—'} USDC
                    </span>
                  </div>
                )}

                {shareBalance > 0 ? (
                  <>
                    <Input
                      type="number"
                      min="0"
                      value={sellingTokens}
                      onChange={(e) => setSellingTokens(e.target.value)}
                      placeholder="Number of tokens"
                      label="Tokens to sell"
                      className="mb-2"
                    />
                    {quickSellValue !== null && (
                      <p className="mb-4 rounded-lg bg-indigo-50/70 px-3 py-2 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        You will receive ≈ <strong>{formatUsd(quickSellValue)}</strong> stablecoin.
                      </p>
                    )}
                    <KycGate>
                      <Button fullWidth onClick={sellBackTokensContract}>
                        Sell tokens back
                      </Button>
                    </KycGate>
                  </>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                    {currentSigner
                      ? "You don't hold any tokens for this property, so there's nothing to sell back."
                      : 'Connect your wallet to sell tokens back.'}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white dark:from-indigo-500 dark:to-violet-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-white/70 uppercase">Buy tokens</p>
                    <p className="mt-1 text-[26px] leading-none font-bold tracking-tight tabular-nums">
                      {formatUsd(listing.pricePerToken)}
                    </p>
                    <p className="mt-1 text-xs text-white/70">per token</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.552-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659L14.5 8.5" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Available</span>
                  <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                    {formatNumber(listing.remainingTokens)} / {formatNumber(listing.totalShares)} tokens
                  </span>
                </div>
                <Progress value={soldPct} className="mb-5" showLabel />
                <p className="-mt-3 mb-4 text-right text-[11px] text-slate-400 dark:text-slate-500">
                  {formatNumber(soldPct, 0)}% of supply purchased
                </p>

                {currentSigner && (
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                    <span className="text-slate-500 dark:text-slate-400">Your balances</span>
                    <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {usdcBalance !== null ? formatUsd(usdcBalance) : '—'} USDC ·{' '}
                      {shareBalance !== null ? formatNumber(shareBalance) : '—'} tokens
                    </span>
                  </div>
                )}

                <Input
                  type="number"
                  min="0"
                  value={buyTokensAmount}
                  onChange={(e) => setBuyTokensAmount(e.target.value)}
                  placeholder="e.g. 50"
                  label="Tokens to buy"
                  className="mb-2"
                />

                <div className="mb-4 flex items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-medium text-slate-400">Quick:</span>
                  {quickAmounts.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBuyTokensAmount(String(n))}
                      className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {quickBuyCost !== null && (
                  <div className="mb-4 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                      <span className="font-medium text-slate-700 tabular-nums dark:text-slate-200">
                        {formatUsd(quickBuySubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Marketplace fee
                        {saleFeeRate && (
                          <span className="ml-1 text-slate-400 dark:text-slate-500">
                            ({(Number(saleFeeRate.bps) / Number(saleFeeRate.denominator) * 100).toFixed(2)}%)
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-slate-700 tabular-nums dark:text-slate-200">
                        {quickBuyFee !== null ? formatUsd(quickBuyFee) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 dark:border-slate-800">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Estimated total</span>
                      <span className="font-bold text-slate-900 tabular-nums dark:text-white">
                        {formatUsd(quickBuyCost)}
                      </span>
                    </div>
                  </div>
                )}

                <KycGate>
                  <Button fullWidth size="lg" onClick={buyPropertyTokens}>
                    Purchase tokens
                  </Button>
                </KycGate>
              </div>
            </Card>
          )}

          {/* Limit orders */}
          <Card className="p-5">
            <SectionLabel>Order book</SectionLabel>
            {orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                No open sell orders right now
              </div>
            ) : (
              <div className="tf-scroll max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {orders.map((order) => {
                  const mine = order.seller.toLowerCase() === currentSigner.toLowerCase();
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-indigo-600 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-700">
                            {order.seller.slice(2, 4).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                              {shortenAddress(order.seller)}
                              {mine && <span className="ml-1.5 font-sans font-semibold text-indigo-500">you</span>}
                            </p>
                            <p className="font-semibold text-slate-800 tabular-nums dark:text-slate-100">
                              {formatNumber(order.amount)} tokens @ {formatUsd(order.pricePerToken)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          #{order.id}
                        </span>
                      </div>

                      {mine ? (
                        <Button variant="outlineDanger" size="sm" fullWidth onClick={() => cancelLimitOrder(order.id)}>
                          Cancel my order
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={buyAmounts[order.id] || ''}
                            onChange={(e) => handleBuyAmountChange(order.id, e.target.value)}
                            placeholder="Qty"
                            className="h-8 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          {kycStatus ? (
                            <Button size="sm" className="shrink-0" onClick={() => buyFromLimit(order.id, buyAmounts[order.id])}>
                              Buy
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" className="shrink-0" onClick={handleCompleteKYCClick}>
                              KYC
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Create sell order */}
          {!isOwner && !listing.buyBack && (
            <Card className="p-5">
              <SectionLabel>Create sell order</SectionLabel>
              <p className="-mt-2 mb-4 text-sm text-slate-500 dark:text-slate-400">
                List tokens you hold on the public order book at your own price.
              </p>
              <div className="space-y-3">
                <Input
                  label="Amount to sell"
                  type="number"
                  min="0"
                  value={orderSellAmount}
                  onChange={(e) => setOrderSellAmount(e.target.value)}
                  placeholder="e.g. 100"
                />
                <Input
                  label="Price per token (USDC)"
                  type="number"
                  min="0"
                  value={opricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                  placeholder="e.g. 42.50"
                />
                <KycGate>
                  <Button fullWidth onClick={createLimitOrder}>
                    Place sell order
                  </Button>
                </KycGate>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* KYC dialog */}
      <Dialog
        open={showPopup}
        onClose={() => setShowPopup(false)}
        title="Verify your identity"
        description="KYC is required to buy and sell tokens. Enter the reference you used (e.g. your email) and continue with Blockpass."
      >
        <Input
          type="email"
          label="Reference ID (email)"
          placeholder="you@example.com"
          value={refId}
          onChange={(e) => {
            setRefId(e.target.value);
            setConfirmedRefId('');
          }}
          disabled={Boolean(confirmedRefId)}
        />
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setShowPopup(false)}>
            Cancel
          </Button>
          {confirmedRefId ? (
            <Button id="blockpass-kyc-connect-button" className="flex-1" loading={isSubmitting}>
              Continue with Blockpass
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleConfirmRefId}>
              Continue
            </Button>
          )}
        </div>
      </Dialog>
    </Layout>
  );
};

export default PropertyDetailPage;
