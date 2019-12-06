'use strict';

/* eslint-disable */
(function () {
  var cardSlider = document.querySelector('.swiper-services--mobile');

  if (cardSlider) {
    var swiper = new Swiper('.swiper-services--mobile', {
      slidesPerView: 'auto',
      slidesOffsetBefore: -5,
      spaceBetween: 20,
      speed: 1000,
      centeredSlides: true,
      observer: true,
      observeParents: true
    });
  }

})();
