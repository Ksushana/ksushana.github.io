'use strict';

(function () {
  var button = document.querySelector('.user-image__button--more');
  var popup = document.querySelector('.user-image__button--reload');

  window.addEventListener('click', function (evt) {
    var target = evt.target;
    if (target === button) {
      popup.style.display = 'block';
    } else {
      popup.style.display = 'none';
    }
  });
})();
