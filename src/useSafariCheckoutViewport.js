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

/** Cart drawer: match visible viewport; freeze while typing (Safari keyboard). */
export function useSafariDrawerLock(drawerRef, active) {
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return undefined;

    let frozen = null;

    function clearLock() {
      clearDrawerViewportLock(drawer);
      frozen = null;
    }

    function lockToVisualViewport() {
      if (!active || !isCompactViewport()) {
        clearLock();
        return;
      }

      if (isTypingInside(drawer) && frozen) {
        applyDrawerViewportLock(drawer, frozen);
        return;
      }

      const snap = readVisualViewport();
      if (isTypingInside(drawer)) {
        if (!frozen) frozen = { top: snap.top, height: snap.height };
        applyDrawerViewportLock(drawer, frozen);
        return;
      }

      frozen = null;
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

/** Login/payment sheets: rise fully; freeze while typing so UI doesn't jump. */
export function useSafariSheetLock(flowRef, backdropRef, drawerRef, sheet) {
  useEffect(() => {
    const flow = flowRef.current;
    const backdrop = backdropRef.current;
    const drawer = drawerRef.current;
    let frozen = null;

    function clearSheetLock() {
      clearSheetViewportLock(flow, backdrop, drawer);
      frozen = null;
    }

    function lockSheet() {
      if (!sheet || !flow || !isCompactViewport()) {
        clearSheetLock();
        return;
      }

      if (isTypingInside(flow) && frozen) {
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        return;
      }

      const snap = readVisualViewport();
      if (isTypingInside(flow)) {
        if (!frozen) frozen = snap;
        applySheetViewportLock(flow, backdrop, drawer, frozen);
        return;
      }

      frozen = null;
      applySheetViewportLock(flow, backdrop, drawer, snap);
      publishViewportCssVars(snap);
    }

    function onFocusOut() {
      window.setTimeout(lockSheet, 180);
    }

    lockSheet();
    window.addEventListener('resize', lockSheet);
    window.addEventListener('orientationchange', lockSheet);
    window.visualViewport?.addEventListener('resize', lockSheet);
    window.visualViewport?.addEventListener('scroll', lockSheet);
    flow?.addEventListener('focusin', lockSheet);
    flow?.addEventListener('focusout', onFocusOut);

    return () => {
      clearSheetLock();
      window.removeEventListener('resize', lockSheet);
      window.removeEventListener('orientationchange', lockSheet);
      window.visualViewport?.removeEventListener('resize', lockSheet);
      window.visualViewport?.removeEventListener('scroll', lockSheet);
      flow?.removeEventListener('focusin', lockSheet);
      flow?.removeEventListener('focusout', onFocusOut);
    };
  }, [flowRef, backdropRef, drawerRef, sheet]);
}
