'use strict';

var buttons = $('.archive__button-link');

var buttonsList = $('.archive__buttons-list');
var archiveLists = $('.archive__list');

buttonsList.on('click', 'a', function (evt) {
  evt.preventDefault();
  buttons.removeClass('archive__button-link--selected');
  $(this).addClass('archive__button-link--selected');
  var currentType = $(this).attr('data-type');
  archiveLists.removeClass('archive__list--open');
  var currentList = archiveLists.filter(function () {
    return $(this).attr('data-type') === currentType;
  });
  currentList.addClass('archive__list--open');
})
