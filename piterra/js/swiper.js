'use strict';

/* eslint-disable */
(function () {
  var swiper = new Swiper('.common-page__swiper-container', {
    slidesPerView: 1,
    loop: true,
    pagination: {
      el: '.common-page__swiper-pagination',
      clickable: true
    },
    navigation: {
      nextEl: '.common-page__swiper-button-next',
      prevEl: '.common-page__swiper-button-prev'
    }
  });
})();

// Слайдер переключения слайдов в карточке товара

(function () {
  var cardSlider = document.querySelector('.card-slider__container');

  var changeBulletVideoIcon = function () {
    var itemVideo = cardSlider.querySelector('.card-slider__slide--video');
    if (itemVideo) {
      var lastBullet = cardSlider.querySelector('.swiper-pagination-bullet:last-child');
      lastBullet.classList.add('swiper-pagination-video');
    }
  };

  if (cardSlider) {

    new Swiper(cardSlider, {
      slidesPerView: 1,
      navigation: {
        nextEl: '.card-slider__button--next',
        prevEl: '.card-slider__button--prev',
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
      },
      loop: true,
    });
    changeBulletVideoIcon();
  }
})();

(function () {
  // Слайдер сопутствующих товаров в карточке товара
  var relatedSliderContainer = document.querySelector('.related-products');
  var buttonContainer = document.querySelector('.related-products__slider-controls');
  var relatedItemsCount = document.querySelectorAll('.related-products__item').length;
  var relatedSwiper;

  var initRelatedSwiper = function () {
    if (relatedSwiper) {
      relatedSwiper.destroy();
    }
    relatedSwiper = new Swiper(relatedSliderContainer, {
      navigation: {
        nextEl: '.related-products__slider-controller--right',
        prevEl: '.related-products__slider-controller--left',
      },
      slidesPerView: 'auto',
      loop: true,
    });
  }

  var mustUseSlider = function () {
    if (getIsDesktop()) {
      return relatedItemsCount > 4;
    }
    return relatedItemsCount > 3;
  }

  var getIsDesktop = function () {
    if (!document.body.clientWidth) {
      return true;
    }
    return document.body.clientWidth > 1050;
  }

  var showButtons = function () {
    buttonContainer.classList.remove('visually-hidden');
  }

  var hideButtons = function () {
    buttonContainer.classList.add('visually-hidden');
  }

  var relatedHandler = function () {
    if (mustUseSlider()) {
      showButtons();
      initRelatedSwiper();
    } else {
      hideButtons();
      if (relatedSwiper) {
        relatedSwiper.destroy();
      }
    }
  }

  if (relatedSliderContainer) {
    relatedHandler();
    window.addEventListener('resize', relatedHandler);
  }
})();


// (function ($) {
//   $(document).ready(function () {
//     $('.slider').click();
//   });
// })(window.jQuery);

// console.log('click');
// var player;
// function onYouTubeIframeAPIReady() {
//   $(document).ready(function () {
//     player = new YT.Player('videoSwipe', {
//       events: {
//         'onReady': onPlayerReady,
//         'onStateChange': onPlayerStateChange
//       }
//     });
//   })(window.jQuery);
// }

// function onPlayerReady(e) {
//   $('.youTubeVideo').find('.video').addClass('video-overlay');
// }
// function OverlayOnVideo(playerStatus) {
//   if (playerStatus == 2) {
//     $('.youTubeVideo').find('.video').addClass('video-overlay');
//   }
// }

// function onPlayerStateChange(e) {
//   OverlayOnVideo(e.data);
// }

// $(document).on("click", ".video-overlay", function () {
//   if (player) {
//     player.playVideo();
//     $('.youTubeVideo').find('.video').removeClass('video-overlay');
//   }
// });
