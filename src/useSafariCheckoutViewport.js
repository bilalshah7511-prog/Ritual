import { useEffect } from 'react';
import {
  applyDrawerViewportLock,
  applySheetViewportLock,
  clearDrawerViewportLock,
  clearSheetViewportLock,
  isCompactViewport,
  isTypingInside,
  pinDeliveryInDrawer,
  publishViewportCssVars,
  readVisualViewport,
} from './safariViewport';

function setTypingClass(on) {
  document.documentElement.classList.toggle('safari-typing', Boolean(on));
}

function isCheckoutCta(el) {
  return Boolean(el?.closest?.('.checkout-cta'));
}

/** Cart drawer: match visible viewport; freeze while typing (Safari keyboard). */
export function useSafariDrawerLock(drawerRef, active) {
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return undefined;

    let frozen = null;
    let lastIdleSnap = null;

    function clearLock() {
      clearDrawerViewportLock(drawer);
      frozen = null;
      setTypingClass(false);
    }

    function lockToVisualViewport() {
      if (!active || !isCompactViewport()) {
        clearLock();
        return;
      }

      const typing = isTypingInside(drawer);
      setTypingClass(typing);

      if (typing && frozen) {
        applyDrawerViewportLock(drawer, frozen);
        return;
      }

      const snap = readVisualViewport();
      if (typing) {
        if (!frozen) {
          frozen = lastIdleSnap
            ? { top: lastIdleSnap.top, height: lastIdleSnap.height }
            : { top: snap.top, height: snap.height };
        }
        applyDrawerViewportLock(drawer, frozen);
        return;
      }

      frozen = null;
      lastIdleSnap = snap;
      applyDrawerViewportLock(drawer, snap);
      publishViewportCssVars(snap);
    }

    function onFocusOut() {
      window.setTimeout(lockToVisualViewport, 180);
    }

    lockToVisualViewport();
    window.addEventListener('resize', lockToVisualViewport);
    window.addEventListener('orientationchange', lockToVisualViewport);
    window.visualViewport?.addEventListener('resize', lockToVisualViewport);
    window.visualViewport?.addEventListener('scroll', lockToVisualViewport);
    drawer.addEventListener('focusin', lockToVisualViewport);
    drawer.addEventListener('focusout', onFocusOut);

    return () => {
      clearLock();
      window.removeEventListener('resize', lockToVisualViewport);
      window.removeEventListener('orientationchange', lockToVisualViewport);
      window.visualViewport?.removeEventListener('resize', lockToVisualViewport);
      window.visualViewport?.removeEventListener('scroll', lockToVisualViewport);
      drawer.removeEventListener('focusin', lockToVisualViewport);
      drawer.removeEventListener('focusout', onFocusOut);
    };
  }, [drawerRef, active]);
}

/**
 * Sheets that need Safari keyboard/viewport lock.
 * Delivery/pdp/total stay absolute inside the cart drawer — fixed+100% lock
 * stretches them across the full viewport (Confirm Delivery UI bug).
 * Safari delivery typing is covered by useSafariDrawerLock instead.
 */
const VV_LOCK_SHEETS = new Set(['verify', 'payment', 'shipping']);

/** Login/payment sheets: rise fully; freeze while typing so UI doesn't jump/zoom. */
export function useSafariSheetLock(flowRef, backdropRef, drawerRef, sheet) {
  useEffect(() => {
    const flow = flowRef.current;
    const backdrop = backdropRef.current;
    const drawer = drawerRef.current;
    let frozen = null;
    let lastIdleSnap = null;
    let saveTapUntil = 0;

    function clearSheetLock() {
      if (sheet === 'delivery' || sheet === 'pdp' || sheet === 'total') {
        pinDeliveryInDrawer(flow, backdrop);
      } else {
        clearSheetViewportLock(flow, backdrop, drawer, { resetDrawerTransform: true });
      }
      frozen = null;
      setTypingClass(false);
    }

    function holdFreezeForSaveTap() {
      // Never lock delivery/pdp/total — keeps sheet inside cart drawer width
      if (!VV_LOCK_SHEETS.has(sheet)) {
        clearSheetLock();
        return;
      }
      // Keep frozen geometry while Save is pressed (keyboard dismiss must not grow sheet)
      saveTapUntil = Date.now() + 600;
      if (!frozen) frozen = lastIdleSnap || readVisualViewport();
      if (frozen) applySheetViewportLock(flow, backdrop, drawer, frozen);
    }

    function lockSheet() {
      if (!sheet || !flow || !isCompactViewport() || !VV_LOCK_SHEETS.has(sheet)) {
        clearSheetLock();
        return;
      }

      // After Save tap: keep frozen so sheet does not jump upward when keyboard closes
      if (Date.now() < saveTapUntil && frozen) {
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        return;
      }

      const active = document.activeElement;
      if (isCheckoutCta(active) && frozen) {
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        setTypingClass(false);
        return;
      }

      const typing = isTypingInside(flow);
      setTypingClass(typing);

      if (typing && frozen) {
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        return;
      }

      const snap = readVisualViewport();
      if (typing) {
        if (!frozen) frozen = lastIdleSnap || snap;
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        if (window.scrollY || window.scrollX) {
          window.scrollTo(0, 0);
        }
        return;
      }

      frozen = null;
      lastIdleSnap = snap;
      applySheetViewportLock(flow, backdrop, drawer, snap);
      publishViewportCssVars(snap);
    }

    function onFocusIn() {
      if (!frozen && lastIdleSnap) frozen = lastIdleSnap;
      lockSheet();
    }

    function onFocusOut(e) {
      const next = e.relatedTarget;
      if (isCheckoutCta(next) || (next && flow?.contains(next))) {
        if (frozen && VV_LOCK_SHEETS.has(sheet)) {
          applySheetViewportLock(flow, backdrop, drawer, frozen);
        }
        return;
      }
      window.setTimeout(lockSheet, 220);
    }

    function onPointerDownCapture(e) {
      if (isCheckoutCta(e.target)) {
        // Delivery/pdp/total: clear any leftover fixed styles (desktop multi-click stretch)
        if (!VV_LOCK_SHEETS.has(sheet)) {
          clearSheetLock();
          return;
        }
        holdFreezeForSaveTap();
      }
    }

    lockSheet();
    window.addEventListener('resize', lockSheet);
    window.addEventListener('orientationchange', lockSheet);
    window.visualViewport?.addEventListener('resize', lockSheet);
    window.visualViewport?.addEventListener('scroll', lockSheet);
    flow?.addEventListener('focusin', onFocusIn);
    flow?.addEventListener('focusout', onFocusOut);
    flow?.addEventListener('pointerdown', onPointerDownCapture, true);

    return () => {
      clearSheetLock();
      window.removeEventListener('resize', lockSheet);
      window.removeEventListener('orientationchange', lockSheet);
      window.visualViewport?.removeEventListener('resize', lockSheet);
      window.visualViewport?.removeEventListener('scroll', lockSheet);
      flow?.removeEventListener('focusin', onFocusIn);
      flow?.removeEventListener('focusout', onFocusOut);
      flow?.removeEventListener('pointerdown', onPointerDownCapture, true);
    };
  }, [flowRef, backdropRef, drawerRef, sheet]);
}
