var join = angular.module('join');

join.controller('JoinController', ['$scope', '$rootScope', '$location', 'spotify',
  function JoinController($scope, $rootScope, $location, spotify) {

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
      $rootScope.tokens = $location.search();
      var access_token = $rootScope.tokens.access_token;
      getUser(access_token);
      getPlayer(access_token);
    })();
  }
]);
