'use strict';

(function () {
  var copyButtons = document.querySelectorAll('.home-intro__copy');
  var copyFields = document.querySelectorAll('.home-intro__field');

  var copyLink = function () {
    [].forEach.call(copyFields, function (field) {
      field.select();
      document.execCommand('copy');
    });
  };

  [].forEach.call(copyButtons, function (button) {
    button.addEventListener('click', function () {
      copyLink();
    });
  });
})();
