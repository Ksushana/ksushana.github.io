'use strict';

(function () {

  var SOCIAL_PICTURE_SRC_MIN = 1;
  var SOCIAL_PICTURE_SRC_MAX = 6;

  // BIG PHOTO//

  var bigPhotoElement = document.querySelector('.big-picture');
  var bigPhotoCloseButtonElement = bigPhotoElement.querySelector('.big-picture__cancel');

  var onFotoEscPress = function (evt) {
    if (evt.keyCode === window.util.constants.ESC) {
      closeBigPhoto();
    }
  };

  var showBigPhoto = function () {
    bigPhotoElement.classList.remove('hidden');
    document.addEventListener('keydown', onFotoEscPress);
  };

  var renderOneComment = function (comment) {
    var commentTemplateElement = document.querySelector('#comment-template').content.querySelector('.social__comment');
    var commentListElement = commentTemplateElement.cloneNode(true);
    var srcNumber = window.util.getRandomInteger(SOCIAL_PICTURE_SRC_MAX, SOCIAL_PICTURE_SRC_MIN);
    commentListElement.querySelector('.social__comment--content').textContent = comment;
    commentListElement.querySelector('.social__picture').src = 'img/avatar-' + srcNumber + '.svg';
    return commentListElement;
  };

  var renderComments = function (comments) {
    var commentsElement = document.querySelector('.social__comments');
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < comments.length; i++) {
      var commentListElement = renderOneComment(comments[i]);
      fragment.appendChild(commentListElement);
    }
    commentsElement.innerHTML = '';
    commentsElement.appendChild(fragment);
  };

  var onBigPhotoCloseButtonClick = function () {
    closeBigPhoto();
  };

  var closeBigPhoto = function () {
    bigPhotoElement.classList.add('hidden');
    bigPhotoCloseButtonElement.removeEventListener('click', onBigPhotoCloseButtonClick);
    document.removeEventListener('keydown', onFotoEscPress);
  };

  var commentsCountElement = bigPhotoElement.querySelector('.social__comment-count');
  var commentsLoadmoreElement = bigPhotoElement.querySelector('.social__comment-loadmore');

  var renderBigPhoto = function (photo) {
    var avatarNumber = window.util.getRandomInteger(SOCIAL_PICTURE_SRC_MAX, SOCIAL_PICTURE_SRC_MIN);
    var description = photo.comments.shift();
    showBigPhoto();
    bigPhotoElement.querySelector('.big-picture__img img').src = photo.url;
    bigPhotoElement.querySelector('.likes-count').textContent = photo.likes;
    bigPhotoElement.querySelector('.social__picture').src = 'img/avatar-' + avatarNumber + '.svg';
    bigPhotoElement.querySelector('.social__caption').textContent = description;
    bigPhotoElement.querySelector('.comments-count').textContent = photo.comments.length;
    renderComments(photo.comments);
    commentsCountElement.classList.add('visually-hidden');
    commentsLoadmoreElement.classList.add('visually-hidden');
    bigPhotoCloseButtonElement.addEventListener('click', onBigPhotoCloseButtonClick);
  };

  window.preview = {
    renderBigPhoto: renderBigPhoto
  };
})();
