var ESC = 27;

var overlay = document.querySelector(".fixed-overlay");
var popUp = document.querySelector(".pop-up");
var sert = document.querySelector(".skill__item-photo");
var serificate = document.querySelector(".overlay-sert");

var showModal = function () {
  serificate.classList.add("modal-show");
}

var closeModal = function () {
  serificate.classList.remove("modal-show");
}

sert.addEventListener("click", function (evt) {
  evt.preventDefault();
  showModal();
});

window.addEventListener("keydown", function (evt) {
  if (evt.keyCode === ESC) {
    if (serificate.classList.contains("modal-show")) {
      evt.preventDefault();
      closeModal();
    }
  }
});

overlay.addEventListener("click", function (evt) {
  if (evt.target === overlay) {
    closeModal();
  }
});