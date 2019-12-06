'use strict';

// Polyfill closest
(function (ELEMENT) {
  ELEMENT.matches = ELEMENT.matches
    || ELEMENT.mozMatchesSelector
    || ELEMENT.msMatchesSelector
    || ELEMENT.oMatchesSelector
    || ELEMENT.webkitMatchesSelector;
  ELEMENT.closest = ELEMENT.closest || function closest(selector) {
    if (!this) return null;
    if (this.matches(selector)) return this;
    if (!this.parentElement) {
      return null
    } else return this.parentElement.closest(selector)
  };
}(Element.prototype));
(function () {
  var ESC_KEY = 'Escape';

  window.utils = {
    escPressHandler: function (evt, cb) {
      if (evt.key === ESC_KEY) {
        cb();
      }
    },
  };
})();

// Считает общею сумму в корзине
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var container = document.querySelector('.your-order');
    if (container !== null) {
      var cartInfo = container.querySelector('.your-order__top-cart span');
      var sumInfo = container.querySelector('.your-order__info-sum span');
      var form = container.querySelector('.your-order__form');

      var getCalcPrice = function (count, price, total) {
        return total + (count * price);
      };

      window.calcSumCartHandler = function () {
        var items = container.querySelectorAll('.your-order__item');
        var sum = 0;
        [].forEach.call(items, function (item) {
          var count = item.querySelector('.your-order__desc-label-count input').value;
          var price = parseInt(item.querySelector('.your-order__price span').textContent.replace(/ /, ''), 10);
          var isChecked = item.querySelector('.your-order__label input').checked;
          count = count.length !== 0 ? parseInt(count, 10) : 0;
          if (isChecked) {
            sum = getCalcPrice(count, price, sum);
          }
        });
        sumInfo.textContent = sum.toString().replace(/(\d)(?=(\d{3})+(\D|$))/g, '$1 ');
        cartInfo.textContent = items.length;
      };
      calcSumCartHandler();

      form.addEventListener('input', calcSumCartHandler);

      container.addEventListener('click', function (evt) {
        var item = evt.target.closest('.your-order__item');

        if (item) {
          var buttonDecrementEvt = evt.target.closest('.your-order__desc-button--decrement');
          var buttonIncrementEvt = evt.target.closest('.your-order__desc-button--increment');
          var buttonDecrement = item.querySelector('.your-order__desc-button--decrement');
          var buttonIncrement = item.querySelector('.your-order__desc-button--increment');
          var field = item.querySelector('.your-order__desc-label-count input');
          var result = parseInt(field.value, 10);

          if (buttonDecrementEvt) {
            if (result > 0) {
              result--;
              field.value = result;
              calcSumCartHandler();
            }

            if (result <= 0) {
              buttonDecrement.classList.add('your-order__desc-button--disabled');
            }

            if (result < 9999 && buttonIncrement.classList.contains('your-order__desc-button--disabled')) {
              buttonIncrement.classList.remove('your-order__desc-button--disabled');
            }
          }

          if (buttonIncrementEvt) {
            if (result < 9999) {
              result++;
              field.value = result;
              calcSumCartHandler();
            }
            if (result >= 9999) {
              buttonIncrement.classList.add('your-order__desc-button--disabled');
            }
            if (result > 0 && buttonDecrement.classList.contains('your-order__desc-button--disabled')) {
              buttonDecrement.classList.remove('your-order__desc-button--disabled');
            }
          }
        }
      });
    }
  });
})();

