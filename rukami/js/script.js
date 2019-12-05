(() => {
  window.addEventListener(`load`, () => {
    document.querySelector(`main`).classList.add(`loaded`);

    let loader = document.querySelector(`.loader`);

    if (loader) {
      window.setTimeout(() => {
        loader.classList.add(`hiding`);
      }, 600);

      window.setTimeout(() => {
        document.body.classList.add(`animated`);
      }, 1300);

      window.setTimeout(() => {
        loader.classList.remove(`hiding`);
        loader.classList.add(`hidden`);
      }, 2000);

      window.setTimeout(() => {
        document.body.classList.remove(`animated`);
      }, 4000);
    }
  });

  window.initPages = () => {
    let mainPage = document.querySelector(`.main`);
    let short = document.querySelector(`.page-short`);
    let about = document.querySelector(`.about-short`);
    let notFound = document.querySelector(`.page-404`);

    if (mainPage) {
      document.body.classList.add(`is-main`);
    }

    if (short) {
      document.body.classList.add(`has-short`);
    }

    if (about) {
      document.body.classList.add(`is-about`);
    }

    if (notFound) {
      document.body.classList.add(`is-404`);
    }
  };
})();

window.getLinkStatus = (link) => {
  let url = link.getAttribute(`href`);

  if (url) {
    if (url === `#more`) {
      return `more`;
    } else if (url.startsWith(`#`)) {
      return `section`;
    } else if (link.target || url.startsWith(`http:`) || url.startsWith(`https:`) ||
        url.startsWith(`mailto:`) || url.startsWith(`tel:`)) {
      return `external`;
    } else if (link.hasAttribute(`data-popup`)) {
      return `popup`;
    }

    return `page`;
  }

  return false;
};

window.getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop;

(() => {
  const STATES = {
    mouse: `is-mouse`,
    key: `is-key`,
    touch: `is-touch`
  };

  document.addEventListener(`mousedown`, () => {
    document.body.classList.add(STATES.mouse);
    document.body.classList.remove(STATES.key);
  });

  document.addEventListener(`touchstart`, () => {
    document.body.classList.add(STATES.touch);
    document.body.classList.remove(STATES.mouse);

    window.isTouch = true;
  });

  document.addEventListener(`keydown`, () => {
    document.body.classList.add(STATES.key);
    document.body.classList.remove(STATES.mouse);
  });

  window.addEventListener(`resize`, () => {
    document.body.classList.remove(STATES.touch);
    document.body.classList.remove(STATES.key);

    window.isTouch = false;
  });
})();

(() => {
  let parser = new window.DOMParser();
  window.currentPage = location.href;
  window.history.replaceState({
    pageName: window.currentPage,
    popup: false
  }, ``, window.currentPage);

  let pages = {};

  const runJS = () => {
    window.Sharer.init();
    window.initPages();
    window.initMenu();
    window.initNavBullet();
    window.initScroll();
    window.initPartnersSlider();
    window.initTracks();
    window.initHeadlinerSlider();
    window.initProgram();
    //window.initFaq();
    window.initPopup();
    window.initBuyings();
    window.initValidation();
    window.initBlackhole();
    window.initGrid();
    window.initFilters();
    window.initLastTimeSlider();
    window.initSimilarSlider();
    window.initAdvantagesSlider();
    // window.initNewsMasonry();
  };

  window.addEventListener(`load`, runJS);

  const loadHTML = (pageName, callback) => {
    if (pages[pageName]) {
      callback(pageName, ``);
      return;
    }

    let xhr = new XMLHttpRequest();

    xhr.overrideMimeType(`application/json`);

    xhr.addEventListener(`load`, () => {
      if (xhr.status === 200) {
        callback(pageName, xhr.responseText);
      }

      if (xhr.status === 404) {
        loadHTML(`404`, callback);
      }
    });

    xhr.open(`GET`, pageName, true);
    xhr.setRequestHeader(`x-requested-with`, `XMLHttpRequest`);
    xhr.send();
  };

  const replaceHTML = (pageName, htmlResponse) => {
    if (!htmlResponse && !pages[pageName]) {
      return;
    }

    let oldPage = document.documentElement;
    let oldHead = document.querySelector(`head`);
    let oldBody = document.querySelector(`body`);
    let oldLoader = document.querySelector(`.loader`);

    window.setTimeout(() => {
      oldBody.classList.add(`old`);
      oldLoader.classList.add(`hidden`);
      oldLoader.classList.add(`moving-in`);
    }, 100);

    window.setTimeout(() => {
      if (htmlResponse) {
        let newPage = parser.parseFromString(htmlResponse, `text/html`);
        let newHead = newPage.querySelector(`head`);
        let newBody = newPage.querySelector(`body`);

        document.documentElement.appendChild(newHead);

        let bodyEl = document.createElement(`body`);
        bodyEl.style.display = `none`;
        bodyEl.innerHTML = newBody.innerHTML;

        document.documentElement.appendChild(bodyEl);
      } else {
        document.documentElement.appendChild(pages[pageName].head);
        document.documentElement.appendChild(pages[pageName].body);
      }

      let body = document.querySelector(`body:nth-of-type(2)`);
      let main = body.querySelector(`main`);
      let loader = body.querySelector(`.loader`);

      main.style = ``;
      main.classList = ``;
      main.classList.add(`loaded`);
      loader.classList.add(`hidden`);
      loader.classList.add(`moving-in`);
      body.style.display = ``;
      body.classList.remove(`full-shown`);
      body.classList.remove(`menu-opened`);

      window.setTimeout(() => {
        oldLoader.classList.remove(`moving-in`);
        oldBody.classList.remove(`old`);

        pages[window.currentPage] = {
          head: oldPage.removeChild(oldHead),
          body: oldPage.removeChild(oldBody)
        };

        window.currentPage = pageName;
        runJS();
        window.scrollTo(0, 0);

        loader.classList.remove(`moving-in`);
        loader.classList.add(`moving-out`);
        document.body.classList.add(`animated`);
      }, 700);

      window.setTimeout(() => {
        loader.classList.remove(`moving-out`);
      }, 1300);

      window.setTimeout(() => {
        document.body.classList.remove(`animated`);
      }, 4000);
    }, 300);
  };

  const setPopup = (popupName, htmlResponse) => {
    if (htmlResponse) {
      let popup = parser.parseFromString(htmlResponse, `text/html`);
      let popupContent = popup.querySelector(`.popup`);
      let popupWindow = document.querySelector(`.popup-container`);

      if (popupWindow && popupContent) {
        let popupWindowContent = popupWindow.querySelector(`.popup`);

        if (popupWindowContent) {
          popupWindow.removeChild(popupWindowContent);
        }

        popupWindowContent = document.createElement(`div`);
        popupWindowContent.classList.add(`popup`);
        popupWindowContent.innerHTML = popupContent.innerHTML;

        popupWindow.appendChild(popupWindowContent);
        popupWindow.classList.remove(`closed`);
      }
    }
  };

  document.addEventListener(`click`, (evt) => {
    let link = evt.target;
    let status = window.getLinkStatus(link);
    let pageName = link.href;

    if (status) {
      if (status === `external`) {
        return;
      }

      evt.preventDefault();

      if (status === `popup`) {
        loadHTML(pageName, setPopup);
        window.history.replaceState({
          pageName,
          popup: true
        }, ``, pageName);
      } else if (status === `page` && pageName !== window.currentPage) {
        loadHTML(pageName, replaceHTML);
        window.history.pushState({
          pageName,
          popup: false
        }, ``, pageName);
      }
    }
  }, true);

  window.addEventListener(`popstate`, (evt) => {
    if (evt.state && evt.state.pageName) {
      if (evt.state.popup) {
        loadHTML(evt.state.pageName, setPopup);
      } else {
        loadHTML(evt.state.pageName, replaceHTML);
      }

      document.body.classList.remove(`menu-opened`);
    }
  });
})();

