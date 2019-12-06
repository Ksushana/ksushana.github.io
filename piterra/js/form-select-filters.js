'use strict';

// инициализация селект2
(function ($) {
  $(document).ready(function () {

    $('.custom-select-filters').select2({
      width: '176px',
      minimumResultsForSearch: -1
    });

    $('.appointment__select-filters').select2({
      width: '100%',
      minimumResultsForSearch: -1
    });

    $('.appointment__time-filters').select2({
      width: '100%',
      minimumResultsForSearch: -1
    });

  });
})(window.jQuery);
