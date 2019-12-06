'use strict';
$('.price-range__full').slider({
  range: true,
  min: 325,
  max: 100000,
  values: [325, 13000],
  slide: function (event, ui) {
    $('#min-wallpaper-price').val(ui.values[0]);
    $('#max-wallpaper-price').val(ui.values[1]);
  }
});
// $("#min-wallpaper-price").val($("#test").slider("values", 0));
// $("#max-wallpaper-price").val($("#test").slider("values", 1));