(function () {

  window.initBlackhole = () => {

    let page404 = document.querySelector(`.page-404`);
    if (!page404) {
      return;
    }
    let btn = page404.querySelector(`.page-404__btn`);
    let blackHole = page404.querySelector(`.page-404__collapsar svg`);

    let blackHoleBlock = page404.querySelector(`.page-404__collapsar`);

    const w = screen.width;
    const defaultSize = 52;

    function getCoords(top, height) {
      let centerH = Math.round(height / 2);
      let curve = centerH - top;
      let h = curve * 2 + height;
      let number = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));

      return number;
    }

    function btnAnimation(startOp, endOp, startPos, endPos, bool, cursor) {
      let animation = btn.animate([
        {
          top: startPos + `%`,
          opacity: startOp,
        }, {
          top: endPos + `%`,
          opacity: endOp,
        }
      ], {
        duration: 300,
        fill: `forwards`
      });

      animation.addEventListener(`finish`, function () {
        btn.style = `top: ` + endPos + `%; opacity: ` + endOp + `; cursor: ` + cursor;
        btn.disabled = bool;
      });
    }

    function holeExpand(size) {
      let animation = blackHole.animate([
        {
          width: defaultSize + `px`,
          height: defaultSize + `px`
        }, {
          width: size + `px`,
          height: size + `px`
        }
      ], {
        duration: 20000,
        fill: `forwards`
      });

      animation.addEventListener(`finish`, function () {
        blackHole.style = `width: ` + size + `px; height: ` + size + `px;`;
        let cursor = `pointer`;
        btnAnimation(0, 1, 90, 50, false, cursor);
      });
    }

    function holeCollapse(size) {
      let animation = blackHole.animate([
        {
          width: size + `px`,
          height: size + `px`
        }, {
          width: defaultSize + `px`,
          height: defaultSize + `px`
        }
      ], {
        duration: 500,
        fill: `forwards`
      });

      animation.addEventListener(`finish`, function () {
        blackHole.style = `width: ` + defaultSize + `px; height: ` + defaultSize + `px;`;
      });
    }

    if (window.matchMedia(`(max-width: 767px)`).matches) {
      let topBlackHole = blackHole.getBoundingClientRect().top;
      let hMobile = page404.offsetHeight;
      let hypotenuse = getCoords(topBlackHole, hMobile);

      setTimeout(() => {
        holeExpand(hypotenuse);
      }, 5000);

      btn.addEventListener(`click`, function () {
        let cursor = `default`;
        btnAnimation(1, 0, 50, 90, true, cursor);

        setTimeout(() => {
          holeCollapse(hypotenuse);
        }, 500);

        setTimeout(() => {
          holeExpand(hypotenuse);
        }, 3000);
      });
    } else {
      let screenHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName(`body`)[0].clientHeight;
      let topBlackHole = blackHoleBlock.getBoundingClientRect().top;
      let hypotenuse = getCoords(topBlackHole, screenHeight);

      setTimeout(() => {
        holeExpand(hypotenuse);
      }, 5000);

      btn.addEventListener(`click`, function () {
        let cursor = `default`;
        btnAnimation(1, 0, 50, 90, true, cursor);

        setTimeout(() => {
          holeCollapse(hypotenuse);
        }, 300);

        setTimeout(() => {
          holeExpand(hypotenuse);
        }, 3000);
      });
    }
  };
})();

(function () {
  window.initBuyings = () => {

    let buyingSection = document.querySelector(`.buying`);
    let main = document.querySelector(`main`);

    if (!buyingSection) {
      return;
    }

    let table = buyingSection.querySelector(`.buying__table`);
    let tableBody = table.querySelector(`tbody`);
    let tableRows = table.querySelectorAll(`tr`);
    let tableCells = table.querySelectorAll(`td`);
    let tableRow1 = table.querySelector(`tr:first-of-type`);
    let columnHeads = tableRow1.querySelectorAll(`th`);
    let headerNav = document.querySelector(`.main-nav`);
    let header = document.querySelector(`.header`);

    window.addEventListener(`load`, function () {
      table.setAttribute(`role`, `grid`);
      tableBody.setAttribute(`role`, `rowgroup`);

      [].forEach.call(tableRows, function (tableRow) {
        tableRow.setAttribute(`role`, `row`);
      });

      [].forEach.call(columnHeads, function (columnHead) {
        columnHead.setAttribute(`role`, `rowheader gridcell`);
      });

      [].forEach.call(tableCells, function (tableCell) {
        tableCell.setAttribute(`role`, `gridcell`);
      });

    });

    if (window.matchMedia(`(min-width: 768px)`).matches) {
      main.addEventListener(`scroll`, function () {
        let topSection = table.offsetTop;
        let scrollTop = main.pageYOffset || main.scrollTop;
        if (scrollTop >= topSection) {
          tableRow1.classList.add(`fixed`);
          header.classList.add(`hiddenTrack`);
          headerNav.classList.add(`hiddenTrack`);
        } else {
          tableRow1.classList.remove(`fixed`);
          header.classList.remove(`hiddenTrack`);
          headerNav.classList.remove(`hiddenTrack`);
        }
      }, {
        passive: true
      });
    }
  };
})();

(function () {

  let faq = document.querySelector(`.faq`);
  if (!faq) {
    return;
  }
  
  document.addEventListener(`click`, (evt) => {
    let btn;

    if (evt.target.classList.contains(`faq__question`)) {
      btn = evt.target;
    } else if (evt.target.parentElement.classList.contains(`faq__question`)) {
      btn = evt.target.parentElement;
    }

    if (btn) {
      let block = btn.parentElement;
      let answer = block.querySelector(`.faq__answer`);

      if (block.classList.contains(`faq__block--opened`)) {
        answer.classList.add(`fade-in`);
        answer.classList.remove(`fade-out`);

        setTimeout(() => {
          block.classList.remove(`faq__block--opened`);
        }, 300);
      } else {
        block.classList.add(`faq__block--opened`);
        answer.classList.add(`fade-out`);

        setTimeout(() => {
          answer.classList.remove(`fade-in`);

        }, 100);
      }
    }
  }, true);
})();

