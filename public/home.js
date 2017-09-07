var app = angular.module('home', ['ngRoute']);

app.controller('JoinController', ['$scope','$http','$window', '$httpParamSerializer',
  function JoinController($scope, $http, $window, $httpParamSerializer) {
    var server_url = 'http://localhost:8888/api/';
    $scope.user = '';
    $scope.code = '';

    $scope.joinLogin = function() {
      $http({
        method: 'GET',
        url: server_url + 'join',
        params: {
          user: $scope.user,
          code: $scope.code
        }
      }).then(
        function success(response) {
          var query = $httpParamSerializer({
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            session: response.data.session
          });
          $window.open('/join/#?' + query, '_self');
        }
      );
    };
  }
]);

app.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: 'home.html'
    })
    .when('/join-login', {
      templateUrl: 'join-login.html',
      controller: 'JoinController'
    })
    .otherwise('/home');
});
