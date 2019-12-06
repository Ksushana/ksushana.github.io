'use strict';

// модальное окно авторизации
(function () {
  var KEYCODES = {
    ESC: 27
  };
  var modalHistory = document.querySelector('.modal--history');
  var modalCloseButton = document.querySelector('.modal__close--history');
  var modalOpenButton = document.querySelector('.history__button--cancel');
  var modalCancelButton = document.querySelector('.modal__button--no');
  var modalBox = document.querySelector('.modal--history .modal__box');

  if (modalHistory) {
    modalBox.addEventListener('click', function (evt) {
      evt.stopPropagation();
    });

    modalCloseButton.addEventListener('click', function (evt) {
      evt.stopPropagation();
      window.modals.closeModal(modalHistory);
    });

    modalCancelButton.addEventListener('click', function (evt) {
      evt.stopPropagation();
      window.modals.closeModal(modalHistory);
    });

    modalOpenButton.addEventListener('click', function (evt) {
      evt.stopPropagation();
      window.modals.openModal(modalHistory);
    });

    window.addEventListener('keydown', function (evt) {
      if (evt.keyCode === KEYCODES.ESC && modalHistory.classList.contains('modal--show')) {
        document.body.style.overflow = 'auto';
        window.modals.closeModal(modalHistory);
      }
    });
  }
})();