(function () {

  window.initFilters = () => {
    let filter = document.querySelector(`.filter`);

    if (!filter) {
      return;
    }

    let filterBtns = filter.querySelectorAll(`.filter__btn`);
    let filterSelectBtns = filter.querySelectorAll(`.filter__list button`);

    let sortContainer = document.querySelector(`.announcement`);
    let sortTitle = document.querySelector(`.announcement__title`);
    let sortBlocks = sortContainer.querySelectorAll(`.announcement__block`);
    let sortClasses = [`region`, `exchange`, `all`];


    [].forEach.call(sortBlocks, function (block) {
      block.classList.add(`select1`);
      block.classList.add(`select2`);
    });

    // Анимация кнопок селектов при открытии списка селект
    function animateSelectBtns() {
      [].forEach.call(filterBtns, function (it) {
        let btns = it.nextElementSibling.querySelectorAll(`.filter__list button`);

        [].forEach.call(btns, function (btn) {
          btn.classList.remove(`change`);
        });

        setTimeout(() => {
          for (let i = 0; i < btns.length; i++) {
            btns[i].classList.add(`change`);
            btns[i].style.animationDelay = ((i + 1) / 10) + `s`;
          }
        }, 100);
      });
    }

    // Функция удаления класса checked у кнопок списка селекта
    function deleteChecked(item) {
      let selectBtns = item.parentNode.querySelectorAll(`button`);
      [].forEach.call(selectBtns, function (el) {
        el.classList.remove(`checked`);
      });
    }

    // Клик на кнопку фильтров - открытие списка селект
    function onFilterBtnsClick(e) {
      [].forEach.call(filterBtns, function (it) {
        it.classList.remove(`opened`);

        if (it === e.target || it === e.currentTarget) {
          it.parentNode.classList.toggle(`opened`);
          it.classList.add(`opened`);
        } else {
          it.parentNode.classList.remove(`opened`);
        }
      });

      animateSelectBtns();
    }

    // Клик на кнопку - выбор селекта из списка и закрытие списка
    function onFilterSelectBtnsClick(e) {
      [].forEach.call(filterSelectBtns, function (it) {

        if (it === e.target || it === e.currentTarget) {
          let btn = it.parentNode.parentNode.previousElementSibling;
          let btnTab = Number(it.getAttribute(`data-tab`));
          let btnBlockTab = Number(btn.parentNode.getAttribute(`data-tab`));

          btn.textContent = it.textContent;
          btn.setAttribute(`data-tab`, btnTab);
          deleteChecked(it);
          it.classList.add(`checked`);
          btn.parentNode.classList.remove(`opened`);
          sortContainer.classList.add(`change`);

          // Анимация на смене заголовка
          if (btnBlockTab === 1) {
            sortTitle.classList.add(`change`);
          }
          // Функция смены заголовка
          setTimeout(() => {
            if (btnBlockTab === 1) {
              for (let i = 0; i < sortClasses.length; i++) {
                sortTitle.classList.remove(sortClasses[i]);

                if (btnTab === (i + 1)) {
                  sortTitle.classList.add(sortClasses[btnTab - 1]);
                }
              }
            }
          }, 300);
          // Смена блоков
          setTimeout(() => {
            // Блок 1 - смена событий
            if (btnBlockTab === 1) {
              [].forEach.call(sortBlocks, function (block) {
                block.classList.add(`hidden`);
                // Открыть все пункты
                if (btnTab === 3) {
                  block.classList.add(`select1`);
                  if (filterBtns[1].getAttribute(`data-tab`) == block.getAttribute(`data-reg`)) {
                    block.classList.remove(`hidden`);
                  } else if (block.classList.contains(`select2`)) {
                    block.classList.remove(`hidden`);
                  }
                } else {
                  block.classList.remove(`select1`);
                }

                if (Number(block.getAttribute(`data-tab`)) === btnTab && filterBtns[1].getAttribute(`data-tab`) == block.getAttribute(`data-reg`) || Number(block.getAttribute(`data-tab`)) === btnTab && block.classList.contains(`select2`)) {
                  block.classList.remove(`hidden`);
                }
              });
            } else if (btnBlockTab === 2) { // Блок 2 - смена регионов
              [].forEach.call(sortBlocks, function (block) {
                block.classList.add(`hidden`);
                // Открыть все пункты
                if (btnTab === 1) {
                  block.classList.add(`select2`);
                  if (filterBtns[0].getAttribute(`data-tab`) == block.getAttribute(`data-tab`)) {
                    block.classList.remove(`hidden`);
                  } else if (block.classList.contains(`select1`)) {
                    block.classList.remove(`hidden`);
                  }
                } else {
                  block.classList.remove(`select2`);
                }
                
                if (Number(block.getAttribute(`data-reg`)) === btnTab && filterBtns[0].getAttribute(`data-tab`) == block.getAttribute(`data-tab`) || Number(block.getAttribute(`data-reg`)) === btnTab && block.classList.contains(`select1`)) {
                  block.classList.remove(`hidden`);
                }
              });
              
            }
            // Убирает анимации
            [].forEach.call(sortBlocks, function (it) {
              it.style.opacity = `1`;
              it.classList.remove(`change`);
              it.style.animationDelay = `0s`;
            });
          }, 500);

          // Анимация появления новых блоков
          setTimeout(() => {
            let animationBlocks = document.querySelectorAll(`.announcement__block:not(.hidden)`);

            for (let j = 0; j < animationBlocks.length; j++) {
              animationBlocks[j].style.opacity = `0`;
              animationBlocks[j].classList.add(`change`);
              animationBlocks[j].style.animationDelay = ((j + 1) / 5) + `s`;
            }
          }, 700);

          setTimeout(() => {
            sortContainer.classList.remove(`change`);
            sortTitle.classList.remove(`change`);
          }, 1000);

          [].forEach.call(filterBtns, function (btn) {
            btn.classList.remove(`opened`);
          });
        }
      });
    }

    // Наведение на кнопки списка селектов - убирание галочки, анимация галочки
    function onFilterSelectBtnsHover(e) {
      [].forEach.call(filterSelectBtns, function (it) {
        if (it === e.target || it === e.currentTarget) {
          deleteChecked(it);

          it.addEventListener(`mousemove`, function () {
            directionY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            // мышь идет вниз
            if (directionY > 0 && !it.classList.contains(`tickUp`)) {
              it.classList.add(`tickDown`);
            // мышь идет вверх
            } else if (directionY < 0) {
              it.classList.add(`tickUp`);
            }
          });

          it.addEventListener(`mouseleave`, function () {
            it.classList.remove(`tickDown`);
            it.classList.remove(`tickUp`);
          });
        }
      });
    }

    // Обработчики событий
    [].forEach.call(filterBtns, function (btn) {
      btn.addEventListener(`click`, onFilterBtnsClick);
    });

    [].forEach.call(filterSelectBtns, function (btn) {
      btn.addEventListener(`click`, onFilterSelectBtnsClick);
      btn.addEventListener(`mouseenter`, onFilterSelectBtnsHover);
    });
  }
})();

