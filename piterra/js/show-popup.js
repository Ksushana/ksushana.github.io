'use strict';

(function () {
  var table = document.querySelector('.picked-items__table');

  var hideAllPopups = function () {
    if (document.querySelector('.picked-items__big-img--shown')) {
      var shownPopup = document.querySelector('.picked-items__big-img--shown');
      shownPopup.classList.remove('picked-items__big-img--shown');
    }
  };

  var bodyClickHandler = function (evt) {
    evt.preventDefault();
    var bodyTarget = evt.target;
    if (bodyTarget !== window.document.body.myParams.popup && Array.from(window.document.body.myParams.popup.childNodes).indexOf(bodyTarget) === -1 && !bodyTarget.classList.contains('picked-items__img')) {
      window.document.body.myParams.popup.classList.remove('picked-items__big-img--shown');
      clearTimeout(window.document.body.myParams.timerId);
      document.body.removeEventListener('click', bodyClickHandler);
    }
  };


  var closePopup = function (closeButton, popup) {
    if (document.querySelector('.picked-items__big-img--shown')) {
      closeButton.addEventListener('click', function () {
        popup.classList.remove('picked-items__big-img--shown');
        clearTimeout(window.document.body.myParams.timerId);
        document.body.removeEventListener('click', bodyClickHandler);
      });
      var timerId = setTimeout(function () {
        document.body.myParams = {
          popup: popup,
          timerId: timerId
        };
        document.body.addEventListener('click', bodyClickHandler);
      }, 100, popup);
    }
  };

  table.addEventListener('click', function (evt) {
    evt.preventDefault();
    var target = evt.target;
    if (target.classList.contains('img-wrapper') || target.classList.contains('picked-items__img')) {
      var popup = target.querySelector('.picked-items__big-img') || target.nextSibling;
      var closeButton = popup.querySelector('.picked-items__close-popup');
      hideAllPopups();
      popup.classList.add('picked-items__big-img--shown');
      closePopup(closeButton, popup);
    }
  });
})();
