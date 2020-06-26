let logo = document.querySelector(`.header__logo`);
let links = document.querySelector(`.header__links`);

window.addEventListener(`scroll`, function() {
  const windowScroll = window.pageYOffset;
  if (!window.isMobile()) {
    if (windowScroll < 400) {
      logo.style.left =
        window.pageYOffset + 64 - window.pageYOffset * 1.07 + `px`;
      logo.style.top =
        window.pageYOffset + 64 - window.pageYOffset * 1.07 + `px`;
    }
  }
});

$(() => {
  const turn = $(`.header__turn`);
  const headerLinks = $(".header__links");
  const logo = $(`.header__logo`);

  turn.css("transition", "transform 0.1s linear");
  logo.css("transition", "transform 0.1s linear");

  const headerLinksOriginalTop = parseInt(headerLinks.css("top"), 10);
  const headerLinksOriginalRight = parseInt(headerLinks.css("right"), 10);
  const minTop = headerLinksOriginalTop / 2.5;
  const minRight = headerLinksOriginalRight / 2.5;

  const pageHeight = $(document).height();
  const windowHeight = $(window).height();

  window.animateHeaderLinks = function(scrollTop) {
    if (window.isMobile()) {
      return;
    }
    const { right, top } = calculateHeaderLinks(scrollTop);
    headerLinks.css("right", `${right}px`);
    headerLinks.css("top", `${top}px`);
  };

  window.animateLogo = function(lastScroll) {
    const rotate = (lastScroll / (pageHeight - windowHeight)) * 360;
    logo.css("transform", `rotate(${rotate}deg)`);
  };

  window.animateTurn = function(scrollTop) {
    if (window.isMobile()) {
      return;
    }
    const right = calculateTurn(scrollTop);
    turn.css("right", `${right}px`);

    // const headerLinksRightOffset =
    //   windowHeight - headerLinks.offset().left - headerLinks.width();
    // const turnRightOffset = windowHeight - turn.offset().left - turn.width();
    // const moveOffset = Math.max(0, turnRightOffset - headerLinksRightOffset);
    // if (moveOffset > 0) {
    //   turn.css("transform", `translateX(${moveOffset}px)`);
    // }

    // if (!window.isMobile()) {
    //   return;
    // }
  };

  // helpers

  function calculateHeaderLinks(scrollTop) {
    const startOffset = 0;
    const finishOffset = windowHeight / 4;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));

    const top = minTop + (headerLinksOriginalTop - minTop) * (1 - relative);
    const right =
      minRight + (headerLinksOriginalRight - minRight) * (1 - relative);
    return { right, top };
  }

  function calculateTurn(scrollTop) {
    const startOffset = 0;
    const finishOffset = windowHeight / 4;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));

    const right =
      minRight + (headerLinksOriginalRight - minRight) * (1 - relative);
    return right;
  }
});
