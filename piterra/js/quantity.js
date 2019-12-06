'use strict';

// Увеличичвает и уменьшает колличество товара в карточке товара

(function ($) {
  $(document).ready(function () {
    var limitManualMinMax = function (input) {
      var value = input.val();
      if (value.length > 2) {
        input.val(value.slice(0, 2));
      }
      input.change();
    };

    var onInput = function (evt) {
      var input = $(evt.target);
      limitManualMinMax(input);
    };

    var decrement = function (input) {
      var min = input.prop('min');
      var newValue = parseInt(input.val(), 10) - 1;
      input.val(Math.max(min, newValue));
      input.change();
    };

    var handleMinus = function (evt) {
      var input = $(evt.target).parent().find('input');
      decrement(input);
      return false;
    };

    var increment = function (input) {
      var max = input.prop('max');
      var newValue = parseInt(input.val(), 10) + 1;
      input.val(Math.min(max, newValue));
      input.change();
    };

    var handlePlus = function (evt) {
      var input = $(evt.target).parent().find('input');
      increment(input);
      return false;
    };

    $(document).on('input', '.quantity-input input[type=number]', onInput);
    $(document).on('click', '.minus', handleMinus);
    $(document).on('click', '.plus', handlePlus);
  });
})(window.jQuery);
