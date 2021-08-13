const express = require("express");
const redis = require("redis");
const redisScan = require("node-redis-scan");
const cors = require('cors')
const climbing = require("./functions/climbing.js");
const data = require("./functions/data.js");
const graph = require("./functions/graph.js");
const path = require('path');


// Setup Redis client
const redisClient = redis.createClient();

redisClient.on("connect", function () {
  console.log("Redis client connected");
});

const scanner = new redisScan(redisClient);

// Setup webserver
const app = express();
const PORT = 8080;
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../frontend/build')));

let router;
function setupRouter() {
  router = new express.Router();

//   router.get("/", (req, res) => res.send("Hello World!"));

  router.get("/data", async (req, res) => res.json(await data.getData(redisClient, scanner)));

  router.get("/getclimbingcount", async function (req, res) {
    const [count, capacity] = await climbing.getClimbingCount();
    res.json({count: count, capacity: capacity});
  });  

  router.get("/getgraph", async function (req, res) {
    if (req.query.type === 'average') {
      res.send(await graph.averageGraph(redisClient, scanner, [req.query.day, req.query.show]));
    } else if (req.query.type === 'default') {
      res.send(await graph.regularGraph(redisClient, scanner, req.query.dates.split(',')));
    } else {
      res.send({error: 'No or invalid graph type provided'});
    }
  }); 

  // All other GET requests not handled before will return our React app
  router.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

app.use(function replaceableRouter(req, res, next) {
  router(req, res, next);
});

//Start Express router
setupRouter();
