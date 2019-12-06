var initMap, mapStyle, markers;

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
      url: 'img/map-marker-gray.png'
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
        url: 'img/map-marker.png'
      };
      for (k = 0, len1 = markers.length; k < len1; k++) {
        marker = markers[k];
        if (places[index].position[1] === marker.id) {
          marker.marker.setMap(null);
        } else {
          marker.marker.icon.url = 'img/map-marker-gray.png';
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
