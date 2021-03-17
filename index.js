require('dotenv').config();
const port = process.env.PORT || 5000;
const API_URL_AIRPORTS = "https://open-atms.airlab.aero/api/v1/airac/airports/";
const API_KEY = process.env.AIRLAB_API_KEY;
const express = require("express");
const app = express();
var rp = require('request-promise');


app.get("/", (req, res) => {
  console.log(API_KEY);
  res.send("Express API server is up and running.");
})

app.get("/api/v1/busy-waypoints", (req, res) => {
  const finalResultForJSON = [];
  
  var options = {
    uri: API_URL_AIRPORTS,
    headers: {
      'User-Agent': 'Request-Promise',
      'api-key': API_KEY
    },
    json: true // Automatically parses the JSON string in the response
  };

  async function doRequests() {
    let response;

    // Part 1
    response = await rp(options);

    const airportMap = new Map();
    for (var airport of response) {
      airportMap.set(airport.name, new Map());
    }


    // Part 2
    for (let airportName of airportMap.keys()) {
      options.uri = "https://open-atms.airlab.aero/api/v1/airac/sids/airport/" + airportName;
      response = await rp(options);

      if (response !== null && Object.keys(response).length > 0) {
        // Count the number of waypoints associated with this airport (store as map)
        const waypointMap = new Map();
        for (let sid of response) {
          for (let wp of sid.waypoints) {
            if (!waypointMap.has(wp.name)) {
              waypointMap.set(wp.name, 1);
            } else {
              waypointMap.set(wp.name, waypointMap.get(wp.name) + 1);
            }
          }
        }

        // Return a sorted array from the waypoints map
        const sortedWaypointsArr = [...waypointMap.entries()].sort((a, b) => b[1] - a[1]);

        // Extract out the top 2 waypoints
        const tempArr = [];
        for (var i = 0; i < 2; i++) {
          if (sortedWaypointsArr[i].length > 1) {
            const topWaypointsObj = {
              name: sortedWaypointsArr[i][0],
              count: sortedWaypointsArr[i][1],
            }
            tempArr.push(topWaypointsObj);
          } else {
            console.log("Unable to retrieve waypoint counts.");
          }
        }

        const finalObj = {
          airport: airportName,
          topWaypoints: tempArr
        }

        finalResultForJSON.push(finalObj);
      }
    }

    console.log(JSON.stringify(finalResultForJSON));
    res.send(JSON.stringify(finalResultForJSON));
    
  }

  doRequests()
  .catch(err => console.log(err));
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})