// возвращает разметку
(function () {
  var createElement = function (template) {
    var newElement = document.createElement('div');
    newElement.innerHTML = template.trim();
    return newElement.firstChild;
  };

  window.getTemplateCartItem = function (item) {
    var itemImgSrc = item.querySelector('.picked-items__td--first .picked-items__img').src;
    var itemArticle = item.querySelector('.picked-items__td--second').textContent.trim().replace(/\n/, '');
    var itemCategory = item.querySelector('.picked-items__td--third .picked-items__td-transform').textContent.replace(/\n/, '');
    var itemType = item.querySelector('.picked-items__td--fourth .picked-items__td-transform').textContent.replace(/\n/, '').trim();
    var itemBrand = item.querySelector('.picked-items__td--fifth .picked-items__td-transform').textContent.replace(/\n/, '');
    var itemCollections = item.querySelector('.picked-items__td--sixth .picked-items__td-transform').textContent.replace(/\n/, '');
    var itemPrice = item.querySelector('.picked-items__td--eighth').textContent;
    var itemCount = item.querySelector('.picked-items__td--ninth .picked-items__input').value;

    itemType = itemType[0].charAt(0).toLowerCase() + itemType.slice(1);
    itemPrice = itemPrice.replace(/₽/, '').trim();
    itemCount = itemCount.length === 0 ? 1 : itemCount;

  var template = '' +
    '<li class="your-order__item">' +
      '<label class="your-order__label">' +
        '<span class="visually-hidden">Товар выбран</span>' +
        '<input class="visually-hidden" type="checkbox" name="'+itemArticle+'" checked>' +
        '<span></span>' +
      '</label>' +
      '<div class="your-order__img-wrapper">' +
        '<img src="'+itemImgSrc+'" alt="Изображение товара">' +
      '</div>' +
      '<div class="your-order__desc-wrapper">' +
        '<p class="your-order__desc-title">'+itemBrand+'</p>' +
        '<p class="your-order__desc-name">'+itemCategory+ ' ' +itemType+ ' '+ itemCollections +'</p>' +
        '<p class="your-order__desc-name your-order__desc-name--article">арт. '+itemArticle+'</p>' +
        '<p class="your-order__desc-available">' +
          'Есть в наличии на складе - <span>156</span> шт.' +
        '</p>' +
        '<div class="your-order__desc-bottom">' +
          '<button class="your-order__desc-button your-order__desc-button--decrement" type="button" title="Минус">-</button>' +
          '<label class="your-order__desc-label-count">' +
            '<input type="number" name="count-pro-spero-grace-art-312010" value="'+itemCount+'">' +
          '</label>' +
          '<button class="your-order__desc-button your-order__desc-button--increment" type="button" title="Плюс">+ </button>' +
          '<div class="your-order__price-wrapper">' +
            '<p class="your-order__price-desc">Цена за рул</p>' +
            '<p class="your-order__price">' +
              '<span>'+itemPrice+'</span> ₽' +
            '</p>' +
          '</div>' +
          '<div class="your-order__price-wrapper your-order__price-wrapper--old">' +
            '<p class="your-order__price-desc">Старая цена</p>' +
            '<p class="your-order__price">' +
              '<span>11 400</span> ₽' +
            '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</li>';

    return createElement(template);
  };
})();

(function () {
  var buttonShowCart = document.querySelector('.your-order__top-button');
  if (buttonShowCart !== null) {
    var cardContainer = document.querySelector('.common-page__your-order');
    var titleTooltips = buttonShowCart.querySelector('span');
    buttonShowCart.addEventListener('click', function () {
      cardContainer.classList.toggle('common-page__your-order--show');
      cardContainer.classList.toggle('your-order--show');
      if (cardContainer.classList.contains('your-order--show')){
        titleTooltips.textContent = 'Свернуть';
        return;
      }
      titleTooltips.textContent = 'Развернуть';
    });
  }
})();

// Сворачивает сайдбар и показывает список корзины + добавляет товар в корзину
(function () {
  var container = document.querySelector('.picked-items');
  if (container !== null) {
    var breakpoint = window.matchMedia('(max-width: 1920px)');
    var sideBar = document.querySelector('.common-page__sidebar');
    var cardContainer = document.querySelector('.common-page__your-order');
    var cardList = cardContainer.querySelector('.your-order__list');
    var isShowAnimated = false;

    container.addEventListener('click', function (evt) {
      var item = evt.target.closest('.picked-items__tr');

      if (evt.target.closest('.picked-items__button:not(.picked-items__button--ok)')) {
        evt.target.classList.add('picked-items__button--ok');
        cardList.appendChild(getTemplateCartItem(item));
        calcSumCartHandler();

        if (isShowAnimated && breakpoint.matches === true) {
          return;
        }

        sideBar.classList.add('common-page__sidebar--show-animation');
        cardContainer.classList.add('common-page__your-order--show', 'your-order--show');

        setTimeout(function () {
          sideBar.classList.add('common-page__sidebar--only-icon', 'sidebar--only-icon');
        }, 450);
        setTimeout(function () {
          sideBar.classList.remove('common-page__sidebar--show-animation');
        }, 500);

        isShowAnimated = true;
      }
    });
  }
})();

// Модалка подтверждения
(function () {
  var button = document.querySelector('.your-order__submit');
  if (button !== null) {
    var body = document.querySelector('body');
    var modal = document.querySelector('.new-modal--your-order');
    var modalForm = modal.querySelector('.new-modal__form');

    var menuEscPressHandler = function (evt) {
      window.utils.escPressHandler(evt, closeModal);
    };

    var closeModal = function () {
      modal.classList.remove('new-modal--show');
      modal.classList.remove('new-modal--successful');
      document.removeEventListener('keydown', menuEscPressHandler);
      modal.removeEventListener('click', modalHandler);
      modalForm.removeEventListener('submit', modalFormSubmitHandler);
      body.classList.remove('no-scroll');
    };

    var modalHandler = function (evt) {
      if (evt.target.closest('.new-modal__box') === null || evt.target.classList.value === 'new-modal__close') {
        closeModal();
      }
    };

    var modalFormSubmitHandler = function (evt) {
      evt.preventDefault();
      modal.classList.add('new-modal--successful')
    };

    button.addEventListener('click', function (evt) {
      evt.preventDefault();
      modal.classList.add('new-modal--show');
      body.classList.add('no-scroll');
      document.addEventListener('keydown', menuEscPressHandler);
      modal.addEventListener('click', modalHandler);
      modalForm.addEventListener('submit', modalFormSubmitHandler);
    });
  }
})();
