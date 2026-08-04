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

export function applySheetViewportLock(flow, backdrop, drawer, snap) {
  if (!flow) return;
  const { top, height, bottomGap } = snap;
  const maxH = Math.round(Math.min(height * 0.88, 520));

  if (drawer) {
    drawer.style.setProperty('transform', 'none', 'important');
  }

  flow.style.setProperty('position', 'fixed', 'important');
  flow.style.setProperty('left', '0', 'important');
  flow.style.setProperty('right', '0', 'important');
  flow.style.setProperty('width', '100%', 'important');
  flow.style.setProperty('top', 'auto', 'important');
  flow.style.setProperty('bottom', `${bottomGap}px`, 'important');
  flow.style.setProperty('height', 'auto', 'important');
  flow.style.setProperty('max-height', `${maxH}px`, 'important');
  flow.style.setProperty('z-index', '500', 'important');
  flow.classList.add('checkout-flow--vv-lock');

  if (backdrop) {
    backdrop.style.setProperty('position', 'fixed', 'important');
    backdrop.style.setProperty('left', '0', 'important');
    backdrop.style.setProperty('right', '0', 'important');
    backdrop.style.setProperty('top', `${top}px`, 'important');
    backdrop.style.setProperty('height', `${height}px`, 'important');
    backdrop.style.setProperty('bottom', 'auto', 'important');
    backdrop.style.setProperty('width', '100%', 'important');
    backdrop.style.setProperty('z-index', '450', 'important');
  }
}

export function clearSheetViewportLock(flow, backdrop, drawer) {
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
  if (drawer) {
    drawer.style.removeProperty('transform');
  }
}

export function publishViewportCssVars({ top, height, bottomGap }) {
  const root = document.documentElement;
  root.style.setProperty('--vv-top', `${top}px`);
  root.style.setProperty('--vv-height', `${height}px`);
  root.style.setProperty('--vv-bottom-gap', `${bottomGap}px`);
  root.style.setProperty('--app-height', `${height}px`);
}
