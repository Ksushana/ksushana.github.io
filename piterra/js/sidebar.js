'use strict';

(function () {
  var sidebarItemMore = document.querySelectorAll('.sidebar__item--more > a');
  var sublist = document.querySelectorAll('.sidebar__sublist');
  var sublistIcon = document.querySelectorAll('.sidebar__more');

  [].forEach.call(sidebarItemMore, function (item, i) {
    sublistIcon[i].addEventListener('click', function (evt) {
      evt.preventDefault();
      sublist[i].classList.toggle('sidebar__sublist--show');

      if (sublist[i].classList.contains('sidebar__sublist--show')) {
        sublistIcon[i].style.transform = 'rotateX(0)';
      } else {
        sublistIcon[i].style.transform = 'rotateX(190deg)';
      }
    });
  });
})();
