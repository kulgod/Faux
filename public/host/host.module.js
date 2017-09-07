angular.module('host', ['ng-spotify'])
  .config( function($locationProvider) {
    $locationProvider.hashPrefix('');
  });
