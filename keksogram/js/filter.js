'use strict';

(function () {

  var getSpinPercent = function () {
    var percent = parseInt(window.uploadForm.scalePin.style.left, 10);
    return percent;
  };

  var changeSpinPosition = function (percent) {
    if (!percent && percent !== 0) {
      percent = 100;
    }
    window.uploadForm.scalePin.style.left = percent + '%';
    window.uploadForm.effectLevel.style.width = percent + '%';
  };

  var hideScale = function () {
    window.uploadForm.scale.classList.add('hidden');
  };

  var showScale = function () {
    window.uploadForm.scale.classList.remove('hidden');
  };

  var applyFilter = function () {
    var percent = window.uploadForm.effectLevelInput.value;
    var effectNameElement = window.uploadForm.form.querySelector('.effects__radio:checked').value;
    if (effectNameElement === 'none') {
      hideScale();
    } else {
      showScale();
    }
    applyFilterCss(effectNameElement, percent);
  };

  var applyFilterCss = function (effect, percent) {
    var cssClass = 'effects__preview--' + effect;
    window.uploadForm.formImgElement.className = '';
    window.uploadForm.formImgElement.classList.add(cssClass);
    var filterValue = calcFilterValue(effect, percent);
    window.uploadForm.formImgElement.style.webkitFilter = filterValue;
    window.uploadForm.formImgElement.style.filter = filterValue;
  };

  var resetFilters = function () {
    var checkedEffectRadioElement = window.uploadForm.form.querySelector('.effects__radio:checked');
    var defaultEffectValueElement = window.uploadForm.form.querySelector('.effects__default');
    if (checkedEffectRadioElement) {
      checkedEffectRadioElement.checked = false;
    }
    window.uploadForm.formImgElement.className = '';
    window.uploadForm.formImgElement.style.filter = '';
    defaultEffectValueElement.checked = true;
  };

  var calcFilterValue = function (effect, percent) {
    if (effect === 'none') {
      return '';
    }

    var effectParams = window.util.constants.EFFECT_PARAMS[effect];
    var filterName = effectParams.filter;
    var unit = effectParams.unit || '';
    var range = effectParams.max - effectParams.min;

    var filterNumberValue = range * (percent / 100) + effectParams.min;
    var filterValue = filterName + '(' + filterNumberValue + unit + ')';
    return filterValue;
  };

  var changeEffectLevel = function () {
    window.uploadForm.effectLevelInput.value = getSpinPercent();
    applyFilter();
  };

  var changeEffect = function () {
    changeSpinPosition(window.util.constants.SPIN_DEFAULT_VALUE);
    window.uploadForm.effectLevelInput.value = window.util.constants.SPIN_DEFAULT_VALUE;
    applyFilter();
  };

  var onEffectRadioInputChange = function (evt) {
    if (evt.target.name === 'effect') {
      changeEffect();
    }
  };

  window.filter = {
    hideScale: hideScale,
    resetFilters: resetFilters,
    changeEffectLevel: changeEffectLevel,
    onEffectRadioInputChange: onEffectRadioInputChange
  };

})();
