'use strict';

var ScrollWatch;

ScrollWatch = function(containerSelector, options) {
  var $this, isInViewport, isScrolling, scrollSpeed;
  this.callbacks = [];
  this.list = null;
  this.lastActiveIndex = -1;
  this.scrollSpeed = 200;
  this.centered = false;
  this.isTouched = false;
  this.scrolled = false;
  this.container = $(containerSelector);
  if (options && options.scrollSpeed) {
    scrollSpeed = options.scrollSpeed;
  }
  this.list = $(containerSelector + " > ul > li");
  $this = this;
  this.list.on('mousedown', function(e) {
    if (!$this.isTouched) {
      $this.setActiveByIndex($(this).index());
    }
  });
  if (options && options.centered) {
    this.centered = options.centered;
  }
  isScrolling = null;
  $(containerSelector).on('scroll', (function(_this) {
    return function() {
      _this.highlightActiveItem();
      if (_this.isTouched || !_this.centered) {
        return;
      }
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(function() {
        return _this.setActiveByIndex(_this.lastActiveIndex);
      }, 200);
    };
  })(this));
  if (!this.centered) {
    return;
  }
  $(containerSelector).on('touchstart', (function(_this) {
    return function(e) {
      _this.isTouched = true;
    };
  })(this));
  $(containerSelector).on('mouseup touchend touchcancel', (function(_this) {
    return function(e) {
      if (_this.isTouched) {
        _this.setActiveByIndex(_this.lastActiveIndex);
        _this.isTouched = false;
      }
    };
  })(this));
  isInViewport = (function(_this) {
    return function(parent, node, nodeOffset) {
      var anchor, nodeBBox, parentBBox;
      if ($(node).hasClass('hidden')) {
        return false;
      }
      parentBBox = {
        width: parent.outerWidth(),
        offset: parent.scrollLeft()
      };
      nodeBBox = {
        width: node.outerWidth(),
        offset: nodeOffset
      };
      anchor = parentBBox.offset + parentBBox.width / 2 - parseInt(_this.container.css('paddingLeft'));
      return (nodeBBox.offset < anchor) && (nodeBBox.offset + nodeBBox.width > anchor);
    };
  })(this);
  this.getActiveIndex = function() {
    var activeIndex, i, j, li, nodeOffset, ref;
    nodeOffset = 0;
    activeIndex = null;
    for (i = j = 0, ref = this.list.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      li = this.list[i];
      if (isInViewport(this.container, $(li), nodeOffset)) {
        activeIndex = i;
        break;
      }
      if (!$(li).hasClass('hidden')) {
        nodeOffset += $(li).outerWidth(true);
      }
    }
    return activeIndex;
  };
  this.highlightActiveItem = function() {
    var activeIndex, cb, j, len, ref;
    activeIndex = this.getActiveIndex();
    if (activeIndex !== null && activeIndex !== this.lastActiveIndex) {
      this.lastActiveIndex = activeIndex;
      ref = this.callbacks;
      for (j = 0, len = ref.length; j < len; j++) {
        cb = ref[j];
        cb(activeIndex);
      }
    }
  };
  this.onChange = function(callback) {
    this.callbacks.push(callback);
  };
  this.setActiveByIndex = function(index) {
    var offset;
    if (this.scrolled) {
      return;
    }
    if (index > this.list.length - 1 || index < 0) {
      return;
    }
    offset = this.list.eq(index).offset().left + this.container.scrollLeft();
    this.isTouched = false;
    $this = this;
    this.container.stop(true, true).animate({
      scrollLeft: offset - parseInt(this.container.css('paddingLeft'))
    }, {
      duration: this.scrollSpeed,
      complete: function() {
        $this.isTouched = false;
        $this.scrolled = false;
      }
    });
  };
  this.prev = function() {
    var activeIndex;
    activeIndex = this.getActiveIndex();
    if (activeIndex > 0) {
      activeIndex--;
      this.setActiveByIndex(activeIndex);
    }
  };
  this.next = function() {
    var activeIndex;
    activeIndex = this.getActiveIndex();
    if (activeIndex < this.list.length - 1) {
      activeIndex++;
      this.setActiveByIndex(activeIndex);
    }
  };
  this.goTo = function(index) {
    this.setActiveByIndex(index);
  };
  return this;
};

;var initMap, mapStyle, markers;

