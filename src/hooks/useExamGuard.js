import { useEffect, useRef, useState, useCallback } from 'react';

// NTA-style exam guard hook.
// - Enters fullscreen on start()
// - Tracks violations: tab switch, fullscreen exit, window blur, right-click, copy, devtools keys
// - After maxWarnings, calls onForceSubmit(violationsArray)
// - Blocks copy/paste/contextmenu/devtools-keys while active

const VIOLATION_TYPES = {
  TAB_HIDDEN: 'Tab switched / minimized',
  FULLSCREEN_EXIT: 'Exited fullscreen',
  WINDOW_BLUR: 'Window lost focus',
  RIGHT_CLICK: 'Right-click attempted',
  COPY_PASTE: 'Copy/paste attempted',
  DEVTOOLS_KEY: 'Devtools shortcut pressed',
};

export function useExamGuard({ enabled, maxWarnings = 3, onWarning, onForceSubmit }) {
  const [violations, setViolations] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const enabledRef = useRef(enabled);
  const violationsRef = useRef(violations);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { violationsRef.current = violations; }, [violations]);

  const recordViolation = useCallback((type) => {
    if (!enabledRef.current) return;
    const entry = { type, label: VIOLATION_TYPES[type] || type, timestamp: new Date().toISOString() };
    setViolations(prev => {
      const next = [...prev, entry];
      const count = next.length;
      if (count >= maxWarnings) {
        // Force submit on next tick — state updates first
        setTimeout(() => onForceSubmit?.(next), 0);
      } else {
        onWarning?.(count, maxWarnings, entry);
      }
      return next;
    });
  }, [maxWarnings, onWarning, onForceSubmit]);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn('[examguard] fullscreen failed:', err.message);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) await document.webkitExitFullscreen?.();
    } catch {}
    setIsFullscreen(false);
  }, []);

  // Attach listeners
  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.hidden) recordViolation('TAB_HIDDEN');
    };

    const onFsChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && enabledRef.current) recordViolation('FULLSCREEN_EXIT');
    };

    const onBlur = () => {
      // Tab switch already covered by visibility, this catches alt-tab without hide
      if (!document.hidden) recordViolation('WINDOW_BLUR');
    };

    const onContextMenu = (e) => { e.preventDefault(); recordViolation('RIGHT_CLICK'); };
    const onCopy = (e) => { e.preventDefault(); recordViolation('COPY_PASTE'); };
    const onCut = (e) => { e.preventDefault(); recordViolation('COPY_PASTE'); };
    const onPaste = (e) => { e.preventDefault(); recordViolation('COPY_PASTE'); };

    const onKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+C/X/V
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (
        e.key === 'F12' ||
        (ctrl && shift && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (ctrl && ['U', 'S', 'P'].includes(e.key.toUpperCase())) ||
        (ctrl && ['C', 'X', 'V', 'A'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        recordViolation('DEVTOOLS_KEY');
      }
    };

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Test in progress — leaving will submit. Continue?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [enabled, recordViolation]);

  return {
    violations,
    warningCount: violations.length,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
