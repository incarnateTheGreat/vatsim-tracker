const express = require('express'),
			app = express(),
			cors = require('cors'),
			request = require('request');

// Enable cross-origin resource sharing.
app.use(cors());

app.listen(8000, () => {
  console.log('Server started!');
});

app.route('/api/vatsim-data').get((req, res) => {
	request('http://info.vroute.net/vatsim-data.txt', (error, response, body) => {
		const lines = body.split('\n');
					results = [];

		let isRecording = false;

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

		res.send(results);
	});
});
