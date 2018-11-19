'use strict';

(function () {

  var formElement = document.querySelector('.img-upload__form');
  var scaleElement = formElement.querySelector('.scale');
  var scalePinElement = scaleElement.querySelector('.scale__pin');
  var formImgElement = formElement.querySelector('.img-upload__preview img');
  var effectLevelInputElement = formElement.querySelector('.scale__value');
  var effectLevelElement = scaleElement.querySelector('.scale__level');
  // UPLOAD

  var imageUploadOverlayElement = formElement.querySelector('.img-upload__overlay');
  var fileInputElement = formElement.querySelector('.img-upload__input');
  var formCloseButtonElement = formElement.querySelector('.img-upload__cancel');

  var addEffectChangeListeners = function () {
    document.addEventListener('change', window.filter.onEffectRadioInputChange);
  };

  var removeEffectChangeListeners = function () {
    document.removeEventListener('change', window.filter.onEffectRadioInputChange);
  };

  var showForm = function () {
    imageUploadOverlayElement.classList.remove('hidden');
    document.addEventListener('keydown', onFormEscPress);
    formCloseButtonElement.addEventListener('click', onFormCloseButtonClick);
    scalePinElement.addEventListener('mousedown', onPinDownClick);
    resizeIncreasingButtonElement.addEventListener('click', onResizeIncreasingButton);
    resizeDecreasingButtonElement.addEventListener('click', onResizeDecreasingButton);

    addEffectChangeListeners();
    window.filter.hideScale();
  };

  var hideForm = function () {
    imageUploadOverlayElement.classList.add('hidden');
    fileInputElement.value = '';

    document.removeEventListener('keydown', onFormEscPress);
    formCloseButtonElement.removeEventListener('click', onFormCloseButtonClick);
    scalePinElement.removeEventListener('mousedown', onPinDownClick);
    resizeIncreasingButtonElement.removeEventListener('click', onResizeIncreasingButton);
    resizeDecreasingButtonElement.removeEventListener('click', onResizeDecreasingButton);

    removeEffectChangeListeners();
    window.filter.resetFilters();
  };

  var onFileInputChange = function () {
    showForm();
    window.upload.updateImage();
  };

  var onFormCloseButtonClick = function () {
    hideForm();
  };

  var onFormEscPress = function (evt) {
    if (evt.keyCode === window.util.constants.ESC) {
      hideForm();
    }
  };

  // РЕСАЙЗ

  var resizeDecreasingButtonElement = formElement.querySelector('.resize__control--minus');
  var resizeIncreasingButtonElement = formElement.querySelector('.resize__control--plus');
  var photoSizeInputElement = formElement.querySelector('.resize__control--value');

  var changePhotoSize = function (size) {
    var transformValue = 'scale(' + size / 100 + ')';
    formImgElement.style.transform = transformValue;
    photoSizeInputElement.value = size + '%';
  };

  var increasePhotoSize = function () {
    var currentSize = parseInt(photoSizeInputElement.value, 10);
    var newSize = currentSize + window.util.constants.RESIZE_STEP;
    if (newSize > window.util.constants.RESIZE_MAX_VALUE) {
      return;
    }
    changePhotoSize(newSize);
  };

  var decreasePhotoSize = function () {
    var currentSize = parseInt(photoSizeInputElement.value, 10);
    var newSize = currentSize - window.util.constants.RESIZE_STEP;
    if (newSize < window.util.constants.RESIZE_MIN_VALUE) {
      return;
    }
    changePhotoSize(newSize);
  };

  var onResizeDecreasingButton = function () {
    decreasePhotoSize();
  };

  var onResizeIncreasingButton = function () {
    increasePhotoSize();
  };

  // Перетаскивание

  var onPinDownClick = function (evt) {
    evt.preventDefault();

    var pinCoords = scalePinElement.getBoundingClientRect();
    var scaleCoords = scaleElement.getBoundingClientRect();
    var xShift = evt.pageX - (pinCoords.left + pinCoords.width / 2);

    var onMouseDragging = function (moveEvt) {
      var newCoords = moveEvt.pageX - scaleCoords.left - xShift;
      var maxCoords = scaleCoords.width;

      if (newCoords < window.util.constants.SPIN_MINIMUM_VALUE) {
        newCoords = 0;
      }

      if (newCoords > maxCoords) {
        newCoords = maxCoords;
      }

      effectLevelInputElement.value = Math.round(newCoords * 100 / scaleCoords.width);
      scalePinElement.style.left = effectLevelInputElement.value + '%';
      effectLevelElement.style.width = scalePinElement.style.left;
      window.filter.changeEffectLevel();
    };

    var onMouseMove = function (moveEvt) {
      moveEvt.preventDefault();
      onMouseDragging(moveEvt);
    };

    var onMouseUp = function (upEvt) {
      upEvt.preventDefault();
      onMouseDragging(upEvt);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  fileInputElement.addEventListener('change', onFileInputChange);

  var onFormSubmit = function (evt) {
    evt.preventDefault();
    if (window.validations.validateForm()) {
      submitForm();
    }
  };

  var resetForm = function () {
    formElement.reset();
    window.filter.resetFilters();
  };

  var submitForm = function () {
    var formData = new FormData(formElement);
    window.util.hideError();
    window.backend.request(window.util.constants.URL_POST, 'POST', formData, function () {
      hideForm();
      resetForm();
    }, function (error) {
      window.util.showError(error);
    });
  };

  formElement.addEventListener('submit', onFormSubmit);

  window.uploadForm = {
    form: formElement,
    scale: scaleElement,
    scalePin: scalePinElement,
    formImgElement: formImgElement,
    effectLevelInput: effectLevelInputElement,
    effectLevel: effectLevelElement,
    fileInput: fileInputElement
  };
})();
