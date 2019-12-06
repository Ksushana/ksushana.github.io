
'use strict';

/* eslint-disable */
(function () {
  var cardSlider = document.querySelector('.swiper-services');
  var sliderControls = document.querySelector('.additional-service__slider-controls');
  var additionalServiceItems = document.querySelectorAll('.additional-service__item');
  var additionalServiceItem = document.querySelector('.additional-service__item');
  var swiperContainer = document.querySelector('.swiper-services');
  var SPACE_BETWEEN_SLIDES = 13;
  var MAX_TABLET_WIDTH = 1050;

  var swipeServicesCardHandler = function () {
    if (cardSlider) {
      var swipeServicesCards = function () {
        new Swiper('.swiper-services', {
          slidesPerView: 'auto',
          spaceBetween: SPACE_BETWEEN_SLIDES,
          navigation: {
            nextEl: '.additional-service__slider-controller--right',
            prevEl: '.additional-service__slider-controller--left',
          },
        });
      }
      var swiperContainerWidth = parseFloat(window.getComputedStyle(swiperContainer).width);
      var additionalServiceItemWidth = parseFloat(window.getComputedStyle(additionalServiceItem).width);
      if (swiperContainerWidth < additionalServiceItemWidth * additionalServiceItems.length) {
        swipeServicesCards();
        if (document.body.clientWidth < MAX_TABLET_WIDTH) {
          sliderControls.style.display = '';
        } else {
          sliderControls.style.display = 'block';
        }
      } else {
        additionalServiceItems.forEach(function (items) {
          items.style.marginRight = SPACE_BETWEEN_SLIDES + 'px';
        })
      }
    }
  };

  swipeServicesCardHandler();
  window.addEventListener('resize', swipeServicesCardHandler);
})();
