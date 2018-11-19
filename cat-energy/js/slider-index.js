var sliderControlFat = document.querySelector(".slider__control--fat");
var sliderControlSlim = document.querySelector(".slider__control--slim");
var slideFat = document.querySelector(".slider__slide--fat");
var slideSlim = document.querySelector(".slider__slide--slim");
var sliderValue = document.querySelector(".slider__range-value");

var changeOnFat = function () {
  slideSlim.classList.add("visually-hidden");
  slideFat.classList.remove("visually-hidden");
  sliderValue.classList.add("slider__range-value--fat");
  sliderValue.classList.remove("slider__range-value--slim");
}

var changeOnSlim = function () {
  slideSlim.classList.remove("visually-hidden");
  slideFat.classList.add("visually-hidden");
  sliderValue.classList.add("slider__range-value--slim");
  sliderValue.classList.remove("slider__range-value--fat");
}


var onFatClick = function () {
  changeOnFat();
}

var onSlimClick = function () {
  changeOnSlim();
}

sliderControlFat.addEventListener("click", onFatClick);
sliderControlSlim.addEventListener("click", onSlimClick);
