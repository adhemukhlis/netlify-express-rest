global.fetch = require("node-fetch").default;
const express = require( "express" );
const serverless = require( "serverless-http" );
const cors = require( 'cors' );
const timestamp = new Date( ).getTime( );
var firebase = require( 'firebase' );
const { success, error } = require( "../config/responseApi" );

// const timestamp = firebase .firestore 	.FieldValue
// 	.serverTimestamp().now();
const config = {
	apiKey: "AIzaSyDkI3uplq9THqQ9019P5oj9DD36oNhKpqk",
	authDomain: "netlify-express-rest.firebaseapp.com",
	projectId: "netlify-express-rest",
	storageBucket: "netlify-express-rest.appspot.com",
	messagingSenderId: "522808349855",
	appId: "1:522808349855:web:b9c5510bc1e03b883dfeaa"
};
var firebaseInitConfig = firebase.initializeApp( config );
var firebaseFirestore = firebaseInitConfig.firestore( );

const app = express( );
const router = express.Router( );

app.use(cors( ));
app.use(express.json( ));
app.use(express.urlencoded({ extended: true }));

router.get("/test", ( req, res ) => {
	res.send({ message: '/test success!' });
});
// const getByValue = async( col, name, op, value ) => {
// 	return await firebaseFirestore
// 		.collection( col )
// 		.where( name, op, value )
// 		.get( )
// 		.then(async snapshot => {
// 			return snapshot
// 				.docs[0]
// 				.data( );

// 		})
// 		.catch(( error ) => {
// 			return undefined;
// 		})
// }
// const getByID = async( id ) => {
// 	//use await while calling getByID => await getByID('id')
// 	return await firebaseFirestore
// 		.doc( id )
// 		.get( )
// 		.then(snapshot => {
// 			const response = snapshot.data( );
// 			return response;
// 		})
// 		.catch(( error ) => {
// 			return undefined;
// 		})
// }
// const getByID2 = async( id ) => {
// 	return await(await firebaseFirestore.doc( id ).get( )).data( );

// }
const getUsers = async( ) => {
	return await firebaseFirestore
		.collection( 'users' )
		.orderBy( 'updated_at', 'desc' )
		.get( )
		.then(snapshot => {
			const response = snapshot
				.docs
				.map(( hasil ) => ({
					id: hasil.id,
					...hasil.data( )
				}));
			return response;
		})
		.catch(( error ) => {
			return undefined;
		})
}
router.get("/users", async( req, res ) => {
				getUsers( ).then(data => {
					if ( data !== undefined ) {
						res
							.status( 200 )
							.send(success( "success get users!", {
								updated_at,
								data
							}, res.statusCode ));
					} else {
						res
							.status( 500 )
							.send(error( "something was wrong!", res.statusCode ));
					}
				});
});
// router.get("/users", async( req, res ) => {
// 	if (Object.keys( req.query ).length > 0 && Object.keys( req.query ).includes( 'sync' )) {
// 		const { sync } = req.query;
// 		const unixFormat = new RegExp( '^[1-9]([0-9]{12,13}$)' );
// 		if (unixFormat.test( sync )) {
// 			const { updated_at } = await getByID( '_properties/users' );
// 			if ( parseInt( sync ) === updated_at ) {
// 				res.send(success( "looks like the data is not updated, the data is up to date!", [], 204 ));
// 			} else {
// 				getUsers( ).then(data => {
// 					if ( data !== undefined ) {
// 						res
// 							.status( 200 )
// 							.send(success( "success get users!", {
// 								updated_at,
// 								data
// 							}, res.statusCode ));
// 					} else {
// 						res
// 							.status( 500 )
// 							.send(error( "something was wrong!", res.statusCode ));
// 					}
// 				});
// 			}
// 		} else if ( sync === 'true' ) {
// 			const { updated_at } = await getByID( '_properties/users' );
// 			getUsers( ).then(data => {
// 				if ( data !== undefined ) {
// 					res
// 						.status( 200 )
// 						.send(success( "success get users!", {
// 							updated_at,
// 							data
// 						}, res.statusCode ));
// 				} else {
// 					res
// 						.status( 500 )
// 						.send(error( "something was wrong!", res.statusCode ));
// 				}
// 			});
// 		} else {
// 			console.log( 'not match' );
// 			res
// 				.status( 400 )
// 				.send(error( "must include a '?sync' query, or maybe sync value not match with unix time forma" +
// 						"t!",
// 				res.statusCode ));
// 		}
// 	} else {
// 		res
// 			.status( 400 )
// 			.send(error( "must include a '?sync' query, or sync value not match unix time format!", res.statusCode ));
// 	}
// });
// router.post("/users", ( req, res ) => {
// 	const { username, email } = req.body;
// 	firebaseFirestore.settings({ timestampsInSnapshots: true });
// 	firebaseFirestore
// 		.collection( 'users' )
// 		.add({ username, email, create_at: timestamp, updated_at: timestamp })
// 		.then(( ) => {
// 			firebaseFirestore
// 				.collection( '_properties' )
// 				.doc( 'users' )
// 				.set({ updated_at: timestamp, collection_name: 'users' });
// 			res
// 				.status( 200 )
// 				.send(success( "OK", {
// 					data: {
// 						username,
// 						email
// 					}
// 				}, res.statusCode ));
// 		})
// 		.catch(( error ) => {
// 			res.send({ error });
// 		});
// });

app.use( `/.netlify/functions/api`, router );
// app.listen(process.env.port || 4000, ( ) => {
// 	console.log( 'listening api' );
// });
module.exports = app;
module.exports.handler = serverless( app );