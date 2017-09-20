angular.module('host').component('playerView', {
  templateUrl: '/templates/player-view.html',
  controller: ['$window', '$scope', '$timeout', 'spotify', ActionController]
});

function ActionController($window, $scope, $timeout, spotify) {
  $scope.song_id = '';
  $scope.currentSong = {
    name: "No Song Currently Playing",
    album_url: "/res/img/default-artwork.png",
    is_playing: false,
    progress: 0
  };
  $scope.previous = function() { player('previous'); };
  $scope.play = function() { player('play'); };
  $scope.pause = function() { player('pause'); };
  $scope.next = function() { player('next'); };

  function player(endpoint) {
    var access_token = $window.sessionStorage.access_token;
    spotify.player(access_token, endpoint).then(
      function successCallback(response) {
        $timeout(function() {
          getPlayer();
        }, 500);
      },
      function errorCallback(response) {
        spotify.errorCallback(response, "ActionController: error using endpoint /" + endpoint)
      }
    );
  }

  function getPlayer() {
    var access_token = $window.sessionStorage.access_token;
    spotify.player(access_token, 'currently-playing').then(
      function successCallback(response) {
        var data = response.data;
        if (data.item != undefined) {
          $scope.song_id = data.item.id;
          $scope.currentSong = {
                name: data.item.name,
                artists: reduceArtists(data.item.artists),
                album_url: data.item.album.images[1].url,
                is_playing: data.is_playing,
                progress: data.progress_ms
          };
        } else {
          $scope.currentSong = {
            name: "No Song Currently Playing",
            album_url: "/res/img/default-artwork.png",
            is_playing: false,
            progress: 0
          };
        }
      },
      function errorCallback(response) {
        spotify.errorCallback(response, "ActionController: error receiving player info");
      }
    );
  }

  var socket = io.connect('http://localhost:8888');

  this.$onInit = function () {
    var init_time = Date.now();

    socket.on('message', function(data) {
      if (data.message) console.log('Received from Server: ' + data.message);
      else console.log(data);
    });

    socket.emit('start', {
      session: $window.sessionStorage.sessionId,
      access_token: $window.sessionStorage.access_token
    });

    socket.on('stream', function(data) {
      console.log(init_time);
      if (data.is_playing) {
        if (data.song_id != $scope.song_id) {
          getPlayer();
        } else {
          $scope.$apply(function() {
            $scope.currentSong.progress = data.progress;
            $scope.currentSong.is_playing = data.is_playing;
          });
        }
      } else {
        $scope.$apply(function() {
          $scope.currentSong.is_playing = data.is_playing;
        });
      }
    });
  }

  this.$onDestroy = function() {
    socket.emit('end');
    socket.close();
    console.log('destroyed');
  }
}

function reduceArtists(artists) {
  var ret = '';
  artists.forEach(function (a) {
    ret = ret + a.name + ', ';
  });
  return ret.substring(0,ret.length-2);
}
