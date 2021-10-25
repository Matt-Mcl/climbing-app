const express = require("express");
const climbing = require("./functions/climbing.js");
const graph = require("./functions/graph.js");
const path = require('path');
const cors = require('cors')
const {MongoClient} = require('mongodb');

// Setup Mongo client
const mongoClient = new MongoClient('mongodb://127.0.0.1:27017');
mongoClient.connect(() => {
  console.log(`MongoDB client connected`);
  saveClimbing();
});

const climbingdb = mongoClient.db('climbingapp');
const climbingData = climbingdb.collection('climbingdata');

// Setup webserver
const app = express();
const PORT = 8080;
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../frontend/build')));

app.get("/data", async (req, res) => res.json(await climbingData.find().toArray()));

app.get("/getclimbingcount", async function (req, res) {
  const [count, capacity] = await climbing.getClimbingCount();
  res.json({count: count, capacity: capacity});
});  

app.get("/getgraph", async function (req, res) {
  if (req.query.type === 'default') {
    res.send(await graph.defaultGraph(climbingData, req.query.dates));
  } else if (req.query.type === 'range') {
    res.send(await graph.rangeGraph(climbingData, req.query.startdate, req.query.enddate));
  } else if (req.query.type === 'average') {
    res.send(await graph.averageGraph(climbingData, req.query.day, req.query.show));
  } else {
    res.send({error: 'No or invalid graph type provided'});
  }
});

app.use(require('express-status-monitor')({
spans: [{
  interval: 1,            // Every second in hour
  retention: 3600
}, {
  interval: 60,            // Every minute in day
  retention: 1440
}, {
  interval: 3600,           // Every hour in week
  retention: 168
}],
}));

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
});

// Retrieves components of the current date and time
function getDateTime() {
  let date = new Date();
  let locale = date.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' });

  let hours = locale.slice(-8).substring(0, 2);
  let minutes = locale.slice(-5).substring(0, 2);

  return [date, locale, hours, minutes]
}

// Saves climbing data to database every 5 minutes
async function saveClimbing() {
    
  let [date, locale, hours, minutes] = getDateTime();

  // Removes seconds
  locale = locale.substring(0, locale.length - 3);

  let timeoutMinutes = 5 - (date.getMinutes() % 5);
  setTimeout(saveClimbing, timeoutMinutes * 60 * 1000);

  if (date.getMinutes() % 5 === 0 && (!(hours >= 22 || hours <= 9) || (hours === '22' && minutes < 5))) {
      const [count] = await climbing.getClimbingCount();
      console.log(`Logged [Climbing count: ${locale} | ${count}]`);
      climbingData.insertOne({ _id: locale, count: count}, (err, result) => { });
  }
}
