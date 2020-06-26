$(() => {
  const maxScale = 1.0;
  const minScale = 0.9;

  let lastScroll = 0;
  let ticking = false;

  const pictures = $(`.scale--big`);
  const textBlocks = $(`.parallax`);
  let headerBlock = $(`.parallax-header`);
  const menu = $(`.header__links`);
  let header = $(`.header__gradient`);
  let smallTexts = $(`.small-text`);

  const windowHeight = $(window).height();

  pictures.each((_, picture) => {
    $(picture).css(`transition`, `transform 0.1s linear`);
  });

  textBlocks.each((_, textBlock) => {
    $(textBlock)
      .find(`p`)
      .css(`transition`, `transform 0.1s linear`);
  });

  $(headerBlock)
    .find(`p`)
    .css(`transition`, `transform 0.1s linear`);

  window.addEventListener(`scroll`, () =>
    window.requestAnimationFrame(scrollHandler)
  );

  // helpers

  function scrollHandler() {
    lastScroll = $(window).scrollTop();
    requestTick();
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(animate);
      ticking = true;
    }
  }

  function animate() {
    animateTexts();
    animateHeader();
    animatePictures();
    hideTexts();
    hideHeader();
    showBG();
    hideSmallText();
    window.animateHeaderLinks(lastScroll);
    window.animateLogo(lastScroll);
    window.animateTurn(lastScroll);
    window.animateSlider(lastScroll);
    window.animateBackground(lastScroll);
    ticking = false;
  }

  function animatePictures() {
    pictures.each((_, picture) => {
      picture = $(picture);
      const scale = calculateScale(picture);
      updatePicture(picture, { scale });
    });
  }

  function updatePicture(element, { scale }) {
    element.css(`transform`, `scale(${scale})`);
  }

  function calculateScale(element) {
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;
    const elementHeight = element.height();

    const startOffset = elementOffset - windowHeight;
    const finishOffset = elementOffset - windowHeight + elementHeight;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    const scale = minScale + (maxScale - minScale) * relative;

    return scale;
  }

  function animateTexts() {
    textBlocks.each((_, textBlock) => {
      const relative = calculateTextRelative($(textBlock));
      updateTextBlock($(textBlock), relative);
    });
  }

  function animateHeader() {
    const relative = calculateHeaderRelative($(headerBlock));
    updateHeaderBlock($(headerBlock), relative);
  }

  function calculateTextRelative(element) {
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;
    const elementHeight = element.height();

    const startOffset = elementOffset - windowHeight;
    const finishOffset = elementOffset - windowHeight + elementHeight;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    return relative;
  }

  function calculateHeaderRelative(element) {
    const scrollTop = lastScroll;

    const startOffset = 0;
    const finishOffset = windowHeight / 2;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    return relative;
  }

  function updateTextBlock(element, relative) {
    const offset = relative * -40;
    element.find(`p`).css(`transform`, `translateY(${offset}px)`);
  }

  function updateHeaderBlock(element, relative) {
    const offset = relative * -40;
    element.find(`p`).css(`transform`, `translateY(${offset}px)`);
  }

  function hideTexts() {
    textBlocks.each((index, textBlock) => {
      if (index === textBlocks.length - 1 && !window.isMobile()) {
        return;
      }
      textBlock = $(textBlock);
      const disappearance = calculateOpacity(textBlock);
      hideTextBlock(textBlock, disappearance);
    });
  }

  function hideHeader() {
    headerBlock = $(headerBlock);
    const disappearance = calculateHeaderOpacity(headerBlock);
    hideHeaderBlock(headerBlock, disappearance);
  }

  function hideSmallText() {
    smallTexts.each((_, smallText) => {
      smallText = $(smallText);
      const disappearance = calculateSTOpacity(smallText);
      hideTextSmall(smallText, disappearance);
    });
  }

  function showBG() {
    header = $(header);
    const disappearance = calculateBGOpacity(header);
    showBGGradient(header, disappearance);
  }

  function calculateOpacity(element) {
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;
    const elementHeight = element.height();

    const startOffset = window.isMobile()
      ? elementOffset - windowHeight / 8
      : elementOffset;
    const finishOffset = window.isMobile()
      ? elementOffset + elementHeight / 2 - 40
      : elementOffset + elementHeight / 2 - 80;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    const opacity = 1 - relative;

    return opacity;
  }

  function calculateHeaderOpacity(element) {
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;
    const elementHeight = element.height();

    const startOffset = window.isMobile()
      ? elementOffset - windowHeight / 4
      : elementOffset - elementHeight;
    const finishOffset = window.isMobile()
      ? elementOffset + elementHeight / 2 - 80 * 2
      : elementOffset + elementHeight / 2 - 80;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    const opacity = 1 - relative;

    return opacity;
  }

  function calculateSTOpacity(element) {
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;
    const elementHeight = element.height();

    const startOffset = elementOffset - windowHeight / 2;
    const finishOffset = elementOffset + elementHeight / 2 - 80 * 2;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    const opacity = 1 - relative;

    return opacity;
  }

  function calculateBGOpacity(element) {
    if (!window.isMobile()) {
      return;
    }
    const scrollTop = lastScroll;

    const elementOffset = element.offset().top;

    const startOffset = elementOffset + windowHeight / 6;
    const finishOffset = elementOffset + windowHeight / 3;

    const position = (scrollTop - startOffset) / (finishOffset - startOffset);
    const relative = Math.max(0, Math.min(1, position));
    const opacity = relative;

    return opacity;
  }

  function hideTextBlock(element, opacity) {
    element.find(`p`).css(`opacity`, opacity);
  }

  function hideHeaderBlock(element, opacity) {
    element.find(`p`).css(`opacity`, opacity);
  }

  function hideTextSmall(element, opacity) {
    element.css(`opacity`, opacity);
  }

  function showBGGradient(element, opacity) {
    element.css(`opacity`, opacity);
  }
});
