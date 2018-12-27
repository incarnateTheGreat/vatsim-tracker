const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      firSchema = new Schema({
        icao: String,
        isOceanic: Boolean,
        isExtension: Boolean,
        points: Object,
        region: String,
        country: String,
        done: Boolean
      })

module.exports = mongoose.model('fir', firSchema, 'fir')