(() => {
  let form;

  window.initValidation = () => {
    form = document.querySelector(`.form`);

    if (!form) {
      return;
    }

    const formFocus = () => {
      let input = form.querySelectorAll(`input, select, textarea`)[0];

      input.focus();
    };

    const sendFormData = (onload, data) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = `json`;

      xhr.addEventListener(`load`, () => {
        if (xhr.status === 200) {
          onload(xhr.response);
        }
      });

      xhr.open(`POST`, form.action);
      xhr.setRequestHeader(`x-requested-with`, `XMLHttpRequest`);
      xhr.send(data);
    };

    const onFormSent = (data) => {
      if (data.success) {
        form.classList.add(`success`);

        if (form.offsetTop < window.getScrollTop()) {
          form.scrollIntoView({
            behavior: `smooth`
          });
        }
      } else {
        let formFields = form.querySelectorAll(`.form__item`);

        for (let field of formFields) {
          let input = field.querySelector(`input, textarea, select`);

          if (data.data[input.name]) {
            let errorElement = field.querySelector(`.error-message`);
            field.classList.add(`error`);
            input.classList.add(`error-blur`);

            if (errorElement) {
              errorElement.textContent = data.data[input.name];
            }
          }
        }

        form.querySelectorAll(`.form .error input, .form .error select, .form .error textarea`)[0].focus();
      }
    };

    form.addEventListener(`invalid`, (evt) => {
      evt.preventDefault();

      let input = evt.target;
      let errorElement = input.parentElement.querySelector(`.error-message`);
      input.parentElement.classList.add(`error`);
      input.classList.add(`error-blur`);

      if (errorElement) {
        if (input.validity.valueMissing) {
          errorElement.textContent = `Это поле обязательно для заполнения`;
        } else if (input.type === `email` && (input.validity.typeMismatch || input.validity.patternMismatch)) {
          errorElement.textContent = `Проверьте введённый e-mail, кажется, там ошибка`;
        } else if (input.validity.typeMismatch || input.validity.patternMismatch) {
          errorElement.textContent = `Неверный формат`;
        }
      }

      form.querySelectorAll(`.form :invalid`)[0].focus();
    }, true);

    form.addEventListener(`change`, function (evt) {
      let input = evt.target;

      if (input.validity.valid) {
        input.classList.remove(`error-blur`);
        input.parentElement.classList.remove(`error`);
      }
    }, true);

    form.addEventListener(`submit`, (evt) => {
      evt.preventDefault();

      let formData = new FormData(form);
      sendFormData(onFormSent, formData);
    });

    form.addEventListener(`click`, (evt) => {
      if (evt.target.type === `button` &&
          evt.target.parentElement.classList.contains(`form__success`)) {
        form.reset();
        form.classList.remove(`success`);
        formFocus();
      }
    });


    // Авторесайз текстового поля
    let text = document.querySelector(`.form textarea`);
    let observe;

    if (window.attachEvent) {
      observe = function (element, event, handler) {
        element.attachEvent(`on` + event, handler);
      };
    } else {
      observe = function (element, event, handler) {
        element.addEventListener(event, handler, false);
      };
    }

    const initTextResize = function () {
      function resize() {
        text.style.height = `auto`;
        text.style.height = text.scrollHeight + `px`;
      }
      function delayedResize() {
        window.setTimeout(resize, 0);
      }
      observe(text, `change`, resize);
      observe(text, `cut`, delayedResize);
      observe(text, `paste`, delayedResize);
      observe(text, `drop`, delayedResize);
      observe(text, `keydown`, delayedResize);

      // text.focus();
      // text.select();
      resize();
    };
    if (text) {
      initTextResize();
    }
  };
})();

(function () {
  window.initGrid = () => {


    function resizeGridItem(item) {
      if (window.matchMedia(`(min-width: 768px)`).matches) {
        item.style.gridRowEnd = 'none';
        let grid = document.querySelector(`.grid`);
        let rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue(`grid-auto-rows`));
        let rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue(`grid-row-gap`));
        let rowSpan = Math.ceil((item.querySelector('a').getBoundingClientRect().height + rowGap) / (rowHeight + rowGap));

        item.style.gridRowEnd = `span ` + rowSpan;
      } else {
        item.style.gridRowEnd = 'auto';
      }
    }

    function resizeAllGridItems() {
      let allItems = document.querySelectorAll(`.grid-block`);

      for (let x = 0; x < allItems.length; x++) {
        resizeGridItem(allItems[x]);
      }
    }

    window.onload = resizeAllGridItems();
    window.addEventListener(`resize`, resizeAllGridItems);

  };
})();

(() => {
  document.addEventListener(`mouseenter`, (evt) => {
    if (evt.target.classList) {
      let button = evt.target;

      if (button.classList.contains(`main__link`)) {
        let sibling = button.nextElementSibling;

        if (!sibling || !sibling.classList || !sibling.classList.contains(`main__link`)) {
          sibling = button.previousElementSibling;

          if (!sibling || !sibling.classList || !sibling.classList.contains(`main__link`)) {
            sibling = null;
          }
        }

        if (sibling) {
          window.setTimeout(() => {
            sibling.classList.add(`rotated`);
          }, 150);

          button.addEventListener(`mouseleave`, () => {
            window.setTimeout(() => {
              sibling.classList.remove(`rotated`);
            }, 100);
          });
        }
      } else {
        let rotatedBtn = document.querySelector(`.rotated`);

        if (rotatedBtn) {
          rotatedBtn.classList.remove(`rotated`);
        }
      }
    }
  }, true);

})();

// (() => {
//   window.initNewsMasonry = () => {
//     let grid = document.querySelector(`.news-grid`);

//     if (!grid) {
//       return;
//     }

//     let msnry = new window.Masonry(grid, {
//       // options
//       itemSelector: `.grid-item`,
//       columnWidth: 0,
//       // horizontalOrder: true
//     });
//   };
// })();


(() => {
  let menu;
  let distance;
  let currentPosition;
  let centerItem;
  let topLink;

  let bullet = document.createElement(`div`);
  bullet.innerHTML = `<div></div>`;
  bullet.classList.add(`main-nav__bullet`);

  const TO_CENTER_SHIFT = {
    1: `bottom`,
    2: window.matchMedia(`(min-width: 768px)`).matches ? `right` : `left`,
    3: `left`
  };

  const TO_POSITION_SHIFT = {
    1: `top`,
    2: `marginLeft`,
    3: `marginLeft`
  };

  const calculateDistance = () => {
    if (window.matchMedia(`(min-width: 768px)`).matches) {
      distance = (centerItem.getBoundingClientRect().width + topLink.getBoundingClientRect().width) / 2 - 20;
    } else {
      distance = (centerItem.getBoundingClientRect().width + 64) / 2 - 10;
    }

    distance = Math.max(distance, 30);
  };

  window.initNavBullet = () => {
    menu = document.querySelector(`.main-nav`);

    if (!menu) {
      return;
    }

    let currentItem = menu.querySelector(`.main-nav__link--current`);
    centerItem = menu.querySelector(`.main-nav__item--center`);
    let topItem = menu.querySelector(`.main-nav__item--top`);
    topLink = topItem.querySelector(`a`);
    currentPosition = null;

    if (currentItem) {
      currentItem.appendChild(bullet);

      let parent = currentItem.parentElement;
      currentPosition = getDirection(parent);
    }
  };

  const getDirection = (parent) => {
    if (parent.classList.contains(`main-nav__item--top`)) {
      return 1;
    } else if (parent.classList.contains(`main-nav__item--left`)) {
      return 2;
    } else if (parent.classList.contains(`main-nav__item--right`)) {
      return 3;
    }
    return 0;
  };

  const moveToCenter = (direction, nextDirection, link) => {
    if (direction) {
      let sign = -1;

      if (window.matchMedia(`(max-width: 767px)`).matches && direction === 2) {
        sign = 1;
      }

      bullet.style[TO_CENTER_SHIFT[direction]] = (sign * distance) + `px`;

      window.setTimeout(() => {
        bullet.parentElement.removeChild(bullet);
        bullet.style = ``;
        centerItem.querySelector(`a`).appendChild(bullet);
      }, 200);

      window.setTimeout(() => {
        moveToPosition(nextDirection, link);
      }, 250);
    } else {
      moveToPosition(nextDirection, link);
    }
  };

  const moveToPosition = (direction, link) => {
    if (direction) {
      let sign = -1;

      if (direction === 3) {
        sign = 1;
      }

      bullet.style[TO_POSITION_SHIFT[direction]] = (sign * distance) + `px`;

      window.setTimeout(() => {
        bullet.parentElement.removeChild(bullet);
        bullet.style = ``;
        link.appendChild(bullet);
      }, 200);
    }
  };

  window.placeBullet = (parent) => {
    if (parent) {
      parent.appendChild(bullet);
    }
  };

  window.moveBullet = (link) => {
    calculateDistance();
    let newPosition = getDirection(link.parentElement);

    if (currentPosition !== newPosition) {
      moveToCenter(currentPosition, newPosition, link);
    }
  };
})();

