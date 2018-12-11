const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      firSchema = new Schema({
        icao: String,
        isOceanic: Boolean,
        isExtension: Boolean,
        points: Object,
        done: Boolean
      })

module.exports = mongoose.model('fir', firSchema)
