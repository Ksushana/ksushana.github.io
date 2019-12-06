(function () {
  var inputPhone = document.querySelectorAll('input[type=tel]');

  if (inputPhone) {
    for (var i = 0; i < inputPhone.length; i++) {
      var phoneMask = new IMask(inputPhone[i], {
          mask: '+{7}(000)000-00-00'
        });
    }
  }
})();
