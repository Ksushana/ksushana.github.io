(() => {
  const MOBILE = 767;
  const TABLET = 1023;

  window.isMobile = function () {
    return window.matchMedia(`(max-width: ${MOBILE}px)`).matches;
  };

  window.isTablet = function () {
    return window.matchMedia(`(max-width: ${TABLET}px)`).matches;
  };

  window.isDesktop = function () {
    return window.matchMedia(`(min-width: ${TABLET + 1}px)`).matches;
  };

  window.isMobileSafari = () => {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iP(ad|od|hone)/i);
    const webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i);
  };
})();
