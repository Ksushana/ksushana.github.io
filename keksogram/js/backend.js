'use strict';

(function () {

  var request = function (url, method, data, onLoad, onError) {

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.timeout = window.util.constants.TIMEOUT;

    xhr.addEventListener('load', function () {
      if (xhr.status === window.util.constants.SUCCESS_STATUS) {
        onLoad(xhr.response);
      } else {
        onError('Cтатус ответа: ' + xhr.status + ' ' + xhr.statusText);
      }
    });

    xhr.addEventListener('error', function () {
      onError('Произошла ошибка соединения');
    });

    xhr.addEventListener('timeout', function () {
      onError('Запрос не успел выполниться за ' + xhr.timeout + 'мс');
    });

    xhr.open(method, url);
    xhr.send(data);
  };

  window.backend = {
    request: request
  };

})();
