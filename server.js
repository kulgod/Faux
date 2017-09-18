/**
 * This node.js script performs the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts, then installs handlers for each of the event listeners on the site.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var keys = require('./keys.config');

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var socket_io = require('socket.io');  //Socket.io websockets framework
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = keys['keys']['client_id']; // Your client id
var client_secret = keys['keys']['client_secret']; // Your secret
var redirect_uri = keys['keys']['redirect_uri']; // Your redirect uri

var mongoose = require('mongoose');
var Session = require('./session');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var getCodeFromArtists = function(artists, length) {
  var artist = artists[Math.floor(Math.random() * length)].name;
  var keys = artist.split(' ');
  var keyword = keys.sort(function(a,b) { return b.length - a.length })[0]
  return keyword.toLowerCase();
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/api/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // the application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token,
            expires_in = body.expires_in;
        var sessionId = generateRandomString(5);

        var code_options = {
          url: 'https://api.spotify.com/v1/me/top/artists?limit=50',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        var user_options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        request.get(code_options, function(error, response, body) {
          if (!error) {
            var items = body.items;
            var total = body.total;
            sessionId = getCodeFromArtists(items, total);
          } else {
            console.log('error getting top artists');
          }
          request.get(user_options, function(error, response, body) {
            var userSession = new Session({
              id: sessionId,
              host: body.display_name,
              access_token: access_token,
              refresh_token: refresh_token,
              started_at: new Date()
            });

            userSession.save(function(err) {
              if (err) console.log(err);
              else {
                console.log("Saved Successfully");
                console.log(userSession.id);
              }
            });

            //pass the token to the browser to make requests from there
            res.redirect('/host/#?' +
              querystring.stringify({
                access_token: access_token,
                refresh_token: refresh_token,
                timeout: expires_in,
                session: sessionId
              }));
          });
        });
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/api/refresh_token', function(req, res) {
  // requesting access token from refresh token
  //TODO: Update Session document with new token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      console.log(access_token);
      res.send({
        'access_token': access_token
      });
    } else {
      res.status(response.statusCode);
      res.send(body);
      console.log(error);
    }
  });
});

app.get('/api/join', function(req, res) {
  var user = req.query.user;
  var code = req.query.code.toLowerCase();

  Session.findOne({id: code}, 'id access_token refresh_token', function(err, session) {
    if (err || !session) {
      res.status(400);
      console.log('/api/join attempt failed');
    } else {
      res.send({
        'access_token': session.access_token,
        'refresh_token': session.refresh_token,
        'session': session.id
      });
    }
  });
});

app.get('/api/getuser', function(req, res) {
  var access_token = req.query.access_token;
  var headers = {'Authorization': 'Bearer ' + access_token};
  var options = {
    url: 'https://api.spotify.com/v1/me',
    method: 'GET',
    headers: headers
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.send(body);
    } else {
      console.log("Error trying to get user profile");
      res.status(response.statusCode);
      res.send(body);
    }
  });
});

app.get('/api/search', function(req, res) {
  var access_token = req.query.access_token;
  var limit = req.query.limit || 10;
  var search_query = {
    q: req.query.search,
    type: req.query.type,
    limit: limit
  };
  var headers = {'Authorization': 'Bearer ' + access_token};

  var options = {
      url: 'https://api.spotify.com/v1/search?' + querystring.stringify(search_query),
      method: 'GET',
      headers: headers
  };

  request(options, function(error, response, body) {
    var code = response.statusCode;
    if (!error && code == 200) {
      res.send(body);
    } else {
      console.log("Error searching for " + search_query.q);
      res.status(code);
      res.send(body);
    }
  });
});

function playerControl(endpoint, access_token, method, res) {

  var headers = {'Authorization': 'Bearer ' + access_token};

  var options = {
      url: 'https://api.spotify.com/v1/me/player' + endpoint,
      method: method,
      headers: headers
  };

  request(options, function(error, response, body) {
    var code = response.statusCode;
    var success = (code == 200 || code == 204);
    if (!error && success) {
      res.send(body);
    } else {
      console.log("Error trying to " + endpoint + " music");
      res.status(code);
      res.send(body);
    }
  });
}

app.get('/api/player', function(req, res) {
  playerControl('', req.query.access_token, 'GET', res);
});

app.get('/api/currently-playing', function(req, res) {
  playerControl('/currently-playing', req.query.access_token, 'GET', res);
});

app.get('/api/play', function(req, res) {
  playerControl('/play', req.query.access_token, 'PUT', res);
});

app.get('/api/pause', function(req, res) {
  playerControl('/pause', req.query.access_token, 'PUT', res);
});

app.get('/api/next', function(req, res) {
  playerControl('/next', req.query.access_token, 'POST', res);
});

app.get('/api/previous', function(req, res) {
  playerControl('/previous', req.query.access_token, 'POST', res);
});

app.get('/api/devices', function(req, res) {
  playerControl('/devices', req.query.access_token, 'GET', res);
});


console.log('Listening on 8888');
var server = app.listen(8888);

var io = socket_io.listen(server);

io.sockets.on('connection', function(socket) {
  socket.emit('message', {
    message: 'connection successful'
  });

  socket.on('start', function(data) {
    var room = data.session;
    socket.access_token = data.access_token;
    socket.join(room);
    var timeout = setInterval(pollPlayer, 2000, socket, room); //TODO: Find a way to avoid overlap in these requests

    //Creates its own stop command
    socket.on('end', function(data) {
      clearInterval(timeout);
      socket.removeAllListeners('end');
    });
  });

  socket.on('join', function(data) {
    socket.join(data.session);
  });

});

var pollPlayer = function(socket, room) {
  var options = {
      url: 'https://api.spotify.com/v1/me/player',
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + socket.access_token}
  };
  request.get(options, function(error, response, body) {
    var code = response.statusCode;
    var success = (code == 200 || code == 204);
    body = JSON.parse(body);

    if (!error && success) {
      io.sockets.in(room).emit('stream', {
        is_playing: body.is_playing,
        progress: body.progress_ms,
        song_id: body.item.id
      });
    } else {
      console.log(Date.now(), "Error trying to poll player");
    }
  });
};
