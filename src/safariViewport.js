/**
 * Safari (iPhone) checkout viewport helpers.
 * Keeps cart/login sheets aligned with Android, and freezes layout while
 * typing so the iOS keyboard doesn't shove the payment UI upward.
 */

export function isCompactViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;
}

export function isTypingInside(root) {
  if (!root) return false;
  const active = document.activeElement;
  if (!active || !root.contains(active)) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/i.test(active.tagName);
}

export function readVisualViewport() {
  const vv = window.visualViewport;
  const top = Math.round(vv?.offsetTop ?? 0);
  const height = Math.round(vv?.height ?? window.innerHeight);
  const bottomGap = Math.max(0, Math.round(window.innerHeight - top - height));
  return { top, height, bottomGap };
}

export function applyDrawerViewportLock(drawer, { top, height }) {
  if (!drawer) return;
  drawer.style.setProperty('top', `${top}px`, 'important');
  drawer.style.setProperty('bottom', 'auto', 'important');
  drawer.style.setProperty('height', `${height}px`, 'important');
  drawer.style.setProperty('max-height', `${height}px`, 'important');
  drawer.classList.add('cart-drawer--vv-lock');
}

export function clearDrawerViewportLock(drawer) {
  if (!drawer) return;
  ['top', 'bottom', 'height', 'max-height', 'transform'].forEach((prop) => {
    drawer.style.removeProperty(prop);
  });
  drawer.classList.remove('cart-drawer--vv-lock');
}

/**
 * @param {object} snap visual viewport snapshot
 * @param {{ containToDrawer?: boolean }} [options]
 *   containToDrawer: keep sheet width/left aligned to cart drawer
 *   (delivery) so Safari keyboard lock does not stretch full viewport.
 */
export function applySheetViewportLock(flow, backdrop, drawer, snap, options = {}) {
  if (!flow) return;
  // Delivery must stay absolute inside the cart drawer (desktop multi-click bug)
  if (
    flow.classList.contains('checkout-flow--verify') ||
    flow.classList.contains('checkout-flow--payment') ||
    flow.classList.contains('checkout-flow--shipping') ||
    flow.classList.contains('checkout-flow--delivery') ||
    flow.classList.contains('checkout-flow--pdp') ||
    flow.classList.contains('checkout-flow--total')
  ) {
    pinDeliveryInDrawer(flow, backdrop);
    return;
  }
  const { top, height, bottomGap } = snap;
  const maxH = Math.round(Math.min(height * 0.88, 520));
  const containToDrawer = Boolean(drawer && options.containToDrawer !== false);

  if (drawer) {
    drawer.style.setProperty('transform', 'none', 'important');
  }

  flow.style.setProperty('position', 'fixed', 'important');
  flow.style.setProperty('top', 'auto', 'important');
  flow.style.setProperty('bottom', `${bottomGap}px`, 'important');
  flow.style.setProperty('height', 'auto', 'important');
  flow.style.setProperty('max-height', `${maxH}px`, 'important');
  flow.style.setProperty('z-index', '500', 'important');
  flow.classList.add('checkout-flow--vv-lock');

  if (containToDrawer) {
    const rect = drawer.getBoundingClientRect();
    const left = Math.round(rect.left);
    const width = Math.round(rect.width);
    flow.style.setProperty('left', `${left}px`, 'important');
    flow.style.setProperty('right', 'auto', 'important');
    flow.style.setProperty('width', `${width}px`, 'important');
  } else {
    flow.style.setProperty('left', '0', 'important');
    flow.style.setProperty('right', '0', 'important');
    flow.style.setProperty('width', '100%', 'important');
  }

  if (backdrop) {
    backdrop.style.setProperty('position', 'fixed', 'important');
    backdrop.style.setProperty('top', `${top}px`, 'important');
    backdrop.style.setProperty('height', `${height}px`, 'important');
    backdrop.style.setProperty('bottom', 'auto', 'important');
    backdrop.style.setProperty('z-index', '450', 'important');
    if (containToDrawer) {
      const rect = drawer.getBoundingClientRect();
      backdrop.style.setProperty('left', `${Math.round(rect.left)}px`, 'important');
      backdrop.style.setProperty('right', 'auto', 'important');
      backdrop.style.setProperty('width', `${Math.round(rect.width)}px`, 'important');
    } else {
      backdrop.style.setProperty('left', '0', 'important');
      backdrop.style.setProperty('right', '0', 'important');
      backdrop.style.setProperty('width', '100%', 'important');
    }
  }
}

export function clearSheetViewportLock(flow, backdrop, drawer, options = {}) {
  if (flow) {
    [
      'position',
      'left',
      'right',
      'bottom',
      'top',
      'width',
      'height',
      'max-height',
      'z-index',
    ].forEach((prop) => flow.style.removeProperty(prop));
    flow.classList.remove('checkout-flow--vv-lock');
  }
  if (backdrop) {
    ['position', 'left', 'right', 'top', 'bottom', 'width', 'height', 'z-index'].forEach(
      (prop) => backdrop.style.removeProperty(prop),
    );
  }
  // Never strip drawer transform while delivery is open — that lets fixed
  // descendants escape to the viewport (full-width stretch on desktop).
  if (drawer && options.resetDrawerTransform) {
    drawer.style.removeProperty('transform');
  }
}

/** Force delivery/pdp sheet to stay inside the cart drawer (desktop-safe). */
export function pinDeliveryInDrawer(flow, backdrop) {
  // Strip leftover vv-lock inline styles. Do NOT touch transform — .is-open needs translateY(0).
  if (flow) {
    flow.classList.remove('checkout-flow--vv-lock');
    [
      'position',
      'left',
      'right',
      'bottom',
      'top',
      'width',
      'height',
      'max-height',
      'max-width',
      'z-index',
    ].forEach((prop) => flow.style.removeProperty(prop));
    flow.style.setProperty('position', 'absolute', 'important');
    flow.style.setProperty('left', '0', 'important');
    flow.style.setProperty('right', '0', 'important');
    flow.style.setProperty('width', '100%', 'important');
    flow.style.setProperty('max-width', '100%', 'important');
    flow.style.setProperty('bottom', '0', 'important');
    flow.style.setProperty('top', 'auto', 'important');
  }
  if (backdrop) {
    ['position', 'left', 'right', 'top', 'bottom', 'width', 'height', 'z-index', 'inset'].forEach(
      (prop) => backdrop.style.removeProperty(prop),
    );
    backdrop.style.setProperty('position', 'absolute', 'important');
    backdrop.style.setProperty('inset', '0', 'important');
    backdrop.style.setProperty('width', 'auto', 'important');
    backdrop.style.setProperty('height', 'auto', 'important');
    backdrop.style.setProperty('max-width', '100%', 'important');
  }
}

export function publishViewportCssVars({ top, height, bottomGap }) {
  const root = document.documentElement;
  root.style.setProperty('--vv-top', `${top}px`);
  root.style.setProperty('--vv-height', `${height}px`);
  root.style.setProperty('--vv-bottom-gap', `${bottomGap}px`);
  root.style.setProperty('--app-height', `${height}px`);
}
