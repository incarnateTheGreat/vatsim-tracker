const graphql = require('graphql'),
			icaoArr = require('../../data/airports.json')

const { GraphQLObjectType,
				GraphQLString,
				GraphQLSchema } = graphql

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
    description: 'This is a Description that we can add to later.',
  	fields: {
  		icao: {
  			type: IcaoType,
  			args: { icao: { type: GraphQLString }},
  			resolve (parent, args) {
  				return icaoArr.find(icaoObj => icaoObj.icao === args.icao.toUpperCase())
  			}
  		}
  	}
  })
})

module.exports = RootQuery
