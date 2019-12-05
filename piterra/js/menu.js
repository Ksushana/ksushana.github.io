'use strict';

(function () {
  var menu = document.querySelector('.header__menu');
  var menuButton = document.querySelector('.header__action--menu');

  var bodyClickHandler = function (element) {
    return function () {
      element.classList.remove('header__menu--show');
      document.body.style.overflow = 'auto';
      document.body.removeEventListener('click', bodyClickHandler(element));
    };
  };

  menuButton.addEventListener('click', function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    menu.classList.toggle('header__menu--show');
    document.body.addEventListener('click', bodyClickHandler(menu));

    if (menu.classList.contains('header__menu--show')) {
      document.body.style.overflow = 'hidden';
    }
  });
})();
