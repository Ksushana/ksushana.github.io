'use strict';

(function () {
  var button = document.querySelector('.common-field__show-password');
  var input = document.querySelector('.common-field__input--show-password');
  var passwordShown = false;

  var showPassword = function () {
    input.setAttribute('type', 'text');
    passwordShown = true;
  };

  var hidePassword = function () {
    input.setAttribute('type', 'password');
    passwordShown = false;
  };

  button.addEventListener('click', function () {
    if (!passwordShown) {
      showPassword();
    } else {
      hidePassword();
    }
  });
})();
