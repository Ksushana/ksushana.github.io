// 'use strict';

// var cardItems = $('.cards__item');
// var popUp = $('.card-popup');

// var title = $('.card-popup__title');
// var image = $('.card-popup__image');

// var removeModalByKey = function (evt) {
//   if (evt.keyCode === 27) {
//     evt.preventDefault();
//     popUp.removeClass('card-popup--open');
//   }
//   $(window).off('keydown', removeModalByKey);
// };

// var removeModalByClick = function () {
//   popUp.removeClass('card-popup--open');
//   $(window).off('keydown', removeModalByKey);
// };

// cardItems.on('click', function (event) {
//   event.stopPropagation();
//   var currentName = $(this).find('.cards__title').text();
//   var currentImage = $(this).find('.cards__img').attr('src');

//   var newName = currentName.split(' ').slice(1).join(' ');

//   if ($('.tabs__link--active').text() === 'Лепной декор') {
//     newName = currentName;
//   }

//   title.text(newName);
//   image.attr('src', currentImage);
//   popUp.addClass('card-popup--open');

//   var currentPosition = $(this).offset();

//   var newTopPoistion = currentPosition.top + 39;
//   var newLeftPoistion = currentPosition.left + 115;

//   if ($(window).width() < 1400) {
//     newTopPoistion = currentPosition.top + 10;
//     newLeftPoistion = currentPosition.left + 10;
//   }

//   if ($(window).width() > 700) {
//     popUp.css({
//       'top': newTopPoistion,
//       'left': newLeftPoistion,
//     });
//   }


//   $(window).on('keydown', removeModalByKey);

// });

// $('body').on('click', removeModalByClick);

'use strict';

var cardItems = $('.cards__img');
var popUp = $('.card-popup');

var title = $('.card-popup__title');
var image = $('.card-popup__image');

// var removeModalByClick = function () {
//   popUp.removeClass('card-popup--open');

// };

cardItems.on('mouseover', function (event) {
  var currentName = $(this).parent().find('.cards__title').text();
  var currentImage = $(this).attr('src');

  var newName = currentName.split(' ').slice(1).join(' ');

  if ($('.tabs__link--active').text() === 'Лепной декор') {
    newName = currentName;
  }

  title.text(newName);
  image.attr('src', currentImage);
  popUp.addClass('card-popup--open');

  var currentPosition = $(this).offset();

  var newTopPoistion = currentPosition.top;
  var newLeftPoistion = currentPosition.left - 154;

  if ($(window).width() <= 1500) {
    newTopPoistion = currentPosition.top;
    newLeftPoistion = currentPosition.left - 105;
  }

  if ($(window).width() <= 1050) {
    newTopPoistion = currentPosition.top;
    newLeftPoistion = currentPosition.left - 50;
  }

  if ($(window).width() > 700) {
    popUp.css({
      'top': newTopPoistion,
      'left': newLeftPoistion,
    });
  }

  if ($(window).width() <= 700) {
    $('body').on('click', function () {
      $('.card-popup--open').removeClass('card-popup--open');
    })
  }


  popUp.on('mouseleave', function () {
    popUp.removeClass('card-popup--open');
  });
});

