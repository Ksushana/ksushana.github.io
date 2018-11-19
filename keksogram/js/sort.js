'use strict';

(function () {
  var imageFilterButtonElements = document.querySelectorAll('.img-filters__button');

  var clearFilterButtonsClasses = function () {
    imageFilterButtonElements.forEach(function (button) {
      button.classList.remove('img-filters__button--active');
    });
  };

  var clearPhotoList = function () {
    var pictureLinkElements = document.querySelectorAll('.picture__link');
    pictureLinkElements.forEach(function (photo) {
      photo.remove();
    });
  };

  var sortFunctions = {
    popular: function (a, b) {
      return b.likes - a.likes;
    },
    discussed: function (a, b) {
      return b.comments.length - a.comments.length;
    },
    random: function () {
      return Math.random() - 0.5;
    }
  };

  var sortPhotosArray = function (photos, sortType) {
    photos = photos.slice();
    var sortFunction = sortFunctions[sortType];
    if (!sortFunction) {
      return photos;
    }

    var sortedPhotos = photos.sort(sortFunction);
    return sortedPhotos;
  };

  var sortPhotos = function (sortType) {
    clearPhotoList();
    var photos = sortPhotosArray(window.list.photos, sortType);
    window.list.renderAllPhotos(photos);
  };

  var setCurrentSortButton = function (button) {
    clearFilterButtonsClasses();
    button.classList.add('img-filters__button--active');
  };

  var getSortTypeByButton = function (button) {
    var sortType = button.id.split('-')[1];
    return sortType;
  };

  var onSortButtonClick = function (evt) {
    window.util.debounce(function () {
      var button = evt.target;
      setCurrentSortButton(button);
      var sortType = getSortTypeByButton(button);
      sortPhotos(sortType);
    });
  };

  var addSortButtonHandlers = function () {
    imageFilterButtonElements.forEach(function (button) {
      button.addEventListener('click', onSortButtonClick);
    });
  };

  addSortButtonHandlers();
})();
