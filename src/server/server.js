const express = require('express'),
			app = express(),
      path = require('path'),
			cors = require('cors'),
			request = require('request'),
      DataLoader = require('dataloader'),
      graphql = require('graphql'),
			graphqlHTTP = require('express-graphql'),
			schema = require('./schema/schema'),
      // TODO: Try to implement the airports.json data in to MongoDB or maybe Firebase?
      // mongoose = require('mongoose'),
      // mongodb = require('mongodb'),
      // airportsSchema = require('../schema/airportsSchema.js'),
			CONSTANTS = require('../constants/constants.js'),
			{ CLIENT_LABELS } = CONSTANTS

require('dotenv').config()

function checkFlightPosition(clientInterface) {
	return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
					(isNaN(clientInterface.latitude) || clientInterface.latitude === ''))
}

// Enable cross-origin resource sharing.
app.use(cors())

app.listen(8000, () => {
  console.log('Express & GraphQL servers started!')
  // mongoose.connect(`mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`)
})

// const db = mongoose.connection
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', () => {
//   console.log('Mongoose connected.')
// });

// Connect to the VATSIM Data, render all Flights/Controllers, and thend dispatch to the front-end.
app.route('/api/vatsim-data').get((req, res) => {
	request('http://info.vroute.net/vatsim-data.txt', (error, response, body) => {
		const lines = body.split('\n')
					results = []

		let isRecording = false,
				flights = []

		// Go line by line to find CLIENTS data.
		for(let line = 0; line < lines.length; line++) {
			// When the '!CLIENTS:' line is found, begin recording data.
			if (lines[line] == '!CLIENTS:\r') {
				isRecording = true;
			} else if (lines[line] == ';\r') {
				isRecording = false;
			}

			// Skip the '!CLIENTS:' line to avoid adding to the results array.
			if (isRecording && lines[line] != '!CLIENTS:\r') {
				results.push(lines[line]);
			}
		}

		for (let i = 0; i < results.length; i++) {
			let clientInterface = {},
					clientDataSplit = results[i].split(':');

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
					coordinates: [parseFloat(clientInterface.longitude), parseFloat(clientInterface.latitude)],
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
		const controllers = flights.filter(client => client.frequency !== ''),
					icaos = [];

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
		}, {})

		// Put Departure & Destination ICAOs into Array.
		for (let key in icaos_temp) icaos.push(key)

		res.send({flights, controllers, icaos})
	})
})

// Use GraphQL to retrieve Coordinates data for selected Destination.
app.use('/graphql', graphqlHTTP((req, res, graphQLParams) => ({
  schema,
  rootValue: graphQLParams,
  graphiql: true
})));
