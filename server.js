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
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, required: true}
});

const userSchema = new Schema({
  username: {type: String, required: true},
  exerciseLog: [exerciseSchema]
});

/*const logSchema = new Schema({
  username: {type: String, required: true},
  count: {type: Number, required: true},
  log: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: String, required: true}
  }]
});*/

const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);
//const Log = mongoose.model('Log', logSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  Promise.resolve(req.body.username)
    .then(value => {
      return new Promise((resolve, reject) => {
        if (!value) {
          reject("Username required");
        }
        else {
          let newUser = new User({ 
            username: value,
            exerciseLog: []
          });
          resolve(newUser);
        }
      });
    })
    .then(user => {
      user.save((err, savedUser) => {
        if (err) {
          throw new Error("USER DID NOT SAVE");
        }
        else {
          res.json({
            username: savedUser.username,
            _id: savedUser._id
          });
        }
      });
    })
    .catch(err => res.send(`<h1>Error: ${err}</h1>`));

  /*let username = req.body.username;
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
  });*/
});

// When no ID is provided while creating an exercise
app.post('/api/users//exercises', (req, res) => {
  res.send("<h1>Error: ID required</h1>");
});

// Add exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  /*let id = req.body[":_id"];
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;*/

  const checkDescription = description => {
    return new Promise((resolve, reject) => {
      if (!description) reject("Description required");
      else resolve(description);
    });
  };

  const checkDuration = duration => {
    return new Promise((resolve, reject) => {
      if (!duration) reject("Duration required");
      else if (!Number(duration)) reject("Duration should be a number");
      else resolve(Number(duration));
    });
  };

  const checkDate = date => {
    return new Promise((resolve, reject) => {
      if (!date) resolve(new Date());
      else if (new Date(date).getDay()) resolve(new Date(date));
      else reject("Invalid Date");
    });
  };

  Promise.all([checkDescription(req.body.description), checkDuration(req.body.duration), checkDate(req.body.date)])
    .then(values => {
      // Create Exercise

      
      res.json({
        description: values[0],
        duration: values[1],
        date: values[2]
      });
    }
  )
  .catch(err => res.send(`<h1>Error: ${err}</h1>`));

  /*if (!description) {
    res.json({error: "Description required"});
    return;
  }
  else if (!duration) {
    res.json({error: "Duration required"});
    return;
  }
  else if (!Number(duration)) {
    res.json({error: "Duration should be a number"});
    return;
  }*/
  //duration = Number(duration);
  //res.send("<h1>OK</h1>");
});

// GET user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
