const express = require('express'),
			app = express(),
			cors = require('cors'),
			request = require('request'),
			airports = require('./data/airports.json'),
			CONSTANTS = require('./constants/constants.js'),
			{ CLIENT_LABELS } = CONSTANTS

function checkFlightPosition(clientInterface) {
	return ((isNaN(clientInterface.longitude) || clientInterface.longitude === '') ||
					(isNaN(clientInterface.latitude) || clientInterface.latitude === ''));
}

// Enable cross-origin resource sharing.
app.use(cors());

app.listen(8000, () => console.log('Server started!') );

// Connect to the VATSIM Data, render all Flights/Controllers, and thend dispatch to the front-end.
app.route('/api/vatsim-data').get((req, res) => {
	request('http://info.vroute.net/vatsim-data.txt', (error, response, body) => {
		const lines = body.split('\n');
					results = [];

		let isRecording = false,
				flights = [];

		for(let line = 0; line < lines.length; line++) {
			if (lines[line] == '!CLIENTS:\r') {
				isRecording = true;
			} else if (lines[line] == ';\r') {
				isRecording = false;
			}

			if (isRecording && lines[line] != '!CLIENTS:\r') {
				results.push(lines[line]);
			}
		}

		for (let i = 0; i < results.length; i++) {
			let clientInterface = {},
			clientDataSplit = results[i].split(':');

		for (let j = 0; j < CLIENT_LABELS.length; j++) {
			clientInterface[CLIENT_LABELS[j]] = clientDataSplit[j];
		}

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

		const controllers = flights.filter(client => client.frequency !== "")

		res.send({flights, controllers});
	});
});

// TODO: Create a DB and use GraphQL to query data.
app.route('/api/get-airports/:icao').get((req, res) => {
	const destination = req.params['icao'];

	const result = airports.find(airportObj => {
		return airportObj.icao.toUpperCase() === destination.toUpperCase()
	});

	res.send(result);
});
