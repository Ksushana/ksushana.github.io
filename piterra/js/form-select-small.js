'use strict';

// инициализация селект2
(function ($) {
  $(document).ready(function () {
    $('.custom-select-small').select2({
      width: '87px',
      minimumResultsForSearch: -1
    });
  });
})(window.jQuery);
