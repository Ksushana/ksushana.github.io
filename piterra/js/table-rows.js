'use strict';

(function () {
  var tableIcon = document.querySelectorAll('.history__table-more > img');
  var hiddenRow = document.querySelectorAll('.history__row-hidden');

  [].forEach.call(tableIcon, function (icon, i) {
    icon.addEventListener('click', function (e) {
      e.preventDefault();
      hiddenRow[i].classList.toggle('history__row-hidden--show');

      if (hiddenRow[i].classList.contains('history__row-hidden--show')) {
        icon.style.transform = 'rotateX(190deg)';
      } else {
        icon.style.transform = 'rotateX(0)';
      }
    });
  });
})();
