'use strict';

(function () {

  if (!Array.from) {
    Array.from = function (object) {
      return [].slice.call(object);
    };
  }

  var table = document.querySelector('.picked-items__table');
  var inputs = Array.from(document.querySelectorAll('.picked-items__input'));
  var increaseButtons = Array.from(document.querySelectorAll('.picked-items__input-button--increase'));
  var decreaseButtons = Array.from(document.querySelectorAll('.picked-items__input-button--decrease'));

  var startValues = [];
  for (var i = 0; i < inputs.length; i++) {
    var startValue = inputs[i].value;
    startValues.push(startValue);
  }

  table.addEventListener('input', function (evt) {
    evt.preventDefault();
    var target = evt.target;
    var inputIndex = inputs.indexOf(target);
    if (inputIndex !== -1) {
      var currentValue = target.value;
      if (isNaN(currentValue) || evt.data === ' ') {
        target.value = startValues[inputIndex];
      } else {
        if (startValues[inputIndex] === '0' || startValues[inputIndex][0] === ' ') {
          var newValue = currentValue.slice(1);
          target.value = newValue;
          startValues[inputIndex] = newValue;
        } else {
          startValues[inputIndex] = currentValue.replace(' ', '');
          target.value = startValues[inputIndex];
        }
      }
    }
  });

  table.addEventListener('click', function (evt) {
    evt.preventDefault();
    var clickTarget = evt.target;

    if (clickTarget.classList.contains('picked-items__input-button--increase')) {
      var buttonIndex = increaseButtons.indexOf(clickTarget);
      inputs[buttonIndex].value++;
      if (inputs[buttonIndex].value < 0) inputs[buttonIndex] === 0;
      startValues[buttonIndex] = inputs[buttonIndex].value;
    }

    if (clickTarget.classList.contains('picked-items__input-button--decrease')) {
      var buttonIndex = decreaseButtons.indexOf(clickTarget);
      inputs[buttonIndex].value > 0 ? inputs[buttonIndex].value-- : inputs[buttonIndex].value = 0;
      startValues[buttonIndex] = inputs[buttonIndex].value;
    }
  });
})();
