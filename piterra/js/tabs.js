'use strict';

(function () {
  var tabs = document.querySelectorAll('.history__tab');
  var tabPages = document.querySelectorAll('.history__page');

  [].forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var prevActiveTab = document.querySelector('.history__tab--active');
      var prevActivePage = document.querySelector('.history__page--active');

      prevActiveTab.classList.remove('history__tab--active');
      prevActivePage.classList.remove('history__page--active');

      var currentTab = tab;
      var currentPage = tabPages[i];

      currentTab.classList.add('history__tab--active');
      currentPage.classList.add('history__page--active');
    });
  });
})();

// Переключение табов в карточке товара

(function () {
  var getIsMobile = function () {
    if (!document.body.clientWidth) {
      return false;
    }
    return document.body.clientWidth < 768;
  };

  if (getIsMobile()) {
    return;
  }

  var tabs = document.querySelectorAll('.product-card__tab');
  var tabPages = document.querySelectorAll('.product-card__item');

  [].forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var prevActiveTab = document.querySelector('.product-card__tab--active');
      var prevActivePage = document.querySelector('.product-card__item--active');

      prevActiveTab.classList.remove('product-card__tab--active');
      prevActivePage.classList.remove('product-card__item--active');

      var currentTab = tab;
      var currentPage = tabPages[i];

      currentTab.classList.add('product-card__tab--active');
      currentPage.classList.add('product-card__item--active');
    });
  });
})();

// ПЕРЕКЛЮЧЕНИЕ ТАБОВ КАЛЬКУЛЯТОРА

(function () {
  var tabs = document.querySelectorAll('.calculator__tab');
  var tabPages = document.querySelectorAll('.calculator__item');

  [].forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var prevActiveTab = document.querySelector('.calculator__tab--active');
      var prevActivePage = document.querySelector('.calculator__item--active');

      prevActiveTab.classList.remove('calculator__tab--active');
      prevActivePage.classList.remove('calculator__item--active');

      var currentTab = tab;
      var currentPage = tabPages[i];

      currentTab.classList.add('calculator__tab--active');
      currentPage.classList.add('calculator__item--active');
    });
  });
})();


// ПЕРЕКЛЮЧЕНИЕ ТАБОВ КАЛЬКУЛЯТОРА В МОБИЛЬНОЙ КАРТОЧКЕ ТОВАРА

(function () {
  var tabs = document.querySelectorAll('.pc-calc__tab');
  var tabPages = document.querySelectorAll('.pc-calc__item');

  [].forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var prevActiveTab = document.querySelector('.pc-calc__tab--active');
      var prevActivePage = document.querySelector('.pc-calc__item--active');

      prevActiveTab.classList.remove('pc-calc__tab--active');
      prevActivePage.classList.remove('pc-calc__item--active');

      var currentTab = tab;
      var currentPage = tabPages[i];

      currentTab.classList.add('pc-calc__tab--active');
      currentPage.classList.add('pc-calc__item--active');
    });
  });
})();

// ПЕРЕКЛЮЧЕНИЕ ТАБОВ ТОВАРА В НАЛИЧИИ В МОБИЛЬНОЙ КАРТОЧКЕ ТОВАРА

(function () {
  var tabs = document.querySelectorAll('.pc-instock__tab');
  var tabPages = document.querySelectorAll('.pc-instock__item');

  [].forEach.call(tabs, function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var prevActiveTab = document.querySelector('.pc-instock__tab--active');
      var prevActivePage = document.querySelector('.pc-instock__item--active');

      prevActiveTab.classList.remove('pc-instock__tab--active');
      prevActivePage.classList.remove('pc-instock__item--active');

      var currentTab = tab;
      var currentPage = tabPages[i];

      currentTab.classList.add('pc-instock__tab--active');
      currentPage.classList.add('pc-instock__item--active');
    });
  });
})();
