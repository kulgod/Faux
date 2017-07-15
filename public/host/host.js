var host = angular.module('host', [])
  .config( function($locationProvider) {
    $locationProvider.hashPrefix('');
  })
  .controller('HostController', [ '$scope', '$location',
  function HostController($scope, $location) {
    var init = function () {
      $scope.tokens = $location.search(); //access_token and refresh_token
    }
    init();

    
  }]);
