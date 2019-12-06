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

    modalSend.addEventListener('click', function () {
      window.modals.closeModal(modalSend);
      window.modals.closeModal(modalHistory);
      modalSend.removeEventListener('click', window.bodyClickHandler(modalSend));
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
        document.body.style.overflow = 'auto';
        window.modals.closeModal(modalSend);
        window.modals.closeModal(modalHistory);
      }
    });
  }
})();
