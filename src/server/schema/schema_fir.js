const graphql = require('graphql');
const mongoose = require('mongoose');
const FirSchema = require('./firSchema');

const { GraphQLObjectType,
		GraphQLString,
		GraphQLBoolean,
		GraphQLSchema,
		GraphQLScalarType,
		GraphQLList } = graphql;
const db = mongoose.connection;

const resolvers = {
	Coordinates: new GraphQLScalarType({
		name: 'Coordinates',
		description: 'A set of coordinates: x & y',
		serialize(value) {			
			const [x,y] = value.map(val => parseFloat(val));
			
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
		points: { type: new GraphQLList(resolvers.Coordinates) },
		region: { type: GraphQLString },
		country: { type: GraphQLString },
	})
})

let query = { "icao": { "$in": null } };
const params = { icao: 1, points: 1 };

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	description: 'FIR data',
	fields: {
		points: {
			type: new GraphQLList(FirType),
			args: { icao: { type: GraphQLString }},
			resolve (_, args) {
				query['icao']['$in'] = args.icao.toUpperCase().split(',');
				
				// Return results to GraphQL.					
				if (db.readyState === 1) {
					return FirSchema.find(query).then(res => res)
				} else {
					console.log('Error: not connected to the database.')
				}
			}
		}
	}
});

module.exports = new GraphQLSchema({
	query: RootQuery
});
