var join = angular.module('join');

join.controller('JoinController', ['$scope', '$rootScope', '$location', '$window', 'spotify',
  function JoinController($scope, $rootScope, $location, $window, spotify) {

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
        $window.open('/', '_self');
        return;
      }
      if (tokens.access_token) {
        $window.sessionStorage.access_token = tokens.access_token;
        $window.sessionStorage.refresh_token = tokens.refresh_token;
        $window.sessionStorage.sessionId = tokens.sessionId;
        $window.sessionStorage.timeout = tokens.timeout;
        $location.search({});
      }
      var access_token = $window.sessionStorage.access_token;
      getUser(access_token);
      getPlayer(access_token);
    })();
  }
]);

join.controller('SearchController', ['$window', '$scope', 'spotify',
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

function reduceArtists(artists) {
  var ret = '';
  artists.forEach(function (a) {
    ret = ret + a.name + ', ';
  });
  return ret.substring(0,ret.length-2);
}
