'use strict';

// инициализация daterangepicker
(function ($) {
  $('input[name="daterange"]').daterangepicker({
    locale: {
      format: 'DD/MM/YYYY'
    },
  });

  $('.appointment__input-date').daterangepicker({
    locale: {
      format: 'DD/MM/YYYY'
    },
    singleDatePicker: true,
  });
})(window.jQuery);

