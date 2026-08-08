import { useEffect } from 'react';
import {
  applyDrawerViewportLock,
  applySheetViewportLock,
  clearDrawerViewportLock,
  clearSheetViewportLock,
  isCompactViewport,
  isTypingInside,
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

/** Sheets that need Safari keyboard/viewport lock (NOT pdp / total). */
const VV_LOCK_SHEETS = new Set(['verify', 'payment', 'shipping', 'delivery']);
/** Delivery stays drawer-width; payment/verify/shipping can use full viewport. */
const DRAWER_CONTAINED_SHEETS = new Set(['delivery']);

/** Login/payment sheets: rise fully; freeze while typing so UI doesn't jump/zoom. */
export function useSafariSheetLock(flowRef, backdropRef, drawerRef, sheet) {
  useEffect(() => {
    const flow = flowRef.current;
    const backdrop = backdropRef.current;
    const drawer = drawerRef.current;
    let frozen = null;
    let lastIdleSnap = null;
    let saveTapUntil = 0;

    function lockOpts() {
      return { containToDrawer: DRAWER_CONTAINED_SHEETS.has(sheet) };
    }

    function applyLock(snap) {
      applySheetViewportLock(flow, backdrop, drawer, snap, lockOpts());
    }

    function clearSheetLock() {
      clearSheetViewportLock(flow, backdrop, drawer);
      frozen = null;
      setTypingClass(false);
    }

    function holdFreezeForSaveTap() {
      if (!VV_LOCK_SHEETS.has(sheet)) return;
      // Keep frozen geometry while Save is pressed (keyboard dismiss must not grow sheet)
      saveTapUntil = Date.now() + 600;
      if (!frozen) frozen = lastIdleSnap || readVisualViewport();
      if (frozen) applyLock(frozen);
    }

    function lockSheet() {
      if (!sheet || !flow || !isCompactViewport() || !VV_LOCK_SHEETS.has(sheet)) {
        clearSheetLock();
        return;
      }

      // After Save tap: keep frozen so sheet does not jump upward when keyboard closes
      if (Date.now() < saveTapUntil && frozen) {
        applyLock(frozen);
        return;
      }

      const active = document.activeElement;
      if (isCheckoutCta(active) && frozen) {
        applyLock(frozen);
        setTypingClass(false);
        return;
      }

      const typing = isTypingInside(flow);
      setTypingClass(typing);

      if (typing && frozen) {
        applyLock(frozen);
        return;
      }

      const snap = readVisualViewport();
      if (typing) {
        if (!frozen) frozen = lastIdleSnap || snap;
        applyLock(frozen);
        if (window.scrollY || window.scrollX) {
          window.scrollTo(0, 0);
        }
        return;
      }

      frozen = null;
      lastIdleSnap = snap;
      applyLock(snap);
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
          applyLock(frozen);
        }
        return;
      }
      window.setTimeout(lockSheet, 220);
    }

    function onPointerDownCapture(e) {
      if (isCheckoutCta(e.target)) {
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
