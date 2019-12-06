'use strict';

(function ($) {
  var inputSelector = 'input[type=number]';

  var keyAllowed = function (key) {
    var keys = [8, 9, 13, 16, 17, 18, 19, 20, 27, 46, 48, 49, 50,
      51, 52, 53, 54, 55, 56, 57, 91, 92, 93];
    if (key && keys.indexOf(key) === -1) {
      return false;
    } else {
      return true;
    }
  };

  var onKeyPress = function (evt) {
    var key = !isNaN(evt.charCode) ? evt.charCode : evt.keyCode;
    if (!keyAllowed(key)) {
      evt.preventDefault();
      return;
    }
  };

  $(document).on('keypress', inputSelector, onKeyPress);
})(window.jQuery);
