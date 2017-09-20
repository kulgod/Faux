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

function reduceArtists(artists) {
  var ret = '';
  artists.forEach(function (a) {
    ret = ret + a.name + ', ';
  });
  return ret.substring(0,ret.length-2);
}
