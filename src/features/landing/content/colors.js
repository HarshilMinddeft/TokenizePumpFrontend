// Stream color constants shared by EN/AR content and the choreography hook.
// Ported verbatim from `VARELO Tokenized Station.dc.html`'s DCLogic script block.
export const A = '#e8d3a6';
export const B = '#ffb44a';
export const C = '#5ccf8e';
export const OFF = 'rgba(255,255,255,.14)';

// meter(n) returns a 3-slot indicator used by the streams list: filled slots
// (this stream's color) up to n, OFF for the rest.
export const meter = (n) => [0, 1, 2].map((i) => (i < n ? null : OFF));
