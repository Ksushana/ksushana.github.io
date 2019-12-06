'use strict';
var favouritLinks = $('.notifications__favourit-link');
var modal = $('.favourit-modal');
var closeButton = $('.favourit-modal__button');

var closeModal = function () {
  modal.removeClass('favourit-modal--open');
  closeButton.off('click', closeModal);
  $(window).off('keydown', removeModalByKey);
};

var removeModalByKey = function (evt) {
  if (evt.keyCode === 27) {
    evt.preventDefault();
    modal.removeClass('favourit-modal--open');
  }
  $(window).off('keydown', removeModalByKey);
};


favouritLinks.on('click', function (evt) {
  evt.preventDefault();
  modal.addClass('favourit-modal--open');
  closeButton.on('click', closeModal);
  $(window).on('keydown', removeModalByKey);
});
