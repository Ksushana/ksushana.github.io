(() => {
  const header = document.querySelector(`.header`);

  if (header) {
    const menu = document.querySelector(`.header__links`);
    const openButton = document.querySelector(`.header__open`);
    const closeButton = document.querySelector(`.header__close`);
    const buttons = $(`.header__links li`);

    let scrollTop;

    const openMenu = () => {
      // scrollTop = window.getScrollTop();
      menu.classList.add(`header__links--show`);
      openButton.classList.add(`header__open--click`);
      closeButton.classList.add(`header__close--show`);
      document.body.style.top = `${-scrollTop}px`;
      $(`body`).css("overflow-y", "hidden");
      window.bodyScrollLock.disableBodyScroll(menu);
    };

    const closeMenu = () => {
      menu.classList.remove(`header__links--show`);
      openButton.classList.remove(`header__open--click`);
      closeButton.classList.remove(`header__close--show`);
      $(`body`).css("overflow-y", "visible");
      window.bodyScrollLock.enableBodyScroll(menu);

      // if (scrollTop) {
      //   window.scroll(0, scrollTop);
      //   scrollTop = null;
      // }

      header.style.transform = ``;
    };

    openButton.addEventListener(`click`, () => {
      window.setTimeout(openMenu, 100);
    });

    closeButton.addEventListener(`click`, () => {
      window.setTimeout(closeMenu, 100);
    });

    buttons.each((_, button) => {
      button.addEventListener(`click`, () => {
        window.setTimeout(closeMenu, 100);
      });
    });
  }
})();

$(function() {
  var $burger = $(".header__open");

  var $menu = $("header__links");

  $burger.click(function() {
    if ($menu.hasClass("active")) {
      $menu.slideDown("normal").removeClass("active");
    } else {
      $menu.slideUp("normal").addClass("active");
    }
  });
});
