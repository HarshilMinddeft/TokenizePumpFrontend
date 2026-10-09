import { formatMoney } from './format';

/*
 * "How is this calculated" copy for the rent tables — a formula per column
 * (shown on the header "?") and the worked calculation for one row (shown
 * when hovering a value). Mirrors the backend model in
 * FractionalRWABackend/src/modules/rent/calculator.js and RentDist.md.
 */

const DAY = 86_400;

const num = (n, max = 2) => Number(n).toLocaleString('en-US', { maximumFractionDigits: max });

const Formula = ({ children }) => (
  <span className="mt-1.5 block rounded-md bg-slate-800 px-2 py-1 font-mono text-[11px] text-indigo-200 dark:bg-slate-900">
    {children}
  </span>
);

const Title = ({ children }) => <span className="block font-semibold text-white">{children}</span>;

// ── Column formulas ───────────────────────────────────────────────────────────

export const FIELD_INFO = {
  balances: (
    <>
      <Title>Shares at the start → end of the period</Title>
      Beneficial shares: shares in an open sell order, or unsold in a marketplace listing, still count for their owner.
    </>
  ),
  daysHeld: (
    <>
      <Title>Days held</Title>
      Time this wallet held at least one share during the period, measured to the second (a 15:00 purchase counts from
      15:00).
    </>
  ),
  averageHeld: (
    <>
      <Title>Average shares while held</Title>
      How many shares the wallet typically held, counting only the days it held any.
      <Formula>share-days ÷ days held</Formula>
    </>
  ),
  averagePeriod: (
    <>
      <Title>Average shares over the period</Title>
      Averaged over every day in the period, including days before the wallet bought — so it reads low for a
      mid-month buyer.
      <Formula>share-days ÷ days in the period</Formula>
    </>
  ),
  share: (
    <>
      <Title>Share of the month’s rent</Title>
      Every share earns the same rent for each day it is held, so a holder’s slice is their share-days out of all the
      share-days the month could have. Days with no holder (before launch, burned shares) aren’t paid out.
      <Formula>share-days ÷ (total shares × days in month)</Formula>
    </>
  ),
  gross: (
    <>
      <Title>Gross rent</Title>
      The holder’s slice of the rent, before the platform fee.
      <Formula>rent × share</Formula>
    </>
  ),
  fee: (
    <>
      <Title>Platform fee</Title>
      The FeeManager’s saleServicerFeeBps, taken only on what is paid out and split in proportion to gross (to the
      unit, so fees + payouts add up exactly).
      <Formula>gross × fee %</Formula>
    </>
  ),
  net: (
    <>
      <Title>Paid to the holder</Title>
      <Formula>gross − fee</Formula>
    </>
  ),
  batch: (
    <>
      <Title>Batch</Title>
      Which payout transaction pays this holder. Each batch pays up to 500 holders at once and can only execute once.
    </>
  ),
  sharePlainly: (
    <>
      <Title>Share-days</Title>
      Shares × days held, added up across every change in balance. 100 shares for 3 days = 300 share-days.
    </>
  ),
};

export const SUMMARY_INFO = {
  youSend: (
    <>
      <Title>You send</Title>
      Total that leaves your wallet: the holders’ payouts plus the platform fee.
      <Formula>holders receive + platform fee</Formula>
    </>
  ),
  holdersReceive: (
    <>
      <Title>Holders receive</Title>
      Sum of every payable holder’s amount after the fee.
      <Formula>Σ (gross − fee)</Formula>
    </>
  ),
  fee: (
    <>
      <Title>Platform fee</Title>
      FeeManager saleServicerFeeBps applied to what is paid out (not to the full rent), sent to the treasury in the
      same transaction.
      <Formula>Σ payable gross × fee %</Formula>
    </>
  ),
  selfKept: (
    <>
      <Title>Kept in your wallet</Title>
      Your own wallet’s share, if it holds shares. It isn’t transferred — sending money to yourself only costs gas.
    </>
  ),
  excludedIssuer: (
    <>
      <Title>Issuer excluded</Title>
      The issuer’s share when “exclude issuer” is on. Other holders’ amounts don’t change.
    </>
  ),
  unallocated: (
    <>
      <Title>Not allocated</Title>
      Rent for time when no one held a share — before the asset was fractionalized, after shares were burned, or
      (testnet only) the part of the month that hasn’t happened yet — plus rounding dust. It stays with you.
      <Formula>rent − you send − kept − issuer excluded</Formula>
    </>
  ),
};

