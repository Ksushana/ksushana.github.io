(() => {
  const slider = $(".slider");

  const windowHeight = $(window).height();

  window.animateSlider = function(lastScroll) {
    const imgs = document.querySelectorAll(`.slider__slide img`);
    const breakpoint = slider.offset().top + slider.height();
    const current = lastScroll + windowHeight / 2 + slider.height() / 1;
    if (current > breakpoint) {
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        img.classList.add(`color`);
      }
    } else {
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        img.classList.remove(`color`);
      }
    }
  };
})();
