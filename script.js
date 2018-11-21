var ESC = 27;

// var overlay = document.querySelector(".fixed-overlay");
var popUp = document.querySelector(".pop-up");
var smallSerificates = document.querySelectorAll(".skill__item-photo");

function showCertificateModal(certificateNumber) {
  var className = ".overlay-sert" + certificateNumber;
  var serificate = document.querySelector(className);
  serificate.classList.add("modal-show");
  addCertificateClickListener(serificate);
  addEscListener(serificate);
}

function closeCertificateModal(serificate) {
  serificate.classList.remove("modal-show");
}

function addSmallCertificateClickListener(smallCertificate) {
  var certificateNumber = smallCertificate.getAttribute('data-number');
  smallCertificate.addEventListener("click", function (evt) {
    evt.preventDefault();
    showCertificateModal(certificateNumber);
  });
}

function addCertificateClickListener(serificate) {
  serificate.addEventListener("click", function (evt) {
    closeCertificateModal(serificate);
  });
}

function addEscListener(serificate) {
  window.addEventListener("keydown", function (evt) {
    if (evt.keyCode === ESC) {
      if (serificate.classList.contains("modal-show")) {
        evt.preventDefault();
        closeCertificateModal(serificate);
      }
    }
  });
}

smallSerificates.forEach(function(smallCertificate) {
  addSmallCertificateClickListener(smallCertificate);
});