// ── Worked calculation for one row ────────────────────────────────────────────

/**
 * @param {object} row  allocation / payout (tokenSeconds, heldSeconds, sharePercent, grossAmount, feeAmount, netAmount)
 * @param {object} ctx  { rent, totalShares, feeBps, periodStart, periodEnd, monthEnd, decimals }
 */
export const explainRow = (row, ctx) => {
  const decimals = ctx.decimals ?? 6;
  const money = (v) => formatMoney(v, decimals);
  const shareDays = Number(row.tokenSeconds ?? 0) / DAY;
  const daysHeld = Number(row.heldSeconds ?? 0) / DAY;
  const start = new Date(ctx.periodStart).getTime() / 1000;
  const periodDays = (new Date(ctx.periodEnd).getTime() / 1000 - start) / DAY;
  const monthDays = Math.round((new Date(ctx.monthEnd).getTime() / 1000 - start) / DAY);
  const avgHeld = averageHeld(row);

  return {
    daysHeld: (
      <>
        <Title>{num(daysHeld)} days held</Title>
        {num(row.heldSeconds, 0)} seconds with a balance above 0 ÷ 86,400
      </>
    ),
    averageHeld: (
      <>
        <Title>≈ {num(avgHeld)} shares while held</Title>
        <Formula>
          {num(shareDays)} share-days ÷ {num(daysHeld)} days held
        </Formula>
      </>
    ),
    averagePeriod: (
      <>
        <Title>≈ {num(row.averageBalance)} shares over the period</Title>
        <Formula>
          {num(shareDays)} share-days ÷ {num(periodDays)} days in the period
        </Formula>
      </>
    ),
    share: (
      <>
        <Title>{Number(row.sharePercent).toFixed(4)}% of the month’s rent</Title>
        <Formula>
          {num(shareDays)} share-days ÷ ({num(ctx.totalShares, 0)} shares × {monthDays} days)
        </Formula>
        <span className="mt-1.5 block text-slate-400">
          e.g. {num(avgHeld)} shares × {num(daysHeld)} days = {num(shareDays)} share-days
        </span>
      </>
    ),
    gross: (
      <>
        <Title>{money(row.grossAmount)} gross</Title>
        <Formula>
          {money(ctx.rent)} rent × {Number(row.sharePercent).toFixed(4)}%
        </Formula>
      </>
    ),
    fee: (
      <>
        <Title>{money(row.feeAmount)} fee</Title>
        <Formula>
          {money(row.grossAmount)} × {(Number(ctx.feeBps ?? 0) / 100).toFixed(2)}%
        </Formula>
        {Number(ctx.feeBps ?? 0) > 0 && (
          <span className="mt-1.5 block text-slate-400">Rounded to the smallest unit so all fees and payouts sum exactly.</span>
        )}
      </>
    ),
    net: (
      <>
        <Title>{money(row.netAmount)} paid</Title>
        <Formula>
          {money(row.grossAmount)} − {money(row.feeAmount)}
        </Formula>
      </>
    ),
  };
};

/** tokenSeconds / heldSeconds — stored as averageHeldBalance on newer drafts. */
export const averageHeld = (row) => {
  if (row.averageHeldBalance) return Number(row.averageHeldBalance);
  const held = Number(row.heldSeconds ?? 0);
  return held > 0 ? Number(row.tokenSeconds ?? 0) / held : 0;
};
