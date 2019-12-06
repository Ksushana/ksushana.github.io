'use strict';
var appoitmentLink = $('.pc-appoitment button');
var appoitmentForm = $('.pc-appoitment form');
var modal = $('.favourit-modal');
var closeButton = $('.favourit-modal__button');

var closeModal = function () {
  modal.removeClass('favourit-modal--open');
  closeButton.off('click', closeModal);
};

appoitmentForm.on('submit', function (evt) {
  evt.preventDefault();
  modal.addClass('favourit-modal--open');
  closeButton.on('click', closeModal);
});
