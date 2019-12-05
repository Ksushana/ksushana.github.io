'use strict';

// инициализация daterangepicker
(function ($) {
  $('input[name="daterange"]').daterangepicker({
    locale: {
      format: 'DD/MM/YYYY'
    },
  });
})(window.jQuery);
