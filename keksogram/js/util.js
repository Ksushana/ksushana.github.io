'use strict';

(function () {
  var constants = {
    DEFAULT_RAMDOM_MIN: 1,
    DEFAULT_RAMDOM_MAX: 100,
    DEBOUNCE_INTERVAL: 200,
    URL_GET: 'https://js.dump.academy/kekstagram/data',
    URL_POST: 'https://js.dump.academy/kekstagram',
    ESC: 27,
    RESIZE_STEP: 25,
    RESIZE_MIN_VALUE: 25,
    RESIZE_MAX_VALUE: 100,
    SPIN_MINIMUM_VALUE: 0,
    EFFECT_PARAMS: {
      chrome: {filter: 'grayscale', min: 0, max: 1, unit: null},
      sepia: {filter: 'sepia', min: 0, max: 1, unit: null},
      marvin: {filter: 'invert', min: 0, max: 100, unit: '%'},
      phobos: {filter: 'blur', min: 0, max: 3, unit: 'px'},
      heat: {filter: 'brightness', min: 1, max: 3, unit: null}
    },
    SPIN_DEFAULT_VALUE: 100,
    TIMEOUT: 10000,
    SUCCESS_STATUS: 200
  };

  var hashtagInputRequirements = {
    startsWithHash: 'Хэш-теги должны начинаться с символа # (решётка)',
    minimumTwoSymbols: 'Хеш-тег не может состоять только из одной решётки',
    spaceBetween: 'Хэш-теги должны разделяться пробелами',
    noRepeat: 'Один и тот же хэш-тег не может быть использован дважды',
    maximumAmmount: 'Нельзя указать больше пяти хэш-тегов',
    maxLength: 'Максимальная длина одного хэш-тега 20 символов, включая знак #'
  };

  var messageErrorElement = document.querySelector('.message_error');
  var debounceTimeout;

  var showError = function (message) {
    messageErrorElement.classList.remove('hidden');
    messageErrorElement.textContent = message;
  };

  var hideError = function () {
    messageErrorElement.classList.add('hidden');
  };

  var getRandomInteger = function (max, min) {
    min = min || constants.DEFAULT_RAMDOM_MIN;
    max = max || constants.DEFAULT_RAMDOM_MAX;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var validateUniqueness = function (array) {
    var presentElements = {};

    for (var i = 0; i < array.length; i++) {
      var item = array[i];
      if (presentElements[item]) {
        return false;
      }
      presentElements[item] = true;
    }

    return true;
  };

  var debounce = function (callback) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
      debounceTimeout = setTimeout(callback, constants.DEBOUNCE_INTERVAL);
    } else {
      callback();
      debounceTimeout = setTimeout(function () {
        debounceTimeout = null;
      }, constants.DEBOUNCE_INTERVAL);
    }
  };

  window.util = {
    showError: showError,
    hideError: hideError,
    getRandomInteger: getRandomInteger,
    validateUniqueness: validateUniqueness,
    debounce: debounce,
    constants: constants,
    hashtagInputRequirements: hashtagInputRequirements
  };
})();
