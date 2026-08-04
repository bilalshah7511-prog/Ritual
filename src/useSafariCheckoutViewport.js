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
        // Keep pre-keyboard drawer size (Pixel-like) — don't shrink with keyboard
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

/** Sheets that need Safari keyboard/viewport lock (NOT pdp / delivery / total). */
const VV_LOCK_SHEETS = new Set(['verify', 'payment', 'shipping']);

/** Login/payment sheets: rise fully; freeze while typing so UI doesn't jump/zoom. */
export function useSafariSheetLock(flowRef, backdropRef, drawerRef, sheet) {
  useEffect(() => {
    const flow = flowRef.current;
    const backdrop = backdropRef.current;
    const drawer = drawerRef.current;
    let frozen = null;
    let lastIdleSnap = null;

    function clearSheetLock() {
      clearSheetViewportLock(flow, backdrop, drawer);
      frozen = null;
      setTypingClass(false);
    }

    function lockSheet() {
      // PDP / delivery / total must keep normal drawer sheet behavior on mobile
      if (!sheet || !flow || !isCompactViewport() || !VV_LOCK_SHEETS.has(sheet)) {
        clearSheetLock();
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
        // Freeze to last idle snap so keyboard/zoom doesn't reshuffle payment UI
        if (!frozen) frozen = lastIdleSnap || snap;
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        // Undo Safari's focus scroll offset that shifts the whole page
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
      // Capture idle geometry before the keyboard animates
      if (!frozen && lastIdleSnap) frozen = lastIdleSnap;
      lockSheet();
    }

    function onFocusOut() {
      window.setTimeout(lockSheet, 180);
    }

    lockSheet();
    window.addEventListener('resize', lockSheet);
    window.addEventListener('orientationchange', lockSheet);
    window.visualViewport?.addEventListener('resize', lockSheet);
    window.visualViewport?.addEventListener('scroll', lockSheet);
    flow?.addEventListener('focusin', onFocusIn);
    flow?.addEventListener('focusout', onFocusOut);

    return () => {
      clearSheetLock();
      window.removeEventListener('resize', lockSheet);
      window.removeEventListener('orientationchange', lockSheet);
      window.visualViewport?.removeEventListener('resize', lockSheet);
      window.visualViewport?.removeEventListener('scroll', lockSheet);
      flow?.removeEventListener('focusin', onFocusIn);
      flow?.removeEventListener('focusout', onFocusOut);
    };
  }, [flowRef, backdropRef, drawerRef, sheet]);
}
