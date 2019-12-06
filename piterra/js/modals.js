'use strict';

(function () {
  window.modals = window.modals || {};

  window.bodyClickHandler = function (modal) {
    return function () {
      window.modals.closeModal(modal);
      modal.removeEventListener('click', window.bodyClickHandler(modal));
      window.removeEventListener('keydown', window.bodyClickHandler(modal));
    };
  };

  window.modals.closeModal = function (modal) {
    document.body.style.overflow = 'auto';
    modal.classList.remove('modal--show');
  };
  window.modals.openModal = function (modal) {
    modal.classList.add('modal--show');
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', window.bodyClickHandler(modal));
  };
})();
