'use strict';

(function ($) {
  var openImageButton = $('.catalog-item__open-button');
  var selectedImage = $('.catalog-item__image');
  var selectedImageContainer = $('.catalog-item__image-wrapper');
  var closeImageButton = $('.catalog-item__close-button');
  var selectedImageNameContainer = $('.catalog-item__image-text');

  var removeOpenClass = function () {
    selectedImageContainer.removeClass('catalog-item__image-wrapper--open');
    closeImageButton.off('click', removeOpenClass);
  };

  openImageButton.on('click', function () {
    var currentImageLink = $(this).find('.catalog-item__image-preview').attr('src');
    var currentImageName = $(this).parent().find('.catalog-item__table-text--name').text().split(' ')[1];
    var currentImageType = $(this).parent().find('.catalog-item__table-first-column').text();
    selectedImageNameContainer.text(currentImageType + '_' + currentImageName);


    selectedImageContainer.addClass('catalog-item__image-wrapper--open');
    selectedImage.attr({src: currentImageLink});
    closeImageButton.on('click', removeOpenClass);
  });
})(window.jQuery);

