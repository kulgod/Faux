'use strict';

angular.module('ng-spotify', []).factory('spotify', ['$window', '$location', '$http',
  function($window, $location, $http) {
    var server_url = 'http://localhost:8888/api/'; //Depends on where the Node.js server is being hosted
    var getUser = function(access_token) {
      return $http({
        method: 'GET',
        url: server_url + 'getuser',
        params: {
          access_token: access_token
        }
      });
    };
    var getPlayer = function(access_token) {
      return $http({
        method: 'GET',
        url: server_url + 'player',
        params: {
          access_token: access_token
        }
      });
    };
    var player = function(access_token, endpoint) {
      return $http({
        method: 'GET',
        url: server_url + endpoint,
        params: {
          access_token: access_token
        }
      });
    };

    var search = function(access_token, keywords, type, limit) {
      return $http({
        method: 'GET',
        url: server_url + 'search',
        params: {
          access_token: access_token,
          search: keywords,
          type: type,
          limit: limit
        }
      });
    };

    //GETTING REFRESH TOKEN STILL NOT TESTED
    //TODO: TEST GETTING REFRESH TOKEN
    var errorCallback = function(response, message) {
      if (response.statusCode == 401) {
        var refresh_token = $window.sessionStorage.refresh_token;
        $http({
          method: 'GET',
          url: server_url + 'refresh_token',
          params: {
            refresh_token: refresh_token
          }
        }).then(
          function success(response) {
            $window.sessionStorage.access_token = response.data.access_token;
            console.log(response.access_token);
          },
          function error(response) {
            console.log("Tried refresh and failed");
            console.log(response);
          }
        );
      } else {
        console.log(message);
      }
    };

    return {
      getUser: getUser,
      getPlayer: getPlayer,
      player: player,
      search: search,
      errorCallback: errorCallback
    };
  }
]);
