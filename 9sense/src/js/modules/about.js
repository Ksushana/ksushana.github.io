(() => {
  const container = document.querySelector(".about");
  const link = document.querySelector(`.about__mobile button`);
  const info = document.querySelector(`.about__container`);
  const close = document.querySelector(`.about__close`);
  // const block = document.querySelector(`.about__block`);

  let containerScale;
  let containerTransition;

  if (window.isMobile()) {
    info.style.opacity = 0;
  }

  const openInfo = () => {
    fixContainer();

    $(info).css("opacity", 1);
    info.classList.add(`about__container--show`);
    $(`body`).css("overflow-y", "hidden");
    window.bodyScrollLock.disableBodyScroll(info);
    info.ontouchmove = function(e) {
      e.preventDefault();
    };
  };

  const closeInfo = () => {
    info.classList.remove(`about__container--show`);
    $(`body`).css("overflow-y", "visible");
    window.bodyScrollLock.enableBodyScroll(info);
    setTimeout(() => $(info).css("opacity", 0), 500);

    setTimeout(() => returnContainer, 500);
    info.ontouchmove = function(e) {
      return true;
    };
  };

  link.addEventListener(`click`, () => {
    window.setTimeout(openInfo, 100);
  });

  close.addEventListener(`click`, () => {
    window.setTimeout(closeInfo, 100);
  });

  // helpers

  function getScale(element) {
    return element.getBoundingClientRect().width / element.offsetWidth;
  }

  function fixContainer() {
    containerTransition = $(container).css("transition");
    $(container).css("transition", "all 0s ease 0s");

    containerScale = getScale(container);
    $(container).css("transform", "none");
  }

  function returnContainer() {
    $(container).css("transition", containerTransition);
    $(container).css("transform", `scale(${containerScale})`);
  }
})();