(() => {
  const MENU_BTN_CLASS = `main-nav__btn`;
  const MENU_OPENED_CLASS = `menu-opened`;
  const MENU_ITEM_CLASS = `main-nav__link`;
  const CURRENT_MENU_ITEM_CLASS = `main-nav__link--current`;
  const DIRECTIONS = {
    ArrowUp: `top`,
    ArrowLeft: `left`,
    ArrowRight: `right`,
    ArrowDown: `bottom`
  };

  const MENU_DIRECTIONS = {
    ArrowUp: `top`,
    ArrowLeft: `left`,
    ArrowRight: `right`,
    ArrowDown: `center`
  };

  let currentLink;
  let nav;

  const changeCurrentItem = (newLink) => {
    let status = window.getLinkStatus(newLink);

    if (!status) {
      return;
    }

    if (status === `page`) {
      let shown = !!currentLink;

      if (currentLink && currentLink !== newLink) {
        currentLink.classList.remove(CURRENT_MENU_ITEM_CLASS);
        currentLink = null;
      }

      if (newLink.classList.contains(MENU_ITEM_CLASS)) {
        currentLink = newLink;
        currentLink.classList.add(CURRENT_MENU_ITEM_CLASS);

        if (!shown) {
          window.placeBullet(newLink);
        } else {
          window.moveBullet(newLink);
        }
      }
    }
  };

  window.initMenu = () => {
    nav = document.querySelector(`.main-nav`);

    if (nav) {
      let navLinks = nav.querySelectorAll(`.main-nav__link`);
      currentLink = nav.querySelector(`.${ CURRENT_MENU_ITEM_CLASS }`);
      let pageLink;

      for (let link of navLinks) {
        if (link.href === window.currentPage) {
          pageLink = link;
        }
      }

      if (pageLink) {
        changeCurrentItem(pageLink);
      }
    }
  };

  const onLinkHover = (evt) => {
    evt.target.parentElement.classList.add(`shown`);
  };

  document.addEventListener(`click`, (evt) => {
    let target = evt.target;

    if (target.classList.contains(MENU_BTN_CLASS)) {
      let links = nav.querySelectorAll(`.main-nav__link`);

      for (let link of links) {
        link.classList.remove(`shown`);
        let circle = link.querySelector(`.main-nav__circle`);

        if (circle) {
          circle.addEventListener(`animationend`, onLinkHover);
        }
      }

      document.body.classList.toggle(MENU_OPENED_CLASS);
    } else {
      changeCurrentItem(target);
    }
  }, true);

  document.addEventListener(`keydown`, (evt) => {
    let direction = DIRECTIONS[evt.key];

    if (direction && !document.body.classList.contains(`full-shown`)) {
      evt.preventDefault();
    }
  }, true);

  document.addEventListener(`keyup`, (evt) => {
    if (!document.body.classList.contains(MENU_OPENED_CLASS)) {
      if (!document.body.classList.contains(`full-shown`)) {
        let direction = DIRECTIONS[evt.key];
        let navButton = document.querySelector(`.nav-button--${ direction }`);

        if (navButton) {
          navButton.click();
        }
      }
    } else {
      let menuDirection = MENU_DIRECTIONS[evt.key];
      let menuItem = nav.querySelector(`.main-nav__item--${ menuDirection }`);
      let currentItem = currentLink.parentElement;

      if ((currentItem.classList.contains(`main-nav__item--left`) && evt.key === `ArrowRight`) ||
        (currentItem.classList.contains(`main-nav__item--right`) && evt.key === `ArrowLeft`)) {
        menuItem = nav.querySelector(`.main-nav__item--center`);
      }

      if (menuItem !== currentItem) {
        menuItem.querySelector(`.main-nav__link`).click();
      }
    }
  });
})();

(function () {
  let popupContainer;

  window.initPopup = () => {
    popupContainer = document.querySelector(`.popup-container`);

    if (!popupContainer) {
      return;
    }
  };

  const closePopup = () => {
    popupContainer.classList.add(`closed`);
    document.body.classList.remove(`popup-shown`);

    window.history.replaceState({
      pageName: window.currentPage,
      popup: false
    }, ``, window.currentPage);
  };

  document.addEventListener(`click`, (evt) => {
    if (evt.target.hasAttribute(`href`) && evt.target.hasAttribute(`data-popup`)) {
      window.setTimeout(() => {
        document.body.classList.add(`popup-shown`);
        popupContainer.style.height = window.innerHeight + `px`;

        window.Sharer.init();
      }, 100);
    } else if (evt.target.classList.contains(`popup-container__close`)) {
      closePopup();
    }
  }, true);

  document.addEventListener(`keyup`, (evt) => {
    if (evt.key === `Escape`) {
      closePopup();
    }
  });
})();

