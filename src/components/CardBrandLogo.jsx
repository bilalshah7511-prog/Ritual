const brands = {
  visa: (
    <svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path
        fill="#fff"
        d="M20.2 21.2h-2.6l1.6-10.4h2.6l-1.6 10.4zm11.1-10.1l-1.3 7.4-.5-2.5-1.6-4.9h-2.7l2.7 7.8c.2.6.1 1.2-.4 1.6-.3.2-.6.3-1 .3h-.5l-.3 2.1c.5.1 1 .2 1.4.2 1.3 0 2.1-.6 2.6-1.9l3.1-10.1h-2.5zm7.3 0h-2.4c-.6 0-1 .2-1.2.8l-3.5 9.6h2.6l.5-1.4h3.2l.3 1.4h2.3l-2-10.4zm-3.1 6.7l1.3-3.6.1-.3.7 3.9h-2.1zM17.1 10.8l-2.5 10.4H12l.3-1.5c-.9 1.1-2.3 1.8-3.8 1.8l.5-2.4c1 0 1.9-.4 2.5-1.1l1.3-7.2h4.3z"
      />
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path d="M24 9.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z" fill="#FF5F00" />
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#2E77BC" />
      <path
        fill="#fff"
        d="M8.5 20.8h2.1l.6-1.4h2.7l.6 1.4h2.3l-2.9-6.8h-2.5l-2.9 6.8zm3.2-3.1l.9-2.1.9 2.1h-1.8zm9.2 3.1h4.8v-1.5h-2.6v-1.2h2.5v-1.4h-2.5v-1.1h2.6v-1.5h-4.8v6.7zm6.4 0h2.2l2.4-2.8 1.1 1.3v1.5h2.2v-6.8h-2.2v2.9l-2.9-2.9h-2.5l3.2 3.4-3.5 3.4z"
      />
    </svg>
  ),
  discover: (
    <svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" />
      <circle cx="34" cy="16" r="7" fill="#F76F00" />
      <path
        fill="#111"
        d="M7 20.5h1.8l1.7-4.4.6 1.6c.2.6.4 1.1.5 1.6H13l2.1-6.5H13l-1.2 4.1-.9-4.1H9.1L7 20.5zm9.2 0h1.9v-6.5h-1.9v6.5zm3.4 0h1.9v-5.1h2.3v-1.4h-4.2v6.5zm5.3 0h4.2v-1.4h-2.3v-1.2h2.1v-1.3h-2.1v-1.1h2.3v-1.4h-4.2v6.4z"
      />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#1a1a1a" />
      <rect x="0" y="8" width="48" height="6" fill="#c4a574" />
      <rect x="8" y="20" width="14" height="4" rx="1" fill="#fff" opacity="0.9" />
      <rect x="28" y="20" width="12" height="4" rx="1" fill="#fff" opacity="0.35" />
    </svg>
  ),
};

const LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  card: 'Card',
};

export function detectCardBrand(value) {
  const d = String(value || '').replace(/\D/g, '');
  if (!d) return null;
  // Visa: starts with 4
  if (/^4/.test(d)) return 'visa';
  // Mastercard: 51–55, 2221–2720, also common 50/56–59 test ranges
  if (/^(5[1-5]|2[2-7]|50|5[6-9])/.test(d)) return 'mastercard';
  // Amex: 34 or 37
  if (/^3[47]/.test(d)) return 'amex';
  // Discover
  if (/^(6011|65|64[4-9]|622)/.test(d)) return 'discover';
  // Diners / JCB-ish → treat as generic card chip so logo still shows
  if (/^(30|36|38|35)/.test(d)) return 'card';
  return 'card';
}

export function cardBrandLabel(brand) {
  return LABELS[brand] || 'Card';
}

export default function CardBrandLogo({ brand, className = '' }) {
  const key = brand && brands[brand] ? brand : brand ? 'card' : null;
  if (!key) return null;
  return <span className={`card-brand-logo ${className}`.trim()}>{brands[key]}</span>;
}
