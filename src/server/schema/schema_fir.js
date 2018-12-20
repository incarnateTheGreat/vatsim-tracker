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
			const [x,y] = value.map(val => parseFloat(val))

			console.log('serial', [x,y]);
			
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

let query = { "icao": { "$in": null } };
const params = { icao: 1, points: 1 };

const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	description: 'FIR data',
	fields: {
		points: {
			type: FirType,
			args: { icao: { type: GraphQLString }},
			resolve (_, args) {
				query['icao']['$in'] = args.icao.toUpperCase().split(',');
				
				// Return results to GraphQL.					
				if (db.readyState === 1) {
					return FirSchema.find(query, params).then(res => res)
					// return FirSchema.find(query, params).then(res => {
					// 	for (let x in res) {
					// 		console.log(res[x]);
					// 		return res[x]
					// 	}
					// })
				} else {
					console.log('Error: not connected to the database.')
				}
			}
		}
		// ,
		// allPoints: {
		// 	type: { type: new GraphQLList(resolvers.Coordinates) },
		// 	args: { point: { type: GraphQLString } },
		// 	resolve(_, args) {
		// 		console.log(args);
				
		// 		return true
		// 	}
		// }
	}
});

module.exports = new GraphQLSchema({
	query: RootQuery
});
