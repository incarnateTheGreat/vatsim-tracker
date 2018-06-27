const graphql = require('graphql'),
      mongoose = require('mongoose'),
      airportsSchema = require('./airportsSchema'),
			icaoArr = require('../../data/airports.json')

const { GraphQLObjectType,
				GraphQLString,
				GraphQLSchema } = graphql,
        db = mongoose.connection

const IcaoType = new GraphQLObjectType({
	name: 'icao',
	fields: () => ({
		icao: { type: GraphQLString },
		name: { type: GraphQLString },
		lat: { type: GraphQLString },
		lon: { type: GraphQLString },
		country: { type: GraphQLString }
	})
})

const RootQuery = new GraphQLSchema({
  query: new GraphQLObjectType({
  	name: 'RootQueryType',
    description: 'Airport ICAO data',
  	fields: {
  		icao: {
  			type: IcaoType,
  			args: { icao: { type: GraphQLString }},
  			resolve (parent, args) {
          // Return results to GraphQL.
          if (db.readyState === 1) {
            return airportsSchema.findOne({ icao: args.icao.toUpperCase() })
              .then(res => res)
          } else {
            console.log('Error: not connected to the database.')
          }
  			}
  		}
  	}
  })
})

module.exports = RootQuery
