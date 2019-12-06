'use strict';

var closeButton = document.querySelector('.product-card__close-outlet');
var outletBlock = document.querySelector('.product-card__outlet');

var closeOutlet = function () {
  outletBlock.classList.add('product-card__outlet--remove');
  // outletBlock.classList.remove('.product-card__outlet--show');
};

closeButton.addEventListener('click', function (evt) {
  evt.preventDefault();
  closeOutlet();
});
