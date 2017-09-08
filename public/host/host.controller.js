'use strict';

var host = angular.module('host');

host.controller('HostController', ['$scope', '$rootScope', '$location', '$window', 'spotify',
  function HostController($scope, $rootScope, $location, $window, spotify) {
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
      var tokens = $location.search();
      if (!tokens.access_token && !$window.sessionStorage.access_token) {
        console.log("Failed");
        $window.open('/', '_self');
        return;
      }
      if (tokens.access_token) {
        $window.sessionStorage.access_token = tokens.access_token;
        $window.sessionStorage.refresh_token = tokens.refresh_token;
        $window.sessionStorage.sessionId = tokens.sessionId;
        $window.sessionStorage.timeout = tokens.timeout;
      }
      var access_token = $window.sessionStorage.access_token;
      getUser(access_token);
      getPlayer(access_token);
    })();
  }
]);

host.controller('SearchController', ['$window', '$scope', 'spotify',
  function SearchController($window, $scope, spotify) {
    var self = this;
    self.keywords = "";
    self.results = [];

    var defaultSearchType = 'artist,album,track';
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

    self.search = function() {
      if (self.keywords.length != 0) {
        spotify.search($window.sessionStorage.access_token, self.keywords,defaultSearchType,5).then(
          function success(response) {
            var tracks = response.data.tracks;
            var artists = response.data.artists;
            var albums = response.data.albums;
            self.results = pushItems(tracks.items);
          },
          function error(response) {
            spotify.errorCallback(response, "ActionController: error searching for " + self.keywords);
            self.results = [];
          }
        );
      } else {
        self.results = [];
      }
    };
  }
]);

host.controller('ActionController', ['$window', '$scope', '$timeout', 'spotify',
  function ActionController($window, $scope, $timeout, spotify) {

    $scope.previous = function() { player('previous'); };
    $scope.play = function() { player('play'); };
    $scope.pause = function() { player('pause'); };
    $scope.next = function() { player('next'); };

    function player(endpoint) {
      var access_token = $window.sessionStorage.access_token;
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
      var access_token = $window.sessionStorage.access_token;
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
              album_url: "/res/img/default-artwork.png"
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
