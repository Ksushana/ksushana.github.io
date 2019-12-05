'use strict';

(function () {
  window.modals = window.modals || {};

  var bodyClickHandler = function (modal) {
    return function () {
      window.modals.closeModal(modal);
      modal.removeEventListener('click', bodyClickHandler(modal));
    };
  };

  window.modals.closeModal = function (modal) {
    modal.classList.remove('modal--show');
  };
  window.modals.openModal = function (modal) {
    modal.classList.add('modal--show');
    modal.addEventListener('click', bodyClickHandler(modal));
  };
})();
