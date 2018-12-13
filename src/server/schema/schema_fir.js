const graphql = require('graphql'),
	  mongoose = require('mongoose'),
	  firSchema = require('./firSchema')

const db = mongoose.connection,
	{ GraphQLObjectType,
		GraphQLString,
		GraphQLBoolean,
		GraphQLSchema,
		GraphQLScalarType,
		GraphQLList } = graphql

const resolvers = {
	Coordinates: new GraphQLScalarType({
		name: 'Coordinates',
		description: 'A set of coordinates: x & y',
		serialize(value) {
			const [x,y] = value.map(val => parseFloat(val))
			
			return [x, y];
		}
	})
}

const FirType = new GraphQLObjectType({
	name: 'fir',
	fields: () => ({
		icao: { type: GraphQLString },
		isOceanic: { type: GraphQLBoolean },
		isExtension: { type: GraphQLBoolean },
		points: { type: new GraphQLList(resolvers.Coordinates) }
	})
})

const RootQuery = new GraphQLSchema({
  query: new GraphQLObjectType({
  	name: 'RootQueryType',
    description: 'FIR data',
  	fields: {
  		points: {
  			type: FirType,
  			args: { icao: { type: GraphQLString }},
  			resolve (parent, args) {
				// Return results to GraphQL.					
				if (db.readyState === 1) {						
					return firSchema.findOne({ icao: args.icao.toUpperCase() }).then(res => res)
				} else {
					console.log('Error: not connected to the database.')
				}
  			}
  		}
  	}
  })
})

module.exports = RootQuery
