'use strict';

// инициализация селект2
(function ($) {
  $(document).ready(function () {
    $('.custom-select-pagination').select2({
      width: '69px',
      minimumResultsForSearch: -1
    });
  });
})(window.jQuery);
