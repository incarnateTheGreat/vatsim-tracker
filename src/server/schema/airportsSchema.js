const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      airportsSchema = new Schema({
        icao: String,
        name: String,
        lat: String,
        lng: String,
        country: String,
        done: Boolean
      })

module.exports = mongoose.model('airports', airportsSchema)
