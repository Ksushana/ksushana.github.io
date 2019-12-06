'use strict';

// инициализация селект2
(function ($) {
  $(document).ready(function () {
    $('.custom-select-booking').select2({
      width: '100%',
      minimumResultsForSearch: -1
    });
  });
})(window.jQuery);
