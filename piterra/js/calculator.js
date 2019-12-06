'use strict';

(function () {
  var sumBlock = document.querySelector('.calculator__total');

  if (sumBlock) {
    var infoBlock = document.querySelector('.calculator__info');
    var button = document.querySelector('.calculator__item-btn');

    var showSum = function () {
      sumBlock.classList.add('calculator__total--show');
      infoBlock.classList.add('calculator__info--show');
    };

    button.addEventListener('click', function (evt) {
      evt.preventDefault();
      showSum();
    });
  }
})();

(function () {
  var calcBlocks = document.querySelectorAll('.pc-calc__item');

  if (calcBlocks.length) {
    var sumBlock = document.querySelector('.pc-calc__results');
    var button = document.querySelector('.pc-calc__block button');
    var info = document.querySelector('.pc-calc__tab--info');

    var showSum = function () {
      sumBlock.classList.remove('visually-hidden');
      for (var i = 0; i < calcBlocks.length; i++) {
        var calcBlock = calcBlocks[i];
        calcBlock.classList.add('visually-hidden');
        info.classList.remove('visually-hidden');
      }
    };

    button.addEventListener('click', function (evt) {
      evt.preventDefault();
      showSum();
    });
  }
})();
