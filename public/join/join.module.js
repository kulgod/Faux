angular.module('join', ['ng-spotify'])
  .config(function($locationProvider) {
    $locationProvider.hashPrefix('');
  });
