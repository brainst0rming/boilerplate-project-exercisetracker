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

const exercise = mongoose.model('Exercise', exerciseSchema);
const user = mongoose.model('User', userSchema);
const log_ = mongoose.model('Log', logSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
