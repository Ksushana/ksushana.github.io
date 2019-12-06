'use strict';

$(function () {
  $('#accordion').accordion({
    collapsible: true,
    heightStyle: 'content'
  });
});

$(function () {
  $('#accordionOne').accordion({
    collapsible: true,
    heightStyle: 'content'
  });
});

$(function () {
  $('#accordionTwo').accordion({
    collapsible: true,
    heightStyle: 'content'
  });
});

$(document).ready(function () {
  $('input[name=sw]').click(function () {
    var v = ($(this).val());
    if (v === 'one') {
      $('#one').show();
      $('#two').hide();
    }
    else {
      $('#one').hide();
      $('#two').show();
    }
  })
})
