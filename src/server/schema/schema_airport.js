const graphql = require('graphql');
const mongoose = require('mongoose');
const airportsSchema = require('./airportsSchema');

const { GraphQLObjectType,
		GraphQLString,
		GraphQLSchema } = graphql;
const db = mongoose.connection;

const IcaoType = new GraphQLObjectType({
	name: 'icao',
	fields: () => ({
		icao: { type: GraphQLString },
		name: { type: GraphQLString },
		lat: { type: GraphQLString },
		lng: { type: GraphQLString },
		country: { type: GraphQLString }
	})
})

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	description: 'Airport ICAO data',
	fields: {
		icao: {
			type: IcaoType,
			args: { icao: { type: GraphQLString }},
			resolve (_, args) {
				// Return results to GraphQL.
				if (db.readyState === 1) {
					return airportsSchema.findOne({ icao: args.icao.toUpperCase() }).then(res => res)
				} else {
					console.log('Error: not connected to the database.')
				}
			}
		}
	}
})

module.exports = new GraphQLSchema({
	query: RootQuery
})