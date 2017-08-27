angular.module('join', [])
  .config(function($locationProvider) {
    $locationProvider.hashPrefix('');
  });
