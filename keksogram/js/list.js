'use strict';

(function () {

  var pictureTemplateElement = document.querySelector('#picture').content.querySelector('.picture__link');

  var renderOnePhoto = function (photo) {
    var photoElement = pictureTemplateElement.cloneNode(true);
    photoElement.querySelector('.picture__img').src = photo.url;
    photoElement.querySelector('.picture__stat--likes').textContent = photo.likes;
    photoElement.querySelector('.picture__stat--comments').textContent = photo.comments.length;
    addSmallPhotoClickListener(photoElement, photo);
    return photoElement;
  };

  var addSmallPhotoClickListener = function (element, photo) {
    element.addEventListener('click', function () {
      window.preview.renderBigPhoto(photo);
    });
  };

  var renderAllPhotos = function (photos) {
    var pictureElement = document.querySelector('.pictures');
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < photos.length; i++) {
      fragment.appendChild(renderOnePhoto(photos[i]));
    }
    pictureElement.appendChild(fragment);
  };

  var showFilterElement = function () {
    var filterElement = document.querySelector('.img-filters');
    filterElement.classList.remove('img-filters--inactive');
  };

  var loadSuccess = function (allPhotos) {
    window.list.photos = allPhotos;
    renderAllPhotos(allPhotos);
    showFilterElement();
  };

  var loadError = function (error) {
    window.util.showError(error);
  };

  window.backend.request(window.util.constants.URL_GET, 'GET', null, loadSuccess, loadError);

  window.list = {
    renderAllPhotos: renderAllPhotos,
    pictureTemplate: pictureTemplateElement
  };

})();
