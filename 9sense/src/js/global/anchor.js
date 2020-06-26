$(document).ready(function() {
  $("#links").on("click", "a.header__link--anchor", function(event) {
    event.preventDefault();
    var id = $(this).attr("href"),
      top = $(id).offset().top + $(id).height() / 2 - $(window).height() / 2;
    setTimeout(() => $("body,html").animate({ scrollTop: top }, 1000), 500);
  });

  $("#links").on("click", "a.header__link--loc", function(event) {
    event.preventDefault();
    var id = $(this).attr("href"),
      top = $(id).offset().top + $(window).height() / 2;
    setTimeout(() => $("body,html").animate({ scrollTop: top }, 1000), 500);
  });
});