(function () {
  let programSection;

  window.initProgram = () => {
    if (programSection) {
      return;
    }

    programSection = document.querySelector(`.program`);

    if (!programSection) {
      return;
    }

    let btns = programSection.querySelectorAll(`.program__table div:first-child button`);
    let infoTags = programSection.querySelectorAll(`.tag.tag--info`);
    let days = programSection.querySelectorAll(`.program__date`);
    let tables = programSection.querySelectorAll(`.program__table`);

    [].forEach.call(tables, function (it) {
      if (it.getAttribute(`data-program-tab`) === 2) {
        it.classList.add(`closed`);
      }
    });

    // Клик на кнопки навигации моб.версии
    function onBtnsMobileClick(e) {
      [].forEach.call(tables, function (table) {
        if (table.getAttribute(`data-program-tab`) === e.target.getAttribute(`data-program-tab`)) {
          let btnMobile = table.querySelector(`.program__table > div > button`);
          let row1 = table.querySelector(`.program__table > div`);
          let hiddenBlock = table.querySelector(`.program__hidden-block`);
          let cols = table.querySelectorAll(`.program__table div:not(:first-of-type) .program__col:not(.program__col--button)`);

          if (hiddenBlock.classList.contains(`opened`)) {
            hiddenBlock.classList.add(`fade-in`);
            hiddenBlock.classList.remove(`fade-out`);

            hiddenBlock.append(btnMobile);
            row1.prepend(e.target);

            setTimeout(() => {
              hiddenBlock.classList.remove(`opened`);
            }, 300);
          } else {
            hiddenBlock.classList.add(`opened`);
            hiddenBlock.classList.add(`fade-out`);

            setTimeout(() => {
              hiddenBlock.classList.remove(`fade-in`);
            }, 100);
          }


          [].forEach.call(cols, function (col) {
            col.getAttribute(`data-col`) === e.target.getAttribute(`data-col`)
              ? col.classList.remove(`visually-hidden`)
              : col.classList.add(`visually-hidden`);
          });
        }
      });
    }
    // Клик на кнопки навигации десктоп.версии
    function onBtnsDesktopClick(e) {
      [].forEach.call(tables, function (table) {
        if (table.getAttribute(`data-program-tab`) === e.target.getAttribute(`data-program-tab`)) {
          let cols = table.querySelectorAll(`.program__col:not(.program__col--time):not(.program__col--button)`);
          let btnsNav = table.querySelectorAll(`.program__table div:first-child button`);
          [].forEach.call(cols, function (it) {
            it.getAttribute(`data-col`) === e.target.getAttribute(`data-col`)
              ? it.classList.remove(`inactive`)
              : it.classList.add(`inactive`);
          });

          [].forEach.call(btnsNav, function (it) {
            it === e.target
              ? it.parentElement.classList.add(`active`)
              : it.parentElement.classList.remove(`active`);
          });
        }
      });
    }
    // Клик на тег "инфо"
    function onInfoClick(e) {
      [].forEach.call(infoTags, function (it) {
        if (it === e.currentTarget) {
          it.parentElement.classList.toggle(`program__info--opened`);
          it.classList.toggle(`active`);
        }
      });
    }
    // Клик на дату (смена таблиц)
    function onDateClick(e) {
      [].forEach.call(days, function (it) {
        it === e.target
          ? it.classList.add(`program__date--active`)
          : it.classList.remove(`program__date--active`);
      });

      [].forEach.call(tables, function (it) {
        it.getAttribute(`data-program-tab`) === e.target.getAttribute(`data-program-tab`)
          ? it.classList.remove(`closed`)
          : it.classList.add(`closed`);
      });
    }
    // Клик на документ (закрытие инфо-тегов)
    function onDocumentClick(e) {
      [].forEach.call(infoTags, function (it) {
        if (it !== e.target) {
          it.parentElement.classList.remove(`program__info--opened`);
          it.classList.remove(`active`);
        }
      });
    }

    // ОБРАБОТЧИКИ СОБЫТИЙ
    if (window.matchMedia(`(max-width: 767px)`).matches) {
      let tableCols = programSection.querySelectorAll(`.program__table div:not(:first-of-type) .program__col:not(:nth-of-type(2)):not(.program__col--button)`);
      [].forEach.call(tableCols, function (col) {
        col.classList.add(`visually-hidden`);
      });

      [].forEach.call(btns, function (it) {
        it.addEventListener(`click`, onBtnsMobileClick);
      });
    } else {
      [].forEach.call(btns, function (it) {
        it.addEventListener(`click`, onBtnsDesktopClick);
      });
    }
    [].forEach.call(infoTags, function (it) {
      it.addEventListener(`click`, onInfoClick);
    });
    [].forEach.call(days, function (it) {
      it.addEventListener(`click`, onDateClick);
    });

    window.addEventListener(`click`, onDocumentClick);

    let header = document.querySelector(`.header`);
    let headerNav = document.querySelector(`.main-nav`);
    let fullBlock = document.querySelector(`.page-full`) || document.querySelector(`main`);

    fullBlock.addEventListener(`scroll`, function () {
      [].forEach.call(tables, function (table) {

        if (!table.classList.contains(`closed`)) {
          let row1 = table.querySelector(`.program__table > div`);
          let topSection = table.offsetTop;
          let bottomSection = table.offsetTop + table.offsetHeight;
          let scrollTop = fullBlock.pageYOffset || fullBlock.scrollTop;

          if (scrollTop >= (topSection) && scrollTop <= bottomSection) {
            row1.classList.add(`fixed`);
            header.classList.add(`hiddenProgram`);
            headerNav.classList.add(`hiddenProgram`);
          } else {
            row1.classList.remove(`fixed`);
            header.classList.remove(`hiddenProgram`);
            headerNav.classList.remove(`hiddenProgram`);
          }
        }
      });

    }, {
        passive: true
      });
  };
})();

(() => {
  let page;
  let short;
  let full;

  let nav;
  let popup;

  let startY;
  let startX;
  let endY;
  let endX;
  let delta;

  let prevScroll;

  const isMobile = () => window.matchMedia(`(max-width: 767px)`).matches;

  const unify = (evt) => evt.changedTouches ? evt.changedTouches[0] : evt;

  const showFull = () => {
    if (document.body.classList.contains(`is-about`)) {
      page.style.marginTop = ``;
    } else {
      page.style.marginTop = `-${window.innerHeight}px`;
    }

    window.setTimeout(() => {
      full.focus();
    }, 600);
  };

  const resizeSections = () => {
    if (document.body.classList.contains(`has-short`)) {
      if (isMobile()) {
        short.style.height = ``;
        full.style.height = ``;
        page.style.marginTop = ``;

        if (document.body.classList.contains(`is-main`)) {
          short.style.height = `${window.innerHeight}px`;
        }
      } else {
        short.style.height = `${window.innerHeight}px`;
        full.style.height = `${window.innerHeight}px`;
        document.body.classList.remove(`full-shown`);
      }
    }
  };

  const scroll = (shift) => {
    let menuOpened = document.body.classList.contains(`menu-opened`);

    if (isMobile()) {
      document.body.classList.remove(`full-shown`);
    } else {
      if (short && !menuOpened) {
        if (shift > 0) {
          if (!document.body.classList.contains(`full-shown`)) {
            showFull();
            document.body.classList.add(`full-shown`);
          }
        } else if (shift < 0) {
          if (full.scrollTop === 0 && document.body.classList.contains(`full-shown`)) {
            document.body.classList.remove(`full-shown`);
            page.style.marginTop = ``;
            full.blur();
          }
        }
      }
    }
  };

  const scrollToFull = () => {
    let shift = short.getBoundingClientRect().height / 20;
    let interval = window.setInterval(() => {

      if (full.getBoundingClientRect().top > 0) {
        page.scrollBy({
          top: shift
        });
      } else {
        window.clearInterval(interval);
      }
    }, 20);
  };

  window.initScroll = () => {
    page = document.querySelector(`main`);
    short = document.querySelector(`.page-short`);
    full = document.querySelector(`.page-full`);

    nav = document.querySelector(`.main-nav`);
    popup = document.querySelector(`.popup-container`);
    prevScroll = null;

    resizeSections();

    if (nav) {
      nav.addEventListener(`scroll`, (evt) => {
        evt.stopPropagation();
      });
    }

    if (popup) {
      popup.addEventListener(`scroll`, (evt) => {
        evt.stopPropagation();
      });
    }

    if (full) {
      full.addEventListener(`scroll`, () => {
        prevScroll = prevScroll || full.scrollTop;
        delta = full.scrollTop - prevScroll;
        prevScroll = full.scrollTop;

        if (delta < 0) {
          scroll(delta);
        }
      });
    }
  };

  window.addEventListener(`resize`, () => {
    resizeSections();
  });

  window.addEventListener(`wheel`, (evt) => {
    delta = evt.deltaY || evt.detail;
    scroll(delta);
  }, {
    passive: true
  });

  window.addEventListener(`touchstart`, (evt) => {
    startX = unify(evt).clientX;
    startY = unify(evt).clientY;
  });

  window.addEventListener(`touchmove`, (evt) => {
    endX = unify(evt).clientX;
    endY = unify(evt).clientY;

    if (document.body.classList.contains(`is-about`)) {
      delta = startX - endX;
    } else {
      delta = startY - endY;
    }
  }, {
    passive: false
  });

  window.addEventListener(`touchend`, () => {
    scroll(delta);
  });

  window.addEventListener(`click`, (evt) => {
    if (short && evt.target.hash === `#more`) {
      if (isMobile()) {
        window.setTimeout(() => {
          scrollToFull();
        }, 100);

        window.setTimeout(() => {
          evt.target.blur();
        }, 600);
      } else {
        scroll(100);
      }
      evt.preventDefault();
    }
  });

  document.addEventListener(`keyup`, (evt) => {
    if (!document.body.classList.contains(`menu-opened`) &&
      document.body.classList.contains(`full-shown`) &&
      full.scrollTop === 0) {
      if (document.body.classList.contains(`is-about`)) {
        if (evt.key === `ArrowLeft`) {
          scroll(-100);
        }
      } else if (evt.key === `ArrowUp`) {
        scroll(-100);
      }
    }
  });

  const navButtonTopMain = document.querySelector(`.nav-button--top-main`);
  if (navButtonTopMain) {
    navButtonTopMain.addEventListener(`click`, (_) => {
      scroll(-100);
    });
  }

})();

