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
