'use strict';

(function () {
  var FILE_TYPES = ['gif', 'jpg', 'jpeg', 'png'];

  var updateImage = function () {
    var file = window.uploadForm.fileInput.files[0];
    var fileName = file.name.toLowerCase();

    var matches = FILE_TYPES.some(function (it) {
      return fileName.endsWith(it);
    });

    if (matches) {
      window.uploadForm.formImgElement.src = '';

      var reader = new FileReader();

      reader.addEventListener('load', function () {
        window.uploadForm.formImgElement.src = reader.result;
      });

      reader.readAsDataURL(file);
    }
  };

  window.upload = {
    updateImage: updateImage
  };
})();
