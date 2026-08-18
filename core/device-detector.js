// core/device-detector.js
// ------------------------------------------------------------------
// Identifica o ambiente (mobile / tablet / desktop) a partir do
// dispositivo real. Usado pela PONTE (core/router.js) e por qualquer
// tela que precise adaptar layout.
// ------------------------------------------------------------------

export function detectDevice() {
  const ua = navigator.userAgent || '';
  const isTouchLikeUA = /Mobi|Android|iPhone|iPod/i.test(ua);
  const isTabletUA = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
  const width = Math.min(window.innerWidth, window.screen ? window.screen.width : window.innerWidth);
  const hasCoarsePointer = matchMedia('(pointer: coarse)').matches;

  if (isTabletUA || (hasCoarsePointer && width >= 600 && width < 1100)) return 'tablet';
  if (isTouchLikeUA || (hasCoarsePointer && width < 600)) return 'mobile';
  return 'desktop';
}

export function isSmallViewport() {
  return Math.min(window.innerWidth, window.screen ? window.screen.width : window.innerWidth) < 620;
}
