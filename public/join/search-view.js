angular.module('join').component('searchView', {
  templateUrl: '/templates/search-view.html',
  controller: ['$window', '$scope', 'spotify', SearchController]
});

function SearchController($window, $scope, spotify) {
  var self = this;
  self.keywords = "";
  self.results = [];

  var defaultSearchType = 'artist,album,track';
  function pushItems(items) {
    var ret = [];
    items.forEach(function(t) {
      ret.push({
        name: t.name,
        type: 'track',
        artists: reduceArtists(t.artists),
        popularity: t.popularity
      });
    });
    return ret;
  }

  self.search = function() {
    if (self.keywords.length != 0) {
      spotify.search($window.sessionStorage.access_token, self.keywords,defaultSearchType,5).then(
        function success(response) {
          var tracks = response.data.tracks;
          var artists = response.data.artists;
          var albums = response.data.albums;
          self.results = pushItems(tracks.items);
        },
        function error(response) {
          spotify.errorCallback(response, "ActionController: error searching for " + self.keywords);
          self.results = [];
        }
      );
    } else {
      self.results = [];
    }
  };
}
