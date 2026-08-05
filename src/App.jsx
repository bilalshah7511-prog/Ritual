import { useEffect, useMemo, useRef, useState } from 'react';
import CardBrandLogo, { cardBrandLabel, detectCardBrand } from './components/CardBrandLogo';
import CheckoutLoader from './components/CheckoutLoader';
import SheetFeedback from './components/SheetFeedback';
import StatusOverlay from './components/StatusOverlay';
import {
  brand,
  pickupLocations,
  product,
  shippingOptions,
  timeSlots,
  usStates,
} from './data/product';
import { useSafariDrawerLock, useSafariSheetLock } from './useSafariCheckoutViewport';
import './base.css';
import './index.css';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayLabel = i === 0 ? 'Today' : dayNames[d.getDay()];
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    return { dayLabel, dateLabel, key: `${dayLabel}-${dateLabel}` };
  });
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imageSwitching, setImageSwitching] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [openAccordion, setOpenAccordion] = useState('how-to-use');
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const sizeSelectRef = useRef(null);
  const [colorId, setColorId] = useState(product.colors[0].id);

  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [inCart, setInCart] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [verifyMode, setVerifyMode] = useState('guest');
  const [email, setEmail] = useState('');

  const [shippingValue, setShippingValue] = useState('');
  const [shippingStatus, setShippingStatus] = useState('Click to select shipping option');
  const [deliveryStatus, setDeliveryStatus] = useState('Click to add delivery details');
  const [paymentStatus, setPaymentStatus] = useState('Click to add payment method');
  const [completion, setCompletion] = useState({
    shipping: false,
    delivery: false,
    payment: false,
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState(null); // 'check' | 'error' | null
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [savedCardBrand, setSavedCardBrand] = useState(null);

  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [pickupChosen, setPickupChosen] = useState(null);
  const [showPickupTimes, setShowPickupTimes] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
  const [pdpImage, setPdpImage] = useState(0);
  const [pdpDescOpen, setPdpDescOpen] = useState(false);
  const [draftSizeId, setDraftSizeId] = useState(product.sizes[0].id);
  const [draftColorId, setDraftColorId] = useState(product.colors[0].id);
  const [draftQty, setDraftQty] = useState(1);
  const [cardNumber, setCardNumber] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState(null); // { code, type, value }
  const [promoError, setPromoError] = useState('');
  const dates = useMemo(() => buildDates(), []);
  const pdpTrackRef = useRef(null);
  const cartDrawerRef = useRef(null);
  const checkoutFlowRef = useRef(null);
  const checkoutBackdropRef = useRef(null);

  const selectedSize = product.sizes.find((s) => s.id === sizeId) || product.sizes[0];
  const selectedColor = product.colors.find((c) => c.id === colorId) || product.colors[0];
  const productImages = selectedColor.images?.length ? selectedColor.images : product.images;
  const unitPrice = selectedSize.price;
  const lineTotal = unitPrice * qty;
  const cartCount = inCart ? qty : 0;
  const freeShippingThresholdMet = lineTotal >= brand.freeShippingThreshold;
  const selectedShippingCost = shippingValue
    ? Number.parseFloat(shippingValue.match(/\$([\d.]+)/)?.[1] || '0') || 0
    : 0;
  const promoDiscount =
    promo?.type === 'percent'
      ? Math.round(lineTotal * (promo.value / 100) * 100) / 100
      : promo?.type === 'flat'
        ? Math.min(lineTotal, promo.value)
        : 0;
  const shippingWaived = freeShippingThresholdMet || promo?.type === 'shipping';
  const shippingCost = shippingWaived ? 0 : selectedShippingCost;
  const subtotalAfterPromo = Math.max(0, lineTotal - promoDiscount);
  const estimatedTax = inCart ? Math.round(subtotalAfterPromo * 0.1035 * 100) / 100 : 0;
  const estimatedTotal = Math.max(0, subtotalAfterPromo + shippingCost + estimatedTax);
  const freeShipping = shippingWaived;
  const checkoutReady = completion.shipping && completion.delivery && completion.payment;
  const stepsDone =
    (completion.shipping ? 1 : 0) + (completion.delivery ? 1 : 0) + (completion.payment ? 1 : 0);
  const checkoutProgress = stepsDone === 0 ? 0 : stepsDone === 1 ? 33 : stepsDone === 2 ? 67 : 100;
  const cardBrand = detectCardBrand(cardNumber);

  const draftSize = product.sizes.find((s) => s.id === draftSizeId) || product.sizes[0];
  const draftColor = product.colors.find((c) => c.id === draftColorId) || product.colors[0];
  const draftImages = draftColor.images?.length ? draftColor.images : product.images;
  const draftUnitPrice = draftSize.price;

  useEffect(() => {
    if (!sizeMenuOpen) return undefined;
    function onPointerDown(e) {
      if (sizeSelectRef.current && !sizeSelectRef.current.contains(e.target)) {
        setSizeMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setSizeMenuOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [sizeMenuOpen]);

  function selectColor(nextId) {
    if (nextId === colorId) return;
    setColorId(nextId);
    setActiveImage(0);
    setImageSwitching(true);
    setTimeout(() => setImageSwitching(false), 200);
  }

  useEffect(() => {
    if (activeImage >= productImages.length) setActiveImage(0);
  }, [productImages.length, activeImage]);

  function selectDraftColor(nextId) {
    if (nextId === draftColorId) return;
    setDraftColorId(nextId);
    setPdpImage(0);
    requestAnimationFrame(() => {
      if (pdpTrackRef.current) pdpTrackRef.current.scrollLeft = 0;
    });
  }

  useEffect(() => {
    document.body.style.overflow = cartOpen || menuOpen || checkoutLoading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen, menuOpen, checkoutLoading]);

  useSafariDrawerLock(cartDrawerRef, cartOpen || checkoutLoading);
  useSafariSheetLock(checkoutFlowRef, checkoutBackdropRef, cartDrawerRef, sheet);

  useEffect(() => {
    if (!selectedDate && dates[0]) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);

  function switchImage(index) {
    if (index === activeImage) return;
    setImageSwitching(true);
    setTimeout(() => {
      setActiveImage(index);
      setImageSwitching(false);
    }, 200);
  }

  function openCart(e) {
    e?.preventDefault();
    setCartOpen(true);
    if (!isVerified) {
      setTimeout(() => setSheet('verify'), 300);
    }
  }

  function closeCart() {
    setCartOpen(false);
    setSheet(null);
  }

  function openSheet(name) {
    setSheet(name);
  }

  function openPdpSheet() {
    setDraftSizeId(sizeId);
    setDraftColorId(colorId);
    setDraftQty(qty);
    setPdpImage(0);
    setPdpDescOpen(false);
    openSheet('pdp');
    requestAnimationFrame(() => {
      if (pdpTrackRef.current) pdpTrackRef.current.scrollLeft = 0;
    });
  }

  function updateCartFromPdp() {
    setSizeId(draftSizeId);
    setColorId(draftColorId);
    setQty(Math.max(1, draftQty));
    setInCart(true);
    setSheet(null);
  }

  function closeSheet() {
    if (sheet === 'verify' && !isVerified) return;
    setSheet(null);
  }

  function playSheetFeedback(type) {
    setSheetFeedback(type);
  }

  function markComplete(key) {
    setCompletion((prev) => ({ ...prev, [key]: true }));
  }

  function addToCart() {
    setInCart(true);
    setQty((q) => Math.max(q, 1));
    openCart();
  }

  function verifyContinue() {
    setIsVerified(true);
    setSheet(null);
    if (pendingCheckout) {
      setPendingCheckout(false);
      setTimeout(() => setCheckoutLoading(true), 280);
    }
  }

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const catalog = {
      RITUAL10: { type: 'percent', value: 10 },
      SAVE20: { type: 'flat', value: 20 },
      FREESHIP: { type: 'shipping', value: 0 },
    };
    const match = catalog[code];
    if (!match) {
      setPromoError('Invalid code');
      setPromo(null);
      setTimeout(() => setPromoError(''), 2000);
      return;
    }
    setPromo({ code, ...match });
    setPromoCode('');
    setPromoError('');
  }

  function removePromo() {
    setPromo(null);
    setPromoError('');
  }

  function confirmShipping() {
    if (!shippingValue) {
      playSheetFeedback('error');
      return;
    }
    setShippingStatus(shippingValue);
    markComplete('shipping');
    setSheetFeedback(null);
    setSheet(null);
  }

  function confirmDelivery() {
    if (deliveryMode === 'pickup') {
      if (!pickupChosen) {
        playSheetFeedback('error');
        return;
      }
      const dateLabel = selectedDate
        ? `${selectedDate.dayLabel} ${selectedDate.dateLabel}`
        : '';
      const addr = pickupChosen.address || '';
      // Title line + address on next line (like Reformation summary)
      setDeliveryStatus(
        `${pickupChosen.name} · ${dateLabel}, ${selectedTime}${addr ? `\n${addr}` : ''}`,
      );
    } else {
      setDeliveryStatus('Ship to doorstep');
    }
    markComplete('delivery');
    setSheetFeedback(null);
    setSheet(null);
  }

  function savePayment(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const digits = String(cardNumber || '').replace(/\D/g, '');
    const nameOk = String(cardName || '').trim().length > 0;
    const expiryOk = String(cardExpiry || '').replace(/\s/g, '').length >= 4;
    const cvvOk = String(cardCvv || '').replace(/\D/g, '').length >= 3;
    if (digits.length < 12 || !nameOk || !expiryOk || !cvvOk) {
      playSheetFeedback('error');
      return;
    }
    const last4 = digits.slice(-4) || '****';
    const brandKey = detectCardBrand(digits) || 'card';
    setPaymentStatus(`${cardBrandLabel(brandKey)} •••• ${last4}`);
    setSavedCardBrand(brandKey);
    markComplete('payment');
    setSheetFeedback(null);
    setSheet(null);
  }

  function finalCheckout() {
    if (!checkoutReady || !inCart) return;
    if (!isVerified) {
      setPendingCheckout(true);
      openSheet('verify');
      return;
    }
    setCheckoutLoading(true);
  }

  function finishCheckoutLoader() {
    setSheet(null);
    requestAnimationFrame(() => {
      setCartOpen(false);
    });

    window.setTimeout(() => {
      setCheckoutLoading(false);
      setInCart(false);
      setQty(1);
      setCompletion({ shipping: false, delivery: false, payment: false });
      setShippingStatus('Click to select shipping option');
      setDeliveryStatus('Click to add delivery details');
      setPaymentStatus('Click to add payment method');
      setSavedCardBrand(null);
      setShippingValue('');
      setPickupChosen(null);
      setShowPickupTimes(false);
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
      setIsVerified(false);
      setPendingCheckout(false);
      setSuccessOpen(false);
    }, 620);
  }

  const tabContent = {
    description: (
      <>
        <p className="body-text">{product.description}</p>
        <p className="body-text">{product.serving}</p>
      </>
    ),
    benefits: (
      <ul className="benefits-list">
        {product.benefits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    ),
    ingredients: <p className="body-text">{product.ingredients}</p>,
    'how-to-use': <p className="body-text">{product.howToUse}</p>,
  };

  return (
    <>
      <div className="announcement-bar">
        <a href="#" className="announcement-bar__link">
          Free shipping on orders ${brand.freeShippingThreshold}+
        </a>
      </div>

      <header className="site-header">
        <div className="site-header__row">
          <div className="header-left">
            <button
              className={`hamburger${menuOpen ? ' is-active' : ''}`}
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg className="hamburger__icon hamburger__icon--open" width="22" height="16" viewBox="0 0 22 16" fill="none">
                <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <svg className="hamburger__icon hamburger__icon--close" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <line x1="1" y1="1" x2="17" y2="17" stroke="currentColor" strokeWidth="1.6" />
                <line x1="17" y1="1" x2="1" y2="17" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>

          <nav className="site-nav site-nav--left">
            <ul>
              <li><a href="#">face</a></li>
              <li><a href="#">lips</a></li>
              <li><a href="#">sets</a></li>
            </ul>
          </nav>

          <a href="#" className="site-logo" aria-label="Ritual">
            <img src={brand.logoSrc} alt="Ritual" />
          </a>

          <nav className="site-nav site-nav--right">
            <ul>
              <li><a href="#">blog</a></li>
              <li>
                <button type="button" className="search-toggle" onClick={() => setSearchOpen((v) => !v)}>
                  search
                </button>
              </li>
              <li><a href="#">log in</a></li>
              <li>
                <a href="#" className="cart-link" onClick={openCart}>
                  cart({cartCount})
                </a>
              </li>
            </ul>
          </nav>

          <div className="mobile-icons">
            <button type="button" className="header-icon search-toggle" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5L21 21" strokeLinecap="round" />
              </svg>
            </button>
            <a href="#" className="header-icon" aria-label="Account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9.25" />
                <circle cx="12" cy="10" r="3.25" />
                <path d="M6.5 18.2c1.4-2.2 3.3-3.2 5.5-3.2s4.1 1 5.5 3.2" strokeLinecap="round" />
              </svg>
            </a>
            <a href="#" className="header-icon cart-link" onClick={openCart} aria-label={`Cart ${cartCount}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
                <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
              </svg>
              {cartCount > 0 && <span className="header-icon__badge">{cartCount}</span>}
            </a>
          </div>
        </div>

        <div className={`search-bar${searchOpen ? ' is-open' : ''}`}>
          <span className="search-bar__label">i&apos;m looking for</span>
          <input type="text" className="search-bar__input" placeholder="Search" />
          <button type="button" className="search-bar__close" onClick={() => setSearchOpen(false)} aria-label="Close search">
            &times;
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu-overlay${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
        <div className="mobile-menu__body">
          <h3 className="mobile-menu__heading">Shop</h3>
          <nav className="mobile-menu__nav">
            <a href="#" className="mobile-menu__nav-main">face</a>
            <a href="#" className="mobile-menu__nav-main">lips</a>
            <a href="#" className="mobile-menu__nav-main">sets</a>
          </nav>
        </div>
      </div>

      <div
        className={`cart-overlay${cartOpen || checkoutLoading ? ' is-open' : ''}`}
        onClick={checkoutLoading ? undefined : closeCart}
      />
      <div
        ref={cartDrawerRef}
        className={`cart-drawer${cartOpen ? ' is-open' : ''}${checkoutLoading ? ' is-checkout' : ''}${!cartOpen && checkoutLoading ? ' is-closing' : ''}`}
      >
        <CheckoutLoader
          open={checkoutLoading}
          brandLabel={brand.name}
          logoSrc={brand.logoSrcLight}
          onDone={finishCheckoutLoader}
        />

        <div className="cart-drawer__progress cart-drawer__progress--top">
          <div
            className="cart-drawer__progress-bar"
            style={{ width: `${inCart ? checkoutProgress : 0}%` }}
          />
        </div>

        <div className="cart-drawer__header">
          <span className="cart-drawer__header-spacer" aria-hidden="true" />
          <div className="cart-drawer__logo">
            <img src={brand.logoSrc} alt={brand.name} />
          </div>
          <button type="button" className="cart-drawer__close" onClick={closeCart} aria-label="Close">
            &times;
          </button>
        </div>

        <p className="cart-drawer__shipping-msg">
          {freeShipping || !inCart ? (
            <>You&apos;ve unlocked <strong>FREE SHIPPING!</strong></>
          ) : (
            <>Add ${(brand.freeShippingThreshold - lineTotal).toFixed(2)} more for free shipping</>
          )}
        </p>

        <div className="cart-drawer__body">
          {inCart ? (
            <div className="cart-item cart-item--pdp">
              <button type="button" className="cart-item__media" onClick={openPdpSheet}>
                <img
                  className="cart-item__img"
                  src={productImages[0].src}
                  alt={`${product.title} in ${selectedColor.label}`}
                />
              </button>
              <div className="cart-item__info">
                <div className="cart-item__top">
                  <button type="button" className="cart-item__title-btn" onClick={openPdpSheet}>
                    <p className="cart-item__title">{product.title}</p>
                  </button>
                  <span className="cart-item__price">${unitPrice.toFixed(2)}</span>
                </div>

                <div className="cart-item__controls">
                  <div className="cart-control">
                    {qty <= 1 ? (
                      <button
                        type="button"
                        className="cart-control__icon-btn"
                        aria-label="Remove item"
                        onClick={() => {
                          setInCart(false);
                          setQty(1);
                        }}
                      >
                        <svg width="14" height="16" viewBox="0 0 16 18" fill="none">
                          <path d="M1 4h14M6 1h4M3 4l1 13h8l1-13M6.5 7.5v6M9.5 7.5v6" stroke="#111111" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="cart-control__icon-btn"
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        −
                      </button>
                    )}
                    <span className="cart-control__value">{qty}</span>
                    <button
                      type="button"
                      className="cart-control__icon-btn"
                      aria-label="Increase quantity"
                      onClick={() => setQty((q) => Math.min(10, q + 1))}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-control cart-control--chip cart-control--color"
                    onClick={openPdpSheet}
                    aria-label={`Color ${selectedColor.label}`}
                    title={selectedColor.label}
                  >
                    <span
                      className="cart-control__swatch"
                      style={{ background: selectedColor.hex }}
                      aria-hidden="true"
                    />
                    <span className="cart-control__label">{selectedColor.label}</span>
                    <span className="cart-control__chevron" aria-hidden="true">▾</span>
                  </button>

                  <button
                    type="button"
                    className="cart-control cart-control--chip"
                    onClick={openPdpSheet}
                  >
                    {selectedSize.label}
                    <span className="cart-control__chevron" aria-hidden="true">▾</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="body-text" style={{ paddingTop: 8 }}>Your cart is empty.</p>
          )}
        </div>

        <div className="cart-drawer__footer">
          <div className="cart-drawer__footer-steps">
            {[
              { key: 'shipping', title: 'Shipping', status: shippingStatus },
              { key: 'delivery', title: 'Delivery', status: deliveryStatus },
              { key: 'payment', title: 'Payment', status: paymentStatus },
            ].map((row) => (
              <div
                key={row.key}
                className={`checkout-row${completion[row.key] ? ' is-complete' : ''}${row.key === 'payment' && completion.payment ? ' checkout-row--payment' : ''}`}
                onClick={() => openSheet(row.key)}
              >
                <div className="checkout-row__main">
                  <p className="checkout-row__title">{row.title}</p>
                  <p
                    className={`checkout-row__status${row.key === 'payment' ? ' checkout-row__status--payment' : ''}`}
                  >
                    {row.key === 'payment' && completion.payment && (
                      <CardBrandLogo
                        brand={savedCardBrand || detectCardBrand(cardNumber) || 'card'}
                        className="card-brand-logo--inline"
                      />
                    )}
                    <span className="checkout-row__status-text">{row.status}</span>
                  </p>
                </div>
                <span className="checkout-row__chevron" aria-hidden="true">
                  <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                    <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned outside footer so iPad/tablet never clips the CTA */}
        <div className="cart-drawer__checkout-panel">
          <button
            type="button"
            className="checkout-row checkout-row--total"
            onClick={() => openSheet('total')}
          >
            <p className="checkout-row__title">Est Total</p>
            <span className="checkout-row__total-price">
              ${inCart ? estimatedTotal.toFixed(2) : '0.00'}
            </span>
            <span className="checkout-row__chevron" aria-hidden="true">
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          <button
            type="button"
            className="cart-drawer__checkout"
            disabled={!checkoutReady || !inCart}
            onClick={finalCheckout}
          >
            Checkout
          </button>
        </div>

        <div
          ref={checkoutBackdropRef}
          className={`checkout-flow-backdrop${sheet ? ' is-visible' : ''}`}
          onClick={closeSheet}
        />
        <div ref={checkoutFlowRef} className={`checkout-flow${sheet ? ' is-open' : ''}${sheet ? ` checkout-flow--${sheet}` : ''}`}>
          <SheetFeedback
            type={sheetFeedback}
            onDone={() => setSheetFeedback(null)}
          />

          {/* Estimated Total breakdown */}
          <div className={`checkout-sheet checkout-sheet--total${sheet === 'total' ? ' is-active' : ''}`}>
            <h3 className="total-sheet__title">Estimated Total</h3>

            <div className="total-sheet__rows">
              <div className="total-sheet__row">
                <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                <span>${inCart ? lineTotal.toFixed(2) : '0.00'}</span>
              </div>
              <div className="total-sheet__row total-sheet__row--muted">
                <span>Shipping</span>
                <span className={`total-sheet__value${shippingCost === 0 ? ' is-free' : ''}`}>
                  {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="total-sheet__row">
                <span>Estimated taxes</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              {promo && (
                <div className="total-sheet__row total-sheet__row--promo">
                  <span className="total-sheet__discount-label">
                    Discount
                    <button
                      type="button"
                      className="total-sheet__promo-chip"
                      aria-label="Remove promo code"
                      onClick={removePromo}
                    >
                      {promo.code} ×
                    </button>
                  </span>
                  <span>
                    {promo.type === 'shipping'
                      ? 'Free shipping'
                      : `−$${promoDiscount.toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>

            {!promo && (
              <div className="total-sheet__promo">
                <input
                  type="text"
                  className="total-sheet__promo-input"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyPromo();
                  }}
                />
                <button
                  type="button"
                  className="total-sheet__promo-apply"
                  disabled={!promoCode.trim()}
                  onClick={applyPromo}
                >
                  Apply
                </button>
              </div>
            )}
            {promoError && <p className="total-sheet__promo-error">{promoError}</p>}

            <div className="total-sheet__divider" />

            <div className="total-sheet__row total-sheet__row--final">
              <span>Estimated total</span>
              <span>${inCart ? estimatedTotal.toFixed(2) : '0.00'}</span>
            </div>

            <button
              type="button"
              className="total-sheet__close"
              onClick={() => setSheet(null)}
            >
              Close
            </button>
          </div>

          {/* In-cart PDP editor */}
          <div className={`checkout-sheet checkout-sheet--pdp${sheet === 'pdp' ? ' is-active' : ''}`}>
            <div className="pdp-sheet__gallery">
              <div
                className="pdp-sheet__track"
                ref={pdpTrackRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const i = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
                  if (i !== pdpImage) setPdpImage(Math.max(0, Math.min(draftImages.length - 1, i)));
                }}
              >
                {draftImages.map((img) => (
                  <img
                    key={img.src}
                    className="pdp-sheet__image"
                    src={img.src}
                    alt={img.alt || product.title}
                  />
                ))}
              </div>
              <div className="pdp-sheet__dots">
                {draftImages.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    className={`pdp-sheet__dot${pdpImage === i ? ' is-active' : ''}`}
                    aria-label={`Image ${i + 1}`}
                    onClick={() => {
                      setPdpImage(i);
                      const track = pdpTrackRef.current;
                      if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="pdp-sheet__body">
              <button
                type="button"
                className={`pdp-sheet__row${pdpDescOpen ? ' is-open' : ''}`}
                onClick={() => setPdpDescOpen((v) => !v)}
              >
                <div className="pdp-sheet__row-head">
                  <span>Description</span>
                  <span className="pdp-sheet__chevron">{pdpDescOpen ? '▴' : '›'}</span>
                </div>
                {!pdpDescOpen && (
                  <p className="pdp-sheet__row-preview">
                    {product.description.length > 60
                      ? `${product.description.slice(0, 60)}…`
                      : product.description}
                  </p>
                )}
              </button>
              {pdpDescOpen && (
                <div className="pdp-sheet__row-content">
                  <p>{product.description}</p>
                  <p>{product.serving}</p>
                </div>
              )}

              <div className="pdp-sheet__section">
                <p className="color-label">Edition: {draftColor.label}</p>
                <div className="color-swatch-row">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`color-swatch${draftColorId === c.id ? ' is-active' : ''}`}
                      style={{ background: c.hex }}
                      aria-label={c.label}
                      title={c.label}
                      onClick={() => selectDraftColor(c.id)}
                    >
                      {draftColorId === c.id && (
                        <svg className="color-swatch__check" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                          <path d="M3 8.5l3.2 3.2L13 4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pdp-sheet__section">
                <div className="pdp-sheet__row-head">
                  <span>Size</span>
                </div>
                <div className="pdp-sheet__options">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`pdp-option${draftSizeId === s.id ? ' is-active' : ''}`}
                      onClick={() => setDraftSizeId(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pdp-sheet__section pdp-sheet__section--aa">
                <span className="pdp-sheet__aa-label">Quantity</span>
                <div className="pdp-qty">
                  <button
                    type="button"
                    onClick={() => setDraftQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{draftQty}</span>
                  <button
                    type="button"
                    onClick={() => setDraftQty((q) => Math.min(10, q + 1))}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pdp-sheet__section pdp-sheet__section--aa">
                <span className="pdp-sheet__aa-label">Price</span>
                <span className="pdp-sheet__aa-value">
                  ${(draftUnitPrice * draftQty).toFixed(2)}
                </span>
              </div>
            </div>

            <button type="button" className="pdp-sheet__cta" onClick={updateCartFromPdp}>
              Update in cart
            </button>
          </div>

          {/* Verify */}
          <div className={`checkout-sheet checkout-sheet--pinned${sheet === 'verify' ? ' is-active' : ''}`}>
            <div className="checkout-sheet__scroll">
              <div className="checkout-sheet__brand-wrap">
                <img src={brand.logoSrc} alt={brand.name} className="checkout-sheet__brand-logo" />
              </div>
              <div className="verify-tabs">
                <button
                  type="button"
                  className={`verify-tab${verifyMode === 'guest' ? ' is-active' : ''}`}
                  onClick={() => setVerifyMode('guest')}
                >
                  Guest
                </button>
                <button
                  type="button"
                  className={`verify-tab${verifyMode === 'member' ? ' is-active' : ''}`}
                  onClick={() => setVerifyMode('member')}
                >
                  Member
                </button>
              </div>
              <label className="checkout-label">Email Address</label>
              <input
                type="email"
                className="checkout-input"
                placeholder="info@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {verifyMode === 'guest' ? (
              <button type="button" className="checkout-cta" onClick={verifyContinue}>
                Continue as Guest
              </button>
            ) : (
              <button type="button" className="checkout-cta" onClick={verifyContinue}>
                Send Verification Code
              </button>
            )}
          </div>

          {/* Shipping */}
          <div className={`checkout-sheet checkout-sheet--pinned${sheet === 'shipping' ? ' is-active' : ''}`}>
            <div className="checkout-sheet__top">
              <div>
                <h3 className="checkout-sheet__title">Shipping Options</h3>
                <p className="checkout-sheet__subtitle">Select your preferred shipping plan</p>
              </div>
              <button type="button" className="checkout-sheet__close" onClick={() => setSheet(null)}>
                &times;
              </button>
            </div>
            <div className="checkout-sheet__scroll">
              <div className="option-card-list">
                {shippingOptions.map((opt) => (
                  <label className="option-card" key={opt.value}>
                    <input
                      type="radio"
                      name="shipping-option"
                      value={opt.value}
                      checked={shippingValue === opt.value}
                      onChange={() => setShippingValue(opt.value)}
                    />
                    <span className="option-card__radio" />
                    <span className="option-card__info">
                      <span className="option-card__title">{opt.title}</span>
                      <span className="option-card__subtitle">{opt.subtitle}</span>
                    </span>
                    <span className="option-card__price">{opt.price}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="checkout-cta"
              onClick={confirmShipping}
            >
              Confirm Shipping
            </button>
          </div>

          {/* Delivery */}
          <div className={`checkout-sheet checkout-sheet--pinned${sheet === 'delivery' ? ' is-active' : ''}`}>
            <div className="checkout-sheet__top">
              <div>
                <h3 className="checkout-sheet__title">Delivery Options</h3>
                <p className="checkout-sheet__subtitle">How would you like to receive your order?</p>
              </div>
              <button type="button" className="checkout-sheet__close" onClick={() => setSheet(null)}>
                &times;
              </button>
            </div>
            <div className="toggle-pair">
              <button
                type="button"
                className={`toggle-pair__btn${deliveryMode === 'pickup' ? ' is-active' : ''}`}
                onClick={() => setDeliveryMode('pickup')}
              >
                Pickup<span>Free</span>
              </button>
              <button
                type="button"
                className={`toggle-pair__btn${deliveryMode === 'doorstep' ? ' is-active' : ''}`}
                onClick={() => setDeliveryMode('doorstep')}
              >
                Doorstep<span>Free</span>
              </button>
            </div>
            <div className="checkout-sheet__scroll">
              {deliveryMode === 'pickup' ? (
                <div className="delivery-panel">
                  {!showPickupTimes ? (
                    <div className="pickup-location-list">
                      {pickupLocations.map((loc) => (
                        <div
                          key={loc.name}
                          className="pickup-location"
                          onClick={() => {
                            setPickupChosen(loc);
                            setShowPickupTimes(true);
                          }}
                        >
                          <div>
                            <p className="pickup-location__title">{loc.name}</p>
                            <p className="pickup-location__address">{loc.address}</p>
                          </div>
                          <span className="pickup-location__dist">{loc.dist}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pickup-datetime">
                      <div className="pickup-datetime__header">
                        <div>
                          <p className="pickup-location__title">{pickupChosen?.name}</p>
                          <p className="pickup-location__address">{pickupChosen?.address}</p>
                        </div>
                        <button
                          type="button"
                          className="pickup-datetime__edit"
                          onClick={() => {
                            setShowPickupTimes(false);
                            setPickupChosen(null);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="date-scroller">
                        {dates.map((d) => (
                          <div
                            key={d.key}
                            className={`date-pill${selectedDate?.key === d.key ? ' is-active' : ''}`}
                            onClick={() => setSelectedDate(d)}
                          >
                            <span className="date-pill__day">{d.dayLabel}</span>
                            <span className="date-pill__date">{d.dateLabel}</span>
                          </div>
                        ))}
                      </div>
                      <div className="time-slot-list">
                        {timeSlots.map((slot) => (
                          <label
                            className={`time-slot${selectedTime === slot ? ' is-selected' : ''}`}
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                          >
                            <input
                              type="radio"
                              name="pickup-time"
                              value={slot}
                              checked={selectedTime === slot}
                              onChange={() => setSelectedTime(slot)}
                            />
                            <span className="option-card__radio" aria-hidden="true" />
                            <span className="time-slot__label">{slot}</span>
                            <span className="time-slot__price">$9.95</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="delivery-panel">
                  <label className="checkout-label">Full Name</label>
                  <input type="text" className="checkout-input" placeholder="John Doe" />
                  <label className="checkout-label">Country or region</label>
                  <select className="checkout-input checkout-select" defaultValue="">
                    <option value="" disabled>Select country</option>
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                  </select>
                  <label className="checkout-label">Address Line 1</label>
                  <input type="text" className="checkout-input" placeholder="123 Maison Blvd" />
                  <label className="checkout-label">Address Line 2</label>
                  <input type="text" className="checkout-input" placeholder="Apartment, suite, etc (optional)" />
                  <label className="checkout-label">City</label>
                  <input type="text" className="checkout-input" placeholder="Enter city" />
                  <div className="checkout-input-row">
                    <div>
                      <label className="checkout-label">State</label>
                      <select className="checkout-input checkout-select" defaultValue="">
                        <option value="" disabled>Select state</option>
                        {usStates.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="checkout-label">Zip Code</label>
                      <input type="text" className="checkout-input" placeholder="10012" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="checkout-cta"
              onClick={confirmDelivery}
            >
              {deliveryMode === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
            </button>
          </div>

          {/* Payment */}
          <div className={`checkout-sheet checkout-sheet--pinned${sheet === 'payment' ? ' is-active' : ''}`}>
            <div className="checkout-sheet__top">
              <div>
                <h3 className="checkout-sheet__title">Payment</h3>
                <p className="checkout-sheet__subtitle">Add your card details to continue</p>
              </div>
              <button type="button" className="checkout-sheet__close" onClick={() => setSheet(null)}>
                &times;
              </button>
            </div>
            <div className="checkout-sheet__scroll">
              <label className="checkout-label">Card number</label>
              <div className="checkout-input-wrap">
                <input
                  type="text"
                  className="checkout-input checkout-input--card"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                    const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                    setCardNumber(grouped);
                  }}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <CardBrandLogo brand={cardBrand} className="card-brand-logo--field" />
              </div>
              <label className="checkout-label">Cardholder name</label>
              <input
                type="text"
                className="checkout-input"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
              <div className="checkout-input-row">
                <div>
                  <label className="checkout-label">Expiry</label>
                  <input
                    type="text"
                    className="checkout-input"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCardExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </div>
                <div>
                  <label className="checkout-label">CVV</label>
                  <input
                    type="text"
                    className="checkout-input"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="checkout-cta"
              onPointerDown={(e) => {
                if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                  e.preventDefault();
                  savePayment(e);
                }
              }}
              onClick={savePayment}
            >
              Save Payment Method
            </button>
          </div>
        </div>
      </div>

      <section className="product-section">
        <div className="product-gallery" key={colorId}>
          <div className="product-thumbs">
            {productImages.map((img, i) => (
              <button
                key={`${colorId}-${i}-${img.src}`}
                type="button"
                className={`product-thumb${activeImage === i ? ' is-active' : ''}`}
                onClick={() => switchImage(i)}
              >
                <img className="product-thumb__img" src={img.src} alt={img.alt} />
              </button>
            ))}
          </div>
          <div className="product-main-image">
            {productImages[activeImage]?.showBadge && (
              <span className="badge">{product.badge}</span>
            )}
            <img
              key={`${colorId}-${activeImage}`}
              className={`product-main-image__img${imageSwitching ? ' is-switching' : ''}`}
              src={productImages[activeImage].src}
              alt={productImages[activeImage].alt}
            />
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-title">{product.title}</h1>
          <div className="product-rating">
            <span className="product-rating__stars">{'★'.repeat(product.rating)}</span>
            <span className="product-rating__count">({product.reviewCount})</span>
          </div>
          <p className="product-subtitle">{product.subtitle}</p>

          <div className="size-select" ref={sizeSelectRef}>
            <label id="sizeSelectLabel" className="size-select__label">
              select your supply
            </label>
            <div className={`size-select__wrap${sizeMenuOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="size-select__input"
                aria-haspopup="listbox"
                aria-expanded={sizeMenuOpen}
                aria-labelledby="sizeSelectLabel"
                onClick={() => setSizeMenuOpen((o) => !o)}
              >
                <span className="size-select__value">{selectedSize.label}</span>
              </button>
              {sizeMenuOpen && (
                <ul className="size-select__menu" role="listbox" aria-labelledby="sizeSelectLabel">
                  {product.sizes.map((s) => (
                    <li key={s.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={sizeId === s.id}
                        className={`size-select__option${sizeId === s.id ? ' is-selected' : ''}`}
                        onClick={() => {
                          setSizeId(s.id);
                          setSizeMenuOpen(false);
                        }}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="purchase-options">
            <p className="color-label">Edition: {selectedColor.label}</p>
            <div className="color-swatch-row">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`color-swatch${colorId === c.id ? ' is-active' : ''}`}
                  style={{ background: c.hex }}
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => selectColor(c.id)}
                >
                  {colorId === c.id && (
                    <svg className="color-swatch__check" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                      <path d="M3 8.5l3.2 3.2L13 4.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="add-to-cart-btn" onClick={addToCart}>
            Add to Cart
          </button>

          <div className="product-tabs">
            <div className="product-tabs__nav">
              {['description', 'benefits', 'ingredients', 'how-to-use'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-btn${activeTab === tab ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            <div className="product-tabs__panels">
              {Object.entries(tabContent).map(([key, content]) => (
                <div
                  key={key}
                  className={`tab-panel${activeTab === key ? ' is-active is-visible' : ''}`}
                >
                  {content}
                </div>
              ))}
            </div>
          </div>

          <div className="product-accordion">
            {Object.entries(tabContent).map(([key, content]) => (
              <div key={key} className={`accordion-item${openAccordion === key ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="accordion-item__header"
                  onClick={() => setOpenAccordion((prev) => (prev === key ? null : key))}
                >
                  {key.replace(/-/g, ' ')}{' '}
                  <span className="accordion-item__icon">
                    {openAccordion === key ? '−' : '+'}
                  </span>
                </button>
                <div className="accordion-item__panel">{content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatusOverlay
        open={successOpen}
        type="check"
        title="Order placed"
        text="Your Ritual order is on the way."
        onDone={() => {
          setSuccessOpen(false);
          closeCart();
          setCompletion({ shipping: false, delivery: false, payment: false });
          setShippingStatus('Click to select shipping option');
          setDeliveryStatus('Click to add delivery details');
          setPaymentStatus('Click to add payment method');
          setSavedCardBrand(null);
          setShippingValue('');
          setPickupChosen(null);
          setShowPickupTimes(false);
          setCardNumber('');
          setCardName('');
          setCardExpiry('');
          setCardCvv('');
        }}
      />
    </>
  );
}
