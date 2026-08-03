export const brand = {
  name: 'Ritual',
  logoSrc: '/ritual-logo.svg',
  logoSrcLight: '/ritual-logo-white.svg',
  freeShippingThreshold: 40,
  tagline: 'The future of essentials',
};

const heroImages = [
  {
    src: '/images/ritual/PDP_EFW18_Bottle.jpg',
    alt: 'Essential for Women 18+ bottle',
    showBadge: true,
  },
  {
    src: '/images/ritual/PDP-EFW18-Pills.jpg',
    alt: 'Essential for Women 18+ capsules',
  },
  {
    src: '/images/ritual/PDP_EFW_Model_Bottle.jpg',
    alt: 'Essential for Women 18+ lifestyle',
  },
  {
    src: '/images/ritual/PDP_EFW_Model_Pill.jpg',
    alt: 'Essential for Women 18+ delayed-release capsule',
  },
  {
    src: '/images/ritual/PDP-EFW-Pill-Mint.png',
    alt: 'Essential for Women 18+ mint-scented capsule',
  },
  {
    src: '/images/ritual/BDP-How-EFW.jpg',
    alt: 'How to take Essential for Women 18+',
  },
];

export const product = {
  title: 'Essential for Women 18+',
  subtitle: 'Multivitamin · Traceable essentials',
  badge: 'Best Seller',
  rating: 5,
  reviewCount: 12840,
  description:
    'A clinically-backed multivitamin with 9 key nutrients in two delayed-release capsules. Made Traceable™ ingredients, vegan, and non-GMO.',
  serving: 'Take 2 capsules daily with or without food.',
  images: heroImages,
  colors: [
    {
      id: 'classic',
      label: 'Classic',
      hex: '#142B6F',
      images: heroImages,
    },
  ],
  sizes: [
    { id: '1mo', label: '1 month supply', price: 33.0 },
    { id: 'sub', label: 'Subscribe · $26.40/mo', price: 26.4 },
  ],
  frequencies: [],
  benefits: [
    '9 key nutrients in two daily capsules',
    'Delayed-release, mint-scented design',
    'Made Traceable™ visible supply chain',
    'Vegan & non-GMO',
    'Clean Label Project Certified',
  ],
  ingredients:
    'Folate, Omega-3 DHA & EPA, Vitamin B12, Vitamin D3, Iron, Vitamin K2, Boron, Vitamin E, Magnesium. See ritual.com for full details.',
  howToUse: 'Take two capsules daily with or without food. Best with a consistent morning or evening ritual.',
};

export const shippingOptions = [
  { value: 'Ground - $5.99', title: 'Ground', subtitle: '5-7 business days', price: '$5.99' },
  { value: 'Express - $12.99', title: 'Express', subtitle: '2-3 business days', price: '$12.99' },
  { value: 'Overnight - $24.99', title: 'Overnight', subtitle: 'Next business day', price: '$24.99' },
];

export const pickupLocations = [
  { name: 'Los Angeles Hub', address: '8600 Melrose Ave, West Hollywood, CA 90069', dist: '0.3 mi' },
  { name: 'NYC Pickup', address: '200 Broadway, New York, NY 10007', dist: '0.5 mi' },
  { name: 'Seattle Locker', address: '500 Pine St, Seattle, WA 98101', dist: '0.7 mi' },
];

export const timeSlots = ['9am-10am', '10am-11am', '11am-12pm', '1pm-2pm', '2pm-3pm'];

export const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];