if (document.getElementsByClassName('google-map')) {
  mapStyle = [
    {
      'featureType': 'water',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#d3d3d3'
        }
      ]
    }, {
      'featureType': 'transit',
      'stylers': [
        {
          'color': '#808080'
        }, {
          'visibility': 'off'
        }
      ]
    }, {
      'featureType': 'road.highway',
      'elementType': 'geometry.stroke',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#b3b3b3'
        }
      ]
    }, {
      'featureType': 'road.highway',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#ffffff'
        }
      ]
    }, {
      'featureType': 'road.local',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#ffffff'
        }, {
          'weight': 1.8
        }
      ]
    }, {
      'featureType': 'road.local',
      'elementType': 'geometry.stroke',
      'stylers': [
        {
          'color': '#d7d7d7'
        }
      ]
    }, {
      'featureType': 'poi',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#ebebeb'
        }
      ]
    }, {
      'featureType': 'administrative',
      'elementType': 'geometry',
      'stylers': [
        {
          'color': '#a7a7a7'
        }
      ]
    }, {
      'featureType': 'road.arterial',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#ffffff'
        }
      ]
    }, {
      'featureType': 'road.arterial',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#ffffff'
        }
      ]
    }, {
      'featureType': 'landscape',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#efefef'
        }
      ]
    }, {
      'featureType': 'road',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'color': '#696969'
        }
      ]
    }, {
      'featureType': 'administrative',
      'elementType': 'labels.text.fill',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#737373'
        }
      ]
    }, {
      'featureType': 'poi',
      'elementType': 'labels.icon',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    }, {
      'featureType': 'poi',
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    }, {
      'featureType': 'road.arterial',
      'elementType': 'geometry.stroke',
      'stylers': [
        {
          'color': '#d6d6d6'
        }
      ]
    }, {
      'featureType': 'road',
      'elementType': 'labels.icon',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    }, {}, {
      'featureType': 'poi',
      'elementType': 'geometry.fill',
      'stylers': [
        {
          'color': '#dadada'
        }
      ]
    }
  ];
  markers = [];
  initMap = function() {
    var choice, currentZoom, i, image, j, len, map, place, scrollerMap, setMarkers;
    map = new google.maps.Map(document.getElementById('map1'), {
      center: {
        lat: 59.5619,
        lng: 30.1850
      },
      disableDefaultUI: true,
      scrollwheel: false,
      styles: mapStyle,
      zoom: 8
    });
    image = {
      url: 'img/pin-map.png'
    };
    choice = false;
    setMarkers = function(map, index, image) {
      var laLatLng, lat, lng, marker, shape;
      lat = index.position[0];
      lng = index.position[1];
      if (choice === true) {
        laLatLng = new google.maps.LatLng(lat, lng);
        map.panTo(laLatLng);
      }
      shape = {
        coords: [1, 1, 1, 20, 18, 20, 18, 1],
        type: 'poly'
      };
      marker = new google.maps.Marker({
        position: {
          lat: lat,
          lng: lng
        },
        map: map,
        icon: image,
        shape: shape,
        title: index.title
      });
      markers.push({
        marker: marker,
        id: lng
      });
    };
    for (i = j = 0, len = places.length; j < len; i = ++j) {
      place = places[i];
      setMarkers(map, places[i], image);
    }
    scrollerMap = new ScrollWatch('.scroller-map', {
      scrollSpeed: 100,
      centered: true
    });
    scrollerMap.onChange(function(index) {
      var k, len1, marker;
      $('.scroller-map > ul > li').removeClass('active').eq(index).addClass('active');
      choice = true;
      image = {
        url: 'img/big-pin-empty.png'
      };
      for (k = 0, len1 = markers.length; k < len1; k++) {
        marker = markers[k];
        if (places[index].position[1] === marker.id) {
          marker.marker.setMap(null);
        } else {
          marker.marker.icon.url = 'img/pin-map.png';
        }
      }
      map.setZoom($('#map1').data('zoom'));
      setMarkers(map, places[index], image);
    });
    scrollerMap.highlightActiveItem();
    $('[data-tabs]').on('click', '.tab-item', function(e) {
      var coord, index, k, lat, len1, li, list, lng, tabWrap, zoom;
      e.preventDefault();
      choice = false;
      index = $(this).index();
      tabWrap = $(this).parents('[data-tabs]').data('tabs');
      list = $('.scroller-map > ul > li');
      lat = $(this).data('lat');
      lng = $(this).data('lng');
      zoom = $(this).data('zoom');
      map.setZoom(zoom);
      coord = new google.maps.LatLng(lat, lng);
      map.panTo(coord);
      $(this).addClass('active');
      $(this).siblings('.tab-item').removeClass('active');
      for (k = 0, len1 = list.length; k < len1; k++) {
        li = list[k];
        $(li).removeClass('hidden').not('[data-id="' + index + '"]').addClass('hidden');
      }
    });
    currentZoom = map.getZoom();
    $('[data-zoomin]').click(function() {
      map.setZoom(currentZoom += 1);
    });
    $('[data-zoomout]').click(function() {
      map.setZoom(currentZoom -= 1);
    });
  };
  google.maps.event.addDomListener(window, 'load', initMap);
}


;$('[data-tab]').on('click', '.tab-item', function(e) {
  var index, tabWrap;
  e.preventDefault();
  index = $(this).index();
  tabWrap = $(this).parents('[data-tab]').data('tab');
  $(this).addClass('active');
  $(this).siblings('.tab-item').removeClass('active');
  $(tabWrap).find('.tab-content').removeClass('active');
  $(tabWrap).find('.tab-content').eq(index).addClass('active');
});



;$(document).ready(function() {
  var teleport, waitForFinalEvent;
  waitForFinalEvent = (function() {
    var timers;
    timers = {};
    return function(callback, ms, uniqueId) {
      if (!uniqueId) {
        uniqueId = 'Don\'t call this twice without a uniqueId';
      }
      if (timers[uniqueId]) {
        clearTimeout(timers[uniqueId]);
      }
      timers[uniqueId] = setTimeout(callback, ms);
    };
  })();

  /*teleport */
  (teleport = function() {
    $('[data-tablet]').each(function(i, elem) {
      var parent;
      if (window.innerWidth <= 992) {
        $(elem).appendTo($($(elem).data('tablet')));
      } else {
        parent = $($(elem).data('desktop'));
        $(elem).appendTo(parent);
      }
    });
    $('[data-mobile]').each(function(i, elem) {
      var parent;
      if (window.innerWidth <= 768) {
        $(elem).appendTo($($(elem).data('mobile')));
      } else {
        parent = $($(elem).data('desktop'));
        $(elem).appendTo(parent);
      }
    });
  })();

  /*scrollto */
  $('[data-scrollto]').click(function(e) {
    e.preventDefault();
    $('html,body').animate({
      scrollTop: $($(this).data('scrollto')).offset().top
    }, 500);
  });
  $(window).resize(function() {
    waitForFinalEvent((function() {
      teleport();
    }), 200, '');
  });
});
