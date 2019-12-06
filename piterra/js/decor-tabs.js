'use strict';

(function ($) {
  // Открытие первой директории каталога по умолчанию
  var catalogList = $('.decor-catalog__directories > .decor-catalog__list');
  var firstCatalogItem = catalogList.children().first();
  var rootFolder = firstCatalogItem.find('.decor-catalog__item--folder');
  var firstDirectoryRoot = firstCatalogItem.find('.decor-catalog__item-name--directory');
  var firstDirectoryfolder = firstCatalogItem.find('.decor-catalog__item-name--folder');
  firstDirectoryRoot.toggleClass('decor-catalog__item-name--directory--rotate');
  firstDirectoryfolder.toggleClass('decor-catalog__item-name--directory--rotate');

  rootFolder.toggleClass('decor-catalog__item--folder--open');
  var folder = firstCatalogItem.find('.decor-catalog__item--item');
  folder.toggleClass('decor-catalog__item--item--open');


  // Обработчики событий на папках
  var buttonDirectory = $('.decor-catalog__item-name--directory');
  buttonDirectory.on('click', function () {
    $(this).toggleClass('decor-catalog__item-name--directory--rotate');
    var parentRoot = $(this).closest('li.decor-catalog__item');
    var childrenRoot = parentRoot.find('.decor-catalog__item--folder');
    childrenRoot.toggleClass('decor-catalog__item--folder--open');
  });

  var buttonRoot = $('.decor-catalog__item-name--folder');
  buttonRoot.on('click', function () {
    var parent = $(this).closest('li.decor-catalog__item--folder');
    $(this).toggleClass('decor-catalog__item-name--directory--rotate');
    var item = parent.find('.decor-catalog__item--item');
    item.toggleClass('decor-catalog__item--item--open');
  });
})(window.jQuery);
