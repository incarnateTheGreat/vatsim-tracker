const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const AirportSchema = new Schema({
  "code": String,
  "lat": String,
  "lon": String,
  "name": String,
  "city": String,
  "state": String,
  "country": String,
  "woeid": Number,
  "tz": String,
  "phone": String,
  "type": String,
  "email": String,
  "url": String,
  "runway_length": Number,
  "elev": Number,
  "icao": String,
  "direct_flights": Number,
  "carriers": Number
})

const Airport = mongoose.model('Airport', AirportSchema)

module.exports = Airport
