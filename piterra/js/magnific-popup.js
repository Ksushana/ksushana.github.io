'use strict';

$(function () {

  var getIsMobile = function () {
    if (!document.body.clientWidth) {
      return false;
    }
    return document.body.clientWidth < 768;
  };

  if (getIsMobile()) {
    $('.mobile-popup__link').magnificPopup({
      type: 'inline',
      modal: true,
      alignTop: true,
      fixedContentPos: true,
      fixedBgPos: true,
      callbacks: {
        beforeOpen: function () {
          $('body').addClass('pc-modal__open');
        },
        beforeClose: function () {
          $('body').removeClass('pc-modal__open');
        }
      }
    });

    $(document).on('click', '.popup-modal-dismiss', function (e) {
      e.preventDefault();
      $.magnificPopup.close();
    });
  }
});
