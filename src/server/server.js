const express = require('express'),
			app = express(),
			cors = require('cors'),
			request = require('request'),
			graphqlHTTP = require('express-graphql'),
			schema_airport = require('./schema/schema_airport'),
			schema_fir = require('./schema/schema_fir'),
			mongoose = require('mongoose'),
			SleepTime = require('sleeptime'),
			CONSTANTS = require('../constants/constants'),
			{ CLIENT_LABELS, VATSIM_SERVERS } = CONSTANTS

require('dotenv').config()

const sleepy = new SleepTime((diff,date) => {
	console.log(`System slept for ${diff} seconds and woke up at ${date}`);
}, 5000)

function checkFlightPosition(clientInterface) {
	return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
			(isNaN(clientInterface.latitude) || clientInterface.latitude === ''))
}

// Enable cross-origin resource sharing.
app.use(cors())

app.listen(8000, () => {
	console.log('Express & GraphQL servers started!')
	mongoose.connect(`mongodb://127.0.0.1:27017/airports`)
})

// Connect to the VATSIM Data, render all Flights/Controllers, and thend dispatch to the front-end.
app.route('/api/vatsim-data').get((req, res) => {
  console.log('------------------------------------------------------------');
	console.log('Get VATSIM Data...');
	
	// Get random path to avoid hitting the same VATSIM server over and over.
	const vatsim_path = VATSIM_SERVERS[Math.floor(Math.random() * VATSIM_SERVERS.length)]

	request(vatsim_path, (error, response, body) => {
		if (body) {
			const lines = body.split('\n');
			const results = []

			let isRecording = false;
			let flights = [];

			// Go line by line to find CLIENTS data.
			for(let line = 0; line < lines.length; line++) {
				// When the '!CLIENTS:' line is found, begin recording data.
				if (lines[line] === '!CLIENTS:\r') {
					isRecording = true;
				} else if (lines[line] === ';\r') {
					isRecording = false;
				}

				// Skip the '!CLIENTS:' line to avoid adding to the results array.
				if (isRecording && lines[line] !== '!CLIENTS:\r') {
					results.push(lines[line]);
				}
			}

			for (let i = 0; i < results.length; i++) {
				let clientInterface = {};
				let clientDataSplit = results[i].split(':');

				// Using the CLIENT_LABELS Interface, assign each delimited element to its respective key.
				for (let j = 0; j < CLIENT_LABELS.length; j++) {					
					clientInterface[CLIENT_LABELS[j]] = clientDataSplit[j];
				}

				// If the Flight doesn't have a recorded LAT/LNG, do not add it to the array.
				if (!checkFlightPosition(clientInterface)) {
					flights.push({
						isController: clientInterface.frequency !== "" ? true : false,
						name: clientInterface.realname,
						callsign: clientInterface.callsign,
						coordinates: [parseFloat(clientInterface.latitude), parseFloat(clientInterface.longitude)],
						frequency: clientInterface.frequency,
						altitude: clientInterface.altitude,
						planned_aircraft: clientInterface.planned_aircraft,
						heading: clientInterface.heading,
						groundspeed: clientInterface.groundspeed,
						transponder: clientInterface.transponder,
						planned_depairport: clientInterface.planned_depairport,
						planned_destairport: clientInterface.planned_destairport,
						planned_route: clientInterface.planned_route
					})
				}
			}			

			// Separate the Controllers & Destinations from the Flights.
			const controllers = flights.filter(client => client.frequency !== '')
			const icaos = [];

			// Create Destinations Object.
			const icaos_temp = flights.reduce((r, a) => {
				const icao_destination = a.planned_destairport.toUpperCase(),
					  icao_departure = a.planned_depairport.toUpperCase()

				if (icao_destination !== '') {
					r[icao_destination] = r[icao_destination] || []
					r[icao_destination].push(a)
				}

				if (icao_departure !== '') {
					r[icao_departure] = r[icao_departure] || []
					r[icao_departure].push(a)
				}

				return r
			}, {});

			// Put Departure & Destination ICAOs into Array.
			for (let key in icaos_temp) icaos.push(key)

			console.log('Number of Lines:', lines.length);
			console.log('Number of results:', results.length);
			console.log('Number of ICAOS:', icaos.length);

			res.send({flights, controllers, icaos})
		} else {
			console.log('Not working...');
			
			res.send(null);
		}
	})
})

app.use('/api/metar/:metar', (req, res) => {
  const metar = req.params['metar'].toUpperCase()

  request(`http://metar.vatsim.net/metar.php?id=${metar}`, (error, response, body) => {
    if (body.includes('No METAR available')) {
      res.send(null)
    } else {
      res.send(body)
    }
  })
})

// TODO: DECIDE WHETHER OR NOT TO KEEP THIS.
app.use('/api/decodeRoute', (req, res) => {
	const { origin,
			route,
			destination } = req.query

	// Join strings together, remove commas and replace them with spaces. 
	const routeStr = [origin, route, destination]
						.join(',')
						.match(/[^ ,]+/g)
						.join(' ');

	const options = {
		url: 'https://api.flightplandatabase.com/auto/decode',
		method: 'POST',
		form: { route: routeStr },
		headers: { 'Authorization': 'Basic EEX0ovsK0oa4SDYT1g4XqOOZEnKvU6e9yj0ZhX9Q' }
	};

	// ****** DEVELOPMENT USE ONLY! REMOVE WHEN IN PRODUCTION *******
	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

	request(options, (error, response, body) => {
		body ? res.send(body) : res.send(null)
	})
})

app.use('/graphql/fir', graphqlHTTP((req, res, graphQLParams) => {
	const { icao, params } = req.query;
	const query = `{points(icao: "${icao}"){${params}}}`		

	// Assemble query string and put it into the graphQLParams object for insertion
	// in to GraphQL Schema, which will then contact MongoDB via Mongoose and then
	// return results.
	
	// Checking for 'undefined' prevents GraphiQL from crashing.
	if (icao !== undefined) {
		graphQLParams.query = query
	}

	return ({
		schema: schema_fir,
		rootValue: query,
		graphiql: true
	});
}));

// Use GraphQL to retrieve Coordinates data for selected Destination.
app.use('/graphql/airports', graphqlHTTP((req, res, graphQLParams) => {
	const { icao, params } = req.query;
	const query = `{icao(icao: "${icao}"){${params}}}`;

	// Assemble query string and put it into the graphQLParams object for insertion
	// in to GraphQL Schema, which will then contact MongoDB via Mongoose and then
	// return results.
	
	// Checking for 'undefined' prevents GraphiQL from crashing.
	if (icao !== undefined) {
		graphQLParams.query = query
	}

	return ({
		schema: schema_airport,
		rootValue: query,
		graphiql: true
	});
}));