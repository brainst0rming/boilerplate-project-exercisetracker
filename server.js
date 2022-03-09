const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {Schema} = mongoose;
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: "false"}));
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: true}
});

const userSchema = new Schema({
  username: {type: String, required: true}
});

const logSchema = new Schema({
  username: {type: String, required: true},
  count: {type: Number, required: true},
  log: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: String, required: true}
  }]
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  if (!username) {
    res.json({error: "Username required"});
    return;
  }
  let newUser = new User({ username: req.body.username });
  newUser.save((err, savedUser) => {
    if (err) {
      console.error(err);
      res.json({error: "USER DID NOT SAVE"});
    }
    else {
      console.log(savedUser);
      res.json({
        username: savedUser.username,
        _id: savedUser._id
      });
    }
  });
});

// Add exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  
});

// GET user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