(function () {

  window.initAdvantagesSlider = () => {
      const advantagesBlock = document.querySelector(`.event-adv`);

      if (!advantagesBlock) {
      return;
    }

    let sliderContainer = advantagesBlock.querySelector(`.swiper-container`);
    let slider;

    function sliderAdvInit(params) {
      slider = new window.Swiper(sliderContainer, {
        slidesPerView: 3,
        centeredSlides: true,
        spaceBetween: 20,
        loop: true,
        navigation: {
          nextEl: `.event-adv .swiper-button-next`,
          prevEl: `.event-adv .swiper-button-prev`,
        },
        breakpoints: {
          767: {
            slidesPerView: 1
          }
        }
      });
    }

    if (window.matchMedia(`(max-width: 767px)`).matches) {
      sliderAdvInit();
    } else {
      if (slider) {
        slider.destroy(true, true);
      }
      
    }

    window.addEventListener(`resize`, function () {
      if (window.matchMedia(`(max-width: 767px)`).matches) {
        sliderAdvInit();
      } else {
        if (slider) {
          slider.destroy(true, true);
        }
      }
    })
  }
})();

(function () {

  window.initSimilarSlider = () => {
    const similarSection = document.querySelector(`.similar-event`);

    if (!similarSection) {
      return;
    }

    let slider = similarSection.querySelector(`.swiper-container`);

    // eslint-disable-next-line consistent-return
    return new window.Swiper(slider, {
      slidesPerView: 3,
      spaceBetween: 23,
      loop: true,
      observer: true,
      navigation: {
        nextEl: `.similar-event .swiper-button-next`,
        prevEl: `.similar-event .swiper-button-prev`,
      },
      breakpoints: {
        1200: {
          slidesPerView: 2,
        },
        767: {
          slidesPerView: 1
        }
      }
    });
  };

})();

(function () {
  let mySwiper;
  let headlinerSection;

  window.initHeadlinerSlider = () => {
    if (headlinerSection) {
      return;
    }

    headlinerSection = document.querySelector(`.headliners`);

    if (!headlinerSection) {
      return;
    }
    let slider = headlinerSection.querySelector(`.swiper-container`);

    if (mySwiper) {
      mySwiper.destroy(true, true);
    }

    mySwiper = new window.Swiper(slider, {
      slidesPerView: `auto`,
      centeredSlides: true,
      loop: true,
      navigation: {
        nextEl: `.headliners__button--next`,
        prevEl: `.headliners__button--prev`,
      },
      observer: true,
      observeParents: true,

      breakpoints: {
        1200: {
          slidesPerView: 1,
          spaceBetween: 16,
        },
        767: {
          slidesPerView: `auto`,
          spaceBetween: 16,
          loop: false
        },

        374: {
          slidesPerView: 1,
          spaceBetween: 10,
          loop: false
        },
      }
    });
  };
})();

(function () {

  window.initLastTimeSlider = () => {
    const similarSection = document.querySelector(`.last-time`);

    if (!similarSection) {
      return;
    }

    let slider = similarSection.querySelector(`.swiper-container`);

    // eslint-disable-next-line consistent-return
    return new window.Swiper(slider, {
      slidesPerView: `auto`,
      centeredSlides: true,
      spaceBetween: 20,
      loop: true,
      navigation: {
        nextEl: `.last-time__button-next`,
        prevEl: `.last-time__button-prev`,
      },
      breakpoints: {
        767: {
          slidesPerView: 1,
          centeredSlides: true
        }
      }

    });
  };

})();

(function () {
  const MIN_SLIDER_LENGHT = 4;
  let swipers;
  let listeners;
  let swiperObjects = [];

  //let partnersSlides = document.querySelectorAll(`.partners__item`);

  const initSwipers = () => {
    swipers = document.querySelectorAll(`.partners`);

    if (!swipers.length) {
      return;
    }


    for (let i = 0; i < swipers.length; i++) {
      const element = swipers[i];
      let swiper = element.querySelector(`.swiper-container`);
      let prevBtn = element.querySelector(`.swiper-button-prev`).classList.add(`swiper-button-prev` + i);
      let nextBtn = element.querySelector(`.swiper-button-next`).classList.add(`swiper-button-next` + i);
      let swiperContainer = element.querySelector(`.swiper-wrapper`);

      if (swiperObjects[i]) {
        swiperObjects[i].destroy(true, true);
      }

      if (window.matchMedia(`(min-width: 768px)`).matches && swiperContainer.children.length < MIN_SLIDER_LENGHT) {
        swiperContainer.closest(`.partners`).classList.add(`disabled`);
        if (swiperObjects[i]) {
          swiperObjects[i].destroy(true, true);
        }
      } else {
        swiperObjects[i] = new Swiper(swiper, {
          slidesPerView: 3,
          navigation: {
            nextEl: `.partners__button.swiper-button-next` + i,
            prevEl: `.partners__button.swiper-button-prev` + i,
          },
          observer: true,
          observeParents: true,
          observeSlideChildren: true,
          loop: true,
          autoplay: {
            delay: 2000,
            disableOnInteraction: false,
          },
          speed: 800,
          breakpoints: {
            767: {
              slidesPerView: 1,
              spaceBetween: 16,
            },
          },
          on: {
            observerUpdate: function (swiper) {
              if (swiper.autoplayPaused) {
                swiper.stopAutoplay();
                swiper.startAutoplay();
              }
            },
          }
        });

        swiperContainer.closest(`.partners`).classList.remove(`disabled`);
      }
    }
  };

  window.initPartnersSlider = () => {
    initSwipers();

    window.addEventListener(`resize`, function () {
      initSwipers();
    });

    if (listeners) {
      return;
    }

    let switchBtnsBlock = document.querySelector(`.switch-btns`);
    if (!switchBtnsBlock) {
      return;
    }
    let btns = switchBtnsBlock.querySelectorAll(`.switch-btns__btn-select`);
    let hiddenBlock = switchBtnsBlock.querySelector(`.switch-btns__hidden-block`);

    // клик на выпадающее меню
    [].forEach.call(btns, function (btn) {
      btn.addEventListener(`click`, function (e) {
        let btnMobile = document.querySelector(`.switch-btns > button`);

        if (hiddenBlock.classList.contains(`opened`)) {
          hiddenBlock.classList.add(`fade-in`);
          hiddenBlock.classList.remove(`fade-out`);

          hiddenBlock.append(btnMobile);
          switchBtnsBlock.prepend(this);

          setTimeout(() => {
            hiddenBlock.classList.remove(`opened`);
          }, 300);
        } else {
          hiddenBlock.classList.add(`opened`);
          hiddenBlock.classList.add(`fade-out`);

          setTimeout(() => {
            hiddenBlock.classList.remove(`fade-in`);

          }, 100);
        }

        [].forEach.call(swipers, function (it) {
          if (e.target.getAttribute(`data-btn-select`) === it.getAttribute(`data-btn-select`)) {
            it.classList.add(`partners--show`);
            initSwipers();
          } else {
            it.classList.remove(`partners--show`);
          }
        });
      });
    });

    listeners = true;
  };
})();

