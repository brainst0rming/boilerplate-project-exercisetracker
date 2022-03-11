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

const userSchema = new Schema({
  username: {type: String, required: true},
  exerciseLog: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: Date, required: true},
    _id: false
  }]
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.route('/api/users')
  // GET all users
  .get(async (req, res) => {
    console.log("--GETTING ALL USERS...");
    try {
      let query = await User.find({}, '_id username __v').exec();
      console.log("QUERY SUCCESS");
      res.json(query);
    }
    catch (err) {
      console.log("QUERY FAILURE");
      console.error(err);
      res.send("<h1>Error: Search query failed</h1>");
    }
    finally {
      console.log();
    }
  })
  // Create a new user
  .post(async (req, res) => {
    try {
      console.log("--CREATING NEW USER");
      console.log(`Checking input username: ${req.body.username}`);
      if (!req.body.username) throw new Error("Username required");

      let newUser = new User({ 
        username: req.body.username,
        exerciseLog: []
      });
      console.log('New user created:');
      console.log(newUser);

      console.log("Saving new user...");
      let savedUser = await newUser.save();
      console.log("Saved user!");

      console.log("USER CREATION SUCCESS");
      res.json({
        username: savedUser.username,
        _id: savedUser._id
      });
    }
    catch (err) {
      console.log("USER CREATION FAILED");
      res.send(`<h1>${err}</h1>`)
    }
    finally {
      console.log();
    }
  }
  );

// When no ID is provided while creating an exercise
app.post('/api/users//exercises', (req, res) => {
  res.send("<h1>Error: ID required</h1>");
});

// Add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  const checkID = id => {
    return new Promise((resolve, reject) => {
      User.findById(mongoose.Types.ObjectId(id), (err, result) => {
        if (err) {
          reject("Error: findByID not successful");
        }
        else if (!result) {
          reject("Error: No ID match");
        }
        else {
          console.log("Checked ID, User Found");
          resolve(result);
        }
      });
    });
  }

  const checkDescription = description => {
    return new Promise((resolve, reject) => {
      if (!description) reject("Error: Description required");
      else {
        console.log("Checked Description");
        resolve(description);
      }
    });
  };

  const checkDuration = duration => {
    return new Promise((resolve, reject) => {
      if (!duration) reject("Error: Duration required");
      else if (!Number(duration)) reject("Error: Duration should be a number");
      else {
        console.log("Checked Duration");
        resolve(Number(duration));
      }
    });
  };

  const checkDate = date => {
    return new Promise((resolve, reject) => {
      if (!date) {
        console.log("Checked Date");
        resolve(new Date());
      }
      else if (new Date(date).getDay()) resolve(new Date(date));
      else reject("Error: Invalid Date");
    });
  };

  try {
    console.log("--TRYING TO ADD EXERCISE...");
    console.log(`Inputs (ID, desc, dur, date): ${req.params._id}, ${req.body.description}, ${req.body.duration}, ${req.body.date}`);
    let checkedInputs = await Promise.all([checkID(req.params._id), checkDescription(req.body.description), checkDuration(req.body.duration), checkDate(req.body.date)]);
    console.log(`User: ${checkedInputs[0]}`);
    console.log(`Description: ${checkedInputs[1]}`);
    console.log(`Duration: ${checkedInputs[2]}`);
    console.log(`Date: ${checkedInputs[3]}`);
    
    console.log("Creating new exercise entry...");
    let length = await checkedInputs[0].exerciseLog.push({
      description: checkedInputs[1],
      duration: checkedInputs[2],
      date: checkedInputs[3]
    });

    console.log("Saving the new User state...")
    let updatedUser = await checkedInputs[0].save();
    console.log(`Updated User: ${updatedUser}`);
    console.log(`[Updated User === User] is [${updatedUser === checkedInputs[0]}]`);

    console.log("ADD EXERCISE SUCCESS");
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      date: updatedUser.exerciseLog[length - 1].date.toDateString(),
      duration: updatedUser.exerciseLog[length - 1].duration,
      description: updatedUser.exerciseLog[length - 1].description
    });
  } 
  catch (err) {
    console.error(err);
    res.send(`<h1>${err}</h1>`)
  }
  finally {
    console.log();
  }
});

// GET user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  
  //console.log(id, from, to, limit);

  try {
    console.log("--GETTING A USER'S EXERCISE LOG...");
    //let JSONresponse = {};

    // Query Parameters
    let id = req.params._id;
    let from = req.query.from ? new Date(req.query.from) : new Date(0);
    let to = req.query.to ? new Date(req.query.to) : new Date();
    let limit = !Number(req.query.limit) || Number(req.query.limit) < 0 ? 9999 : Number(req.query.limit);
    console.log(`Params [ID, from, to, limit]: [${id}, ${from}, ${to}, ${limit}]`);

    // Search by id
    console.log("Aggregating ID...");
    let anAggregate = await User.aggregate()
      .match({
        _id: mongoose.Types.ObjectId(id)
      })
      .unwind("$exerciseLog")
      .sort({ "exerciseLog.date": -1 })
      .match({ 
        "exerciseLog.date": { 
          $gte: from, 
          $lte: to 
        } 
      })
      .limit(limit)
      .group({
        _id: "$_id",
        username: { $first: "$username" },
        count: { $count: { } },
        log: { $push: "$exerciseLog" }
      })
      /*.project({
        username: 1,
        from: req.query.from ? new Date(req.query.from).toDateString() : 0,
        to: req.query.to ? new Date(req.query.to).toDateString() : 0,
        count: 1,
        log: 1
      })*/
      .exec();
    console.log(anAggregate);

    for (let i = 0; i < anAggregate[0].log.length; i++) {
      anAggregate[0].log[i].date = anAggregate[0].log[i].date.toDateString();
    }
    if (req.query.from) anAggregate[0].from = new Date(req.query.from).toDateString();
    if (req.query.to) anAggregate[0].to = new Date(req.query.from).toDateString();
    
    console.log("AGGREGATION SUCCESS");
    res.json(anAggregate[0]);
  } 
  catch (err) {
    console.error(err);
    res.send(`<h1>${err}</h1>`);
  }
  finally {
    console.log();
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
