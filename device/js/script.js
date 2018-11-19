var ESC = 27;

var contactsOpenButton = document.querySelector(".contacts--button");
var contactsForm = document.querySelector(".overlay-write");
var close = document.querySelector(".pop-up-close");
var overlay = document.querySelector(".fixed-overlay");
var popUp = document.querySelector(".pop-up");
var form = contactsForm.querySelector(".pop-up__form");

var isStorageSupport = true;
var storage = "";

try {
  storage = localStorage.getItem("name");
}
catch (err) {
  isStorageSupport = false;
}

var cleanErrors = function () {
  var name = contactsForm.querySelector("[name=user-name]");
  var email = contactsForm.querySelector("[name=e-mail]");
  popUp.classList.remove("modal-error");
  name.classList.remove("input-error");
  email.classList.remove("input-error");
}

var showModal = function () {
  contactsForm.classList.add("modal-show");
  contactsForm.classList.add("modal-appear");
  cleanErrors();
}

var closeModal = function () {
  contactsForm.classList.remove("modal-show");
  contactsForm.classList.remove("modal-appear");
}

contactsOpenButton.addEventListener("click", function (evt) {
  evt.preventDefault();
  showModal();

  var name = contactsForm.querySelector("[name=user-name]");
  var email = contactsForm.querySelector("[name=e-mail]");

  if (storage) {
    name.value = storage;
    email.focus();
  }
  else {
    name.focus();
  }
});


close.addEventListener("click", function (evt) {
  evt.preventDefault();
  closeModal();
});

form.addEventListener("submit", function (evt) {
  var name = contactsForm.querySelector("[name=user-name]");
  var email = contactsForm.querySelector("[name=e-mail]");
  cleanErrors();

  if (!name.value || !email.value) {
    evt.preventDefault();
    if (!name.value) {
      contactsForm.offsetWidth = contactsForm.offsetWidth;
      name.classList.add("input-error");
      popUp.classList.add("modal-error");
    }

    if (!email.value) {
      contactsForm.offsetWidth = contactsForm.offsetWidth;
      email.classList.add("input-error");
      popUp.classList.add("modal-error");
    }


  }
  else {
    if (isStorageSupport) {
      localStorage.setItem("name", name.value);
    }
  }
});

window.addEventListener("keydown", function (evt) {
  if (evt.keyCode === ESC) {
    if (contactsForm.classList.contains("modal-show")) {
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


var map = document.querySelector(".map-open");
var bigMap = document.querySelector(".overlay-map");
var mapCloseButton = document.querySelector(".map-close");

var showMap = function () {
  bigMap.classList.add("modal-show");
  bigMap.classList.add("modal-appear");
}

var closeMap = function () {
  bigMap.classList.remove("modal-show");
  bigMap.classList.remove("modal-appear");
}

map.addEventListener("click", function (evt) {
  evt.preventDefault();
  showMap();
});


mapCloseButton.addEventListener("click", function (evt) {
  evt.preventDefault();
  closeMap();
});

window.addEventListener("keydown", function (evt) {
  if (evt.keyCode === ESC) {
    if (bigMap.classList.contains("modal-show")) {
      evt.preventDefault();
      closeMap();
    }
  }
});

bigMap.addEventListener("click", function (evt) {
  if (evt.target === bigMap) {
    closeMap();
  }
});

// Slider 

var sliderControls = document.querySelector(".slider-controls");
var sliderNodes = Array.prototype.slice.call(sliderControls.children);
var slides = document.querySelectorAll(".slider-slide");

var changeSlide = function (number) {
  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];
    slide.classList.add("visually-hidden");
  }

  var selectedSlide = slides[number];
  selectedSlide.classList.remove("visually-hidden");
};

var sliderButtons = document.querySelectorAll(".slider-control");
for (var i = 0; i < sliderButtons.length; i++) {
  var sliderButton = sliderButtons[i];
  sliderButton.addEventListener("click", function (evt) {
    var clickedButton = evt.target;
    var index = sliderNodes.indexOf(clickedButton);
    changeSlide(index);
  });
}


// SMALL SLIDER

var smallSliderControls = document.querySelector(".small-slider-controls");
var smallSliderNodes = Array.prototype.slice.call(smallSliderControls.children);
var smallSlides = document.querySelectorAll(".services--info");
var smallSliderButtons = document.querySelectorAll(".small-slider-control");

var changeSmallSlide = function (number) {
  for (var i = 0; i < smallSlides.length; i++) {
    var slide = smallSlides[i];
    slide.classList.add("visually-hidden");
    var button = smallSliderButtons[i];
    button.classList.remove("small-slider-control__active");
  }

  var selectedSlide = smallSlides[number];
  selectedSlide.classList.remove("visually-hidden");
};

var onSlideCLick = function (evt) {
  var clickedButton = evt.target;
  var index = smallSliderNodes.indexOf(clickedButton);
  changeSmallSlide(index);
  clickedButton.classList.add("small-slider-control__active");
}

for (var i = 0; i < smallSliderButtons.length; i++) {
  var smallSliderButton = smallSliderButtons[i];
  smallSliderButton.addEventListener("click", onSlideCLick);
}