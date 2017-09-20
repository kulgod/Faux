angular.module('join', ['ng-spotify', 'ngRoute'])
  .config( function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
      .when('/listen', {
        templateUrl: '/templates/listen.html'
      })
      .when('/queue', {
        templateUrl: '/templates/queue.html',
      })
      .when('/session', {
        templateUrl: '/templates/listen.html',
      })
      .otherwise('/listen');
  });
