angular.module('host', [])
  .config( function($locationProvider) {
    $locationProvider.hashPrefix('');
  });