(function () {
  let tracksSection;

  window.initTracks = () => {
    if (tracksSection) {
      return;
    }

    tracksSection = document.querySelector(`.tracks`);

    if (!tracksSection) {
      return;
    }

    let classNames = [`tracks--pink`, `tracks--yellow`, `tracks--violet`, `tracks--blue`];
    let trackTabs = tracksSection.querySelectorAll(`.tracks__tab`);
    let trackTabBlocks = tracksSection.querySelectorAll(`.tracks__tab-block`);
    let btnAdd = tracksSection.querySelector(`.tracks__btn`);
    let btnsContainer = tracksSection.querySelector(`.container`);
    let tracksContainer = tracksSection.querySelector(`.tracks__container`);
    let trackTabsBlock = tracksSection.querySelector(`.tracks__switch__btns`);
    let headerNav = document.querySelector(`.main-nav`);
    let header = document.querySelector(`.header`);
    let fullBlock = document.querySelector(`.page-full`) || document.querySelector(`main`);

    // Клик на "Показать еще"
    function onBtnAddClick(e) {
      let container = tracksContainer.cloneNode(true);
      tracksSection.insertBefore(container, e.target);

    }
    // Функция изменения таб-блоков с текстом
    function changeTabBlock(e) {
      [].forEach.call(trackTabBlocks, function (block) {
        block.getAttribute(`data-tab`) === e.target.getAttribute(`data-tab`)
          ? block.classList.add(`tracks__tab-block--opened`)
          : block.classList.remove(`tracks__tab-block--opened`);
      });
    }
    // Функция смены цветов трек-блоков
    function changeTabsColor(e) {
      for (let i = 0; i < trackTabs.length; i++) {
        tracksSection.classList.remove(classNames[i]);

        if (trackTabs[i] === e.target) {
          trackTabs[i].classList.add(`tracks__tab--active`);
          tracksSection.classList.add(classNames[e.target.getAttribute(`data-tab`) - 1]);
        } else {
          trackTabs[i].classList.remove(`tracks__tab--active`);
        }
      }
    }
    // Функция нажатия на табы моб.версии
    function onBtnsMobileClick(e) {
      let btnMobile = tracksSection.querySelector(`.tracks__switch__btns > button`);
      let hiddenBlock = tracksSection.querySelector(`.tracks__list`);

      if (hiddenBlock.classList.contains(`opened`)) {
        hiddenBlock.classList.add(`fade-in`);
        hiddenBlock.classList.remove(`fade-out`);

        hiddenBlock.append(btnMobile);
        btnMobile.classList.remove(`tracks__tab--mobile`);
        trackTabsBlock.prepend(e.target);
        e.target.classList.add(`tracks__tab--mobile`);
        changeTabsColor(e);

        setTimeout(() => {
          hiddenBlock.classList.remove(`opened`);
        }, 300);
      } else {
        hiddenBlock.classList.add(`opened`);
        hiddenBlock.classList.add(`fade-out`);

        setTimeout(() => {
          hiddenBlock.classList.remove(`fade-in`);
        }, 100);
      }

      changeTabBlock(e);
    }
    // Функция нажатия на табы десктоп.версии
    function onBtnsDesktopClick(e) {
      changeTabsColor(e);
      changeTabBlock(e);
    }

    // ОБРАБОТЧИКИ СОБЫТИЙ
    btnAdd.addEventListener(`click`, onBtnAddClick);

    let screenHeight = document.documentElement.clientHeight;
    let topSectionMob = trackTabsBlock.getBoundingClientRect().top - screenHeight;

    window.addEventListener(`resize`, () => {
      let hiddenBlock = tracksSection.querySelector(`.tracks__list`);
      hiddenBlock.classList.remove(`fade-in`);
      screenHeight = document.documentElement.clientHeight;
      topSectionMob = trackTabsBlock.getBoundingClientRect().top - screenHeight;
    });


    fullBlock.addEventListener(`scroll`, function () {
      let topSection = tracksContainer.offsetTop;
      let scrollTop = fullBlock.pageYOffset || fullBlock.scrollTop;
      let bottomSection = tracksSection.offsetTop + tracksSection.offsetHeight;

      if (window.matchMedia(`(max-width: 767px)`).matches) {
        if (scrollTop >= (topSectionMob) && scrollTop <= bottomSection) {
          trackTabsBlock.classList.add(`fixed`);
          tracksSection.prepend(trackTabsBlock);
          tracksSection.style.position = `relative`;
          header.classList.add(`hiddenTrack`);
          headerNav.classList.add(`hiddenTrack`);
        } else {
          btnsContainer.append(trackTabsBlock);
          tracksSection.style = `none`;
          trackTabsBlock.classList.remove(`fixed`);
          header.classList.remove(`hiddenTrack`);
          headerNav.classList.remove(`hiddenTrack`);
        }
      } else {
        if (scrollTop >= (topSection) && scrollTop <= bottomSection) {
          trackTabsBlock.classList.add(`fixed`);
          header.classList.add(`hiddenTrack`);
          headerNav.classList.add(`hiddenTrack`);
        } else {
          trackTabsBlock.classList.remove(`fixed`);
          header.classList.remove(`hiddenTrack`);
          headerNav.classList.remove(`hiddenTrack`);
        }
      }
    }, {
      passive: true
    });

    [].forEach.call(trackTabs, function (it) {
      it.addEventListener(`click`, (evt) => {
        if (window.matchMedia(`(max-width: 767px)`).matches) {
          onBtnsMobileClick(evt);
        } else {
          onBtnsDesktopClick(evt);
        }
      });
    });
  };
})();
