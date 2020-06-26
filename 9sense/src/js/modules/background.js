(() => {
  const body = document.querySelector(`body`);
  const text = document.querySelector(`.text-block--tech`);
  const logo = document.querySelector(`.header__logo`);
  const menu = document.querySelector(`.header__links ul`);
  const turn = document.querySelector(`.header__turn`);
  const lang = document.querySelector(`.header__lang`);
  const shadow = document.querySelector(`.shadow`);
  const textBlockTech = $(".text-block--tech");
  const aboutText = document.querySelector(`.about__mobile p`);
  const headerOpen = document.querySelector(`.header__open`);

  const windowHeight = $(window).height();

  function dark() {
    body.classList.add(`dark`);
    text.classList.add(`dark`);
    logo.classList.add(`dark`);
    turn.classList.add(`dark`);

    aboutText.classList.add(`dark`);
    shadow.classList.add(`show`);
    headerOpen.classList.add(`dark`);

    if (!window.isMobile()) {
      menu.classList.add(`dark`);
      lang.classList.add(`dark`);
    }
  }

  function light() {
    body.classList.remove(`dark`);
    text.classList.remove(`dark`);
    logo.classList.remove(`dark`);
    turn.classList.remove(`dark`);

    aboutText.classList.remove(`dark`);
    shadow.classList.remove(`show`);
    headerOpen.classList.remove(`dark`);

    if (!window.isMobile()) {
      menu.classList.remove(`dark`);
      lang.classList.remove(`dark`);
    }
  }

  window.animateBackground = function(lastScroll) {
    const breakpoint =
      textBlockTech.offset().top +
      textBlockTech.height() / 2 -
      windowHeight / 2;
    const current = lastScroll;
    if (current > breakpoint) {
      dark();
    } else {
      light();
    }
  };
})();
