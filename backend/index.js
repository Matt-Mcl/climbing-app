const express = require("express");
const climbing = require("./functions/climbing.js");
const graph = require("./functions/graph.js");
const path = require('path');
const Pool = require('pg').Pool

// Setup Postgres client
const createPool = () => {
  return new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'react_climbing',
    port: 5432,
  });
}

// Setup webserver
const app = express();
const PORT = 9080;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../frontend/build')));

app.get("/data", async function (req, res) {
  let data = [];
  try {
    const pool = createPool();
    const res = await pool.query('SELECT * FROM climbing ORDER BY datetime')
    data = res.rows;
    await pool.end();
  } catch (error) {
    console.log(error)
  }
  res.json(data);
});

app.get("/datacount", async function (req, res) {
  let count = 0;
  try {
    const pool = createPool();
    const res = await pool.query('SELECT COUNT(*) FROM climbing')
    count = res.rows[0]["count"];
    await pool.end();
  } catch (error) {
    console.log(error)
  }
  res.send(`${count} Entires`);
});

app.get("/getclimbingcount", async function (req, res) {
  const [count, capacity] = await climbing.getClimbingCount();
  res.json({count: count, capacity: capacity});
});  

app.get("/getgraph", async function (req, res) {

  let response = "";
  if (req.query.asimage)  {
    req.query.asimage = req.query.asimage.split(',')
    if (req.query.asimage[1] < 1 || req.query.asimage[2] < 1) {
      return res.send({error: 'Width and Height must be greater than 0'});
    } else if (req.query.asimage[1] > 1200 || req.query.asimage[2] > 600) {
      return res.send({error: 'Width must be less than 1200 and Height must be less than 600'});
    }
  }

  if (req.query.type === 'default') {
    response = await graph.defaultGraph(req.query.dates, req.query.asimage);
  } else if (req.query.type === 'range') {
    response = await graph.rangeGraph(req.query.startdate, req.query.enddate, req.query.asimage);
  } else if (req.query.type === 'average') {
    response = await graph.averageGraph(req.query.day, req.query.show, req.query.asimage);
  } else {
    return res.send({error: 'No or invalid graph type provided'});
  }

  if (response.error) res.status(400);

  if (!req.query.asimage || req.query.asimage[0] !== 'true' || response.error) {
    res.send(response);
  } else {
    res.sendFile(path.resolve(__dirname, 'exportchart.png'));
  }
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'), (error) => {
    if (error) res.send('<h1>Website Rebuilding, please wait.</h1>');
  });
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
    try {
      const pool = createPool();
      const res = await pool.query('INSERT INTO climbing (datetime, count) VALUES ($1, $2)', [locale, count])
      await pool.end();
    } catch (error) {
      console.log(error)
    }
  }
}

saveClimbing();
