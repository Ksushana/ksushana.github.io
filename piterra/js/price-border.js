'use strict';
var priceInput = $('.price-inputs__input');

priceInput.on('mouseenter', function () {
  $(this).parent().addClass('price-inputs__input-container--hover');
});

priceInput.on('mouseleave', function () {
  $(this).parent().removeClass('price-inputs__input-container--hover');
});

priceInput.on('focus', function () {
  $(this).parent().addClass('price-inputs__input-container--selected');
});

priceInput.on('focusout', function () {
  $(this).parent().removeClass('price-inputs__input-container--selected');
});
