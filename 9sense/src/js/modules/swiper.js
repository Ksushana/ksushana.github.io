(() => {
  const slider = document.querySelector(`.slider-container`);
  const sliderCaption = slider.querySelector(".slider__caption");

  if (slider) {
    new Swiper(slider, {
      navigation: {
        nextEl: `.slider-next`,
        prevEl: `.slider-prev`
      },
      slidesPerView: 1,
      slidesPerColumn: 1,
      spaceBetween: 0,
      loop: true,
      pagination: {
        el: `.swiper-pagination`,
        type: `bullets`,
        clickable: true
      },
      on: {
        slideChange: function() {
          changeCaption(this);
        }
      }
    });
  }

  function changeCaption(swiper) {
    const currentSlide = swiper.slides[swiper.activeIndex];
    const image = currentSlide.querySelector("img");
    const captionText = image.alt;
    sliderCaption.textContent = captionText;
  }
})();
