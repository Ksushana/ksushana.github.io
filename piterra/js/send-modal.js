'use strict';

// модальное окно авторизации
(function () {
  var KEYCODES = {
    ESC: 27
  };
  var modalSend = document.querySelector('.modal--send');
  var modalCloseButton = document.querySelector('.modal__close--send');
  var modalOpenButton = document.querySelector('.modal__button--yes');
  var modalBox = document.querySelector('.modal--send .modal__box');
  var modalHistory = document.querySelector('.modal--history');

  if (modalSend) {
    modalBox.addEventListener('click', function (evt) {
      evt.stopPropagation();
    });

    modalCloseButton.addEventListener('click', function (evt) {
      evt.stopPropagation();
      window.modals.closeModal(modalSend);
      window.modals.closeModal(modalHistory);
    });

    modalOpenButton.addEventListener('click', function (evt) {
      evt.stopPropagation();
      window.modals.openModal(modalSend);
    });

    window.addEventListener('keydown', function (evt) {
      if (evt.keyCode === KEYCODES.ESC && modalSend.classList.contains('modal--show')) {
        window.modals.closeModal(modalSend);
        window.modals.closeModal(modalHistory);
      }
    });
  }
})();
