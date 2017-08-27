var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/JukeBaux');

var sessionSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  host: String,
  access_token: String,
  refresh_token: String,
  started_at: Date
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
