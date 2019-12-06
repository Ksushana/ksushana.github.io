'use strict';

(function () {
  var menu = document.querySelector('.header__menu');
  var menuButton = document.querySelector('.header__action--menu');

  var bodyClickHandler = function (element) {
    return function () {
      element.classList.remove('header__menu--show');
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.removeEventListener('click', bodyClickHandler(element));
      document.body.removeEventListener('touchstart', bodyClickHandler(element));
    };
  };

  menuButton.addEventListener('click', function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    menu.classList.toggle('header__menu--show');
    document.body.addEventListener('click', bodyClickHandler(menu));
    document.body.addEventListener('touchstart', bodyClickHandler(menu));

    if (menu.classList.contains('header__menu--show')) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.right = 0;
      document.body.style.left = 0;
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }
  });
})();
