const graphql = require('graphql'),
      mongoose = require('mongoose'),
      firSchema = require('./airportsSchema')

const { GraphQLObjectType,
        GraphQLString,
        GraphQLSchema } = graphql,
        db = mongoose.connection

const FirType = new GraphQLObjectType({
	name: 'fir',
	fields: () => ({
        icao: { type: GraphQLString },
        isOceanic: { type: GraphQLString },
        isExtension: { type: GraphQLString },
        points: { type: GraphQLString }
	})
})

const RootQuery = new GraphQLSchema({
  query: new GraphQLObjectType({
  	name: 'RootQueryType',
    description: 'FIR data',
  	fields: {
  		icao: {
  			type: FirType,
  			args: { icao: { type: GraphQLString }},
  			resolve (parent, args) {                  
                // Return results to GraphQL.
                if (db.readyState === 1) {
                    console.log(args);
                    
                //     return firSchema.findOne({ icao: args.icao.toUpperCase() })
                //     .then(res => res)
                } else {
                //     console.log('Error: not connected to the database.')
                }
  			}
  		}
  	}
  })
})

module.exports = RootQuery
