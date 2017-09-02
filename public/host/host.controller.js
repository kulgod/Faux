'use strict';

var host = angular.module('host');

host.controller('HostController', ['$scope', '$rootScope', '$location', 'spotify',
  function HostController($scope, $rootScope, $location, spotify) {
    function getUser(access_token) {
      spotify.getUser(access_token).then(
        function successCallback(response) {
          $scope.user = response.data;
        },
        function errorCallback(response) {
          spotify.errorCallback(response, 'error receiving user info');
        }
      );
    }

    function getPlayer(access_token) {
      spotify.getPlayer(access_token).then(
        function successCallback(response) {
          $rootScope.player = response.data.device;
        },
        function errorCallback(response) {
          spotify.errorCallback(response, 'error receiving player info');
        }
      );
    }

    (function () {
      $rootScope.tokens = $location.search(); //access_token, refresh_token, and sessionId
      var access_token = $rootScope.tokens.access_token;
      getUser(access_token);
      getPlayer(access_token);
    })();
  }
]);

host.controller('ActionController', ['$rootScope', '$scope', '$timeout', 'spotify',
  function ActionController($rootScope, $scope, $timeout, spotify) {
    var ctrl = this;
    var defaultSearchType = 'artist,album,track';

    ctrl.keywords = "";
    ctrl.results = [];
    $scope.previous = function() { player('previous'); };
    $scope.play = function() { player('play'); };
    $scope.pause = function() { player('pause'); };
    $scope.next = function() { player('next'); };

    function pushItems(items) {
      var ret = [];
      items.forEach(function(t) {
        ret.push({
          name: t.name,
          type: 'track',
          artists: reduceArtists(t.artists),
          popularity: t.popularity
        });
      });
      return ret;
    }

    ctrl.search = function() {
      if (ctrl.keywords.length != 0) {
        spotify.search($rootScope.tokens.access_token, ctrl.keywords,defaultSearchType,5).then(
          function success(response) {
            var tracks = response.data.tracks;
            var artists = response.data.artists;
            var albums = response.data.albums;
            ctrl.results = pushItems(tracks.items);
          },
          function error(response) {
            spotify.errorCallback(response, "ActionController: error searching for " + ctrl.keywords);
            ctrl.results = [];
          }
        );
      } else {
        ctrl.results = [];
      }
    };

    function player(endpoint) {
      var access_token = $rootScope.tokens.access_token;
      spotify.player(access_token, endpoint).then(
        function successCallback(response) {
          $timeout(function() {
            getPlayer();
          }, 500);
        },
        function errorCallback(response) {
          spotify.errorCallback(response, "ActionController: error using endpoint /" + endpoint)
        }
      );
    }

    function getPlayer() {
      var access_token = $rootScope.tokens.access_token;
      spotify.player(access_token, 'currently-playing').then(
        function successCallback(response) {
          var data = response.data;
          if (data.item != undefined) {
            $scope.currentSong = {
                  name: data.item.name,
                  artists: reduceArtists(data.item.artists),
                  album_url: data.item.album.images[1].url,
                  is_playing: data.is_playing
            };
          } else {
            $scope.currentSong = {
              name: "No Song Currently Playing",
              album_url: "/img/default-artwork.png"
            };
          }
        },
        function errorCallback(response) {
          spotify.errorCallback(response, "ActionController: error receiving player info");
        }
      );
    }
    getPlayer();
  }
]);

function reduceArtists(artists) {
  var ret = '';
  artists.forEach(function (a) {
    ret = ret + a.name + ', ';
  });
  return ret.substring(0,ret.length-2);
}
