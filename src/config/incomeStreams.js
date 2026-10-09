/**
 * Income streams a fuel pump can earn from. Mirrors the backend's list
 * (FractionalRWABackend/src/config/incomeStreams.js) — the backend is the
 * authority and rejects unknown keys, so keep the two in step.
 *
 * `group` follows the A / B / C structure on the landing page.
 */
export const STREAMS = [
  { key: 'LAND_RENT', label: 'Land rent', group: 'A', hint: 'Fixed lease paid by the fuel company' },
  { key: 'FUEL_INCOME', label: 'Fuel income', group: 'B', hint: 'Per-litre fee or turnover rent from fuel sales' },
  { key: 'CAR_WASH', label: 'Car wash', group: 'C', hint: 'Net profit of the car wash' },
  { key: 'SERVICE_CENTER', label: 'Service center', group: 'C', hint: 'Oil changes, lubricants and tyre service' },
  { key: 'ATM_TENANTS', label: 'ATMs & tenant services', group: 'C', hint: 'Bank and crypto ATMs and other tenants on site' },
  { key: 'STORE_MALL', label: 'Convenience store & mall', group: 'C', hint: '24/7 store, café and retail units' },
  { key: 'EV_CHARGING', label: 'EV charging', group: 'C', hint: 'EV fast-charging bays' },
];

export const STREAM_KEYS = STREAMS.map((s) => s.key);
export const STREAM_BY_KEY = Object.fromEntries(STREAMS.map((s) => [s.key, s]));

export const streamLabel = (key) => STREAM_BY_KEY[key]?.label ?? key;

/**
 * How the land under the pump reaches token holders.
 *  RENT          leased — land rent is an income stream.
 *  APPRECIATION  owned by the fuel owner — no land rent; holders benefit from
 *                the land's value rising (the asset price).
 */
export const LAND_MODELS = {
  RENT: {
    label: 'Land is leased',
    short: 'Leased land',
    hint: 'The fuel company pays land rent, which can be shared with token holders each month.',
  },
  APPRECIATION: {
    label: 'Land is owned by the fuel owner',
    short: 'Owner-held land',
    hint: 'No land rent. Token holders benefit from the land’s appreciation through the asset price.',
  },
};

/** Keys in catalogue order, de-duplicated. */
export const sortStreams = (keys) => {
  const set = new Set(keys);
  return STREAM_KEYS.filter((k) => set.has(k));
};

/**
 * Settings after the land model changes. Owner-held land has no rent to
 * share, so land rent is dropped; leased land shares it by default.
 */
export const withLandModel = ({ landModel, incomeStreams }, next) => {
  if (next === landModel) return { landModel, incomeStreams };
  const streams = new Set(incomeStreams);
  if (next === 'APPRECIATION') streams.delete('LAND_RENT');
  else streams.add('LAND_RENT');
  return { landModel: next, incomeStreams: sortStreams(streams) };
};

/** Settings after one stream is ticked or unticked. */
export const withToggledStream = ({ landModel, incomeStreams }, key) => {
  const streams = new Set(incomeStreams);
  if (streams.has(key)) streams.delete(key);
  else streams.add(key);
  return { landModel, incomeStreams: sortStreams(streams) };
};

/** Defaults for a new pump: leased land, land rent and fuel income shared. */
export const DEFAULT_STREAM_SETTINGS = {
  landModel: 'RENT',
  incomeStreams: ['LAND_RENT', 'FUEL_INCOME'],
};
