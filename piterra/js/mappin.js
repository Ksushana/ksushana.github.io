/* eslint-disable no-undef */
'use strict';

ymaps.ready(function () {
  var myMap = new ymaps.Map(
      'shopMap',
      {
        center: [59.953164, 30.263011],
        zoom: 9
      }, {
        searchControlProvider: 'yandex#search'
      }
  );

  var myPlacemark = new ymaps.Placemark(myMap.getCenter(), {
    hintContent: 'Салон Piterra Home',
  }, {
    // Опции.
    // Необходимо указать данный тип макета.
    iconLayout: 'default#image',
    // Своё изображение иконки метки.
    iconImageHref: 'img/icons/icon-pin.svg',
    // Размеры метки.
    iconImageSize: [30, 42],
    // Смещение левого верхнего угла иконки относительно
    // её "ножки" (точки привязки).
    iconImageOffset: [-5, -38]
  });

  var myPlacemark2 = new ymaps.Placemark([559.840655, 30.317530], {
    hintContent: 'Магазин&Склад «Пулково»',
  }, {
    iconLayout: 'default#image',
    iconImageHref: 'img/icons/icon-pin.svg',
    iconImageSize: [30, 42],
    iconImageOffset: [-5, -38]
  });

  myMap.geoObjects
    .add(myPlacemark)
    .add(myPlacemark2);
});
