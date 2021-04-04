global.fetch = require( "node-fetch" ).default;
const express = require( "express" );
const serverless = require( "serverless-http" );
const cors = require( 'cors' );
var responseTime = require( 'response-time' );
var routeValidator = require( 'express-route-validator' );
const {
	postHandler,
	getHandler,
	// putHandler,
	patchHandler,
	deleteHandler,
	// fetchPropertiesByName,
	// updateProperties,
	timestamp,
	unixFormat,
	toArrayResponse,
	getName
} = require( "../firerest/core.firerest" );
const { success, error } = require( "../config/responseApi" );

const redis = require( "redis" );
const client = redis.createClient( );

const app = express( );
const router = express.Router( );

app.use(cors( ));
app.use(express.json( ));
app.use(express.urlencoded({ extended: true }));
app.use(responseTime( ));
client.on( "error", function ( error ) {
	console.error( error );
});

client.set( "key", "value", redis.print );
client.get( "key", redis.print );

routeValidator.addValidator( 'isAllowSync', function ( val, config ) {
	/**  only allow milliseconds timestamp epoch (13 digits number) example: https://currentmillis.com/ and `true` value*/
	const pattern = config.pattern;
	return ( pattern.test( val ) || val === 'true' );
});

// const getResponseCache = async( name ) => {
// 	return await client.get( `_responseCache/${ name }`, function ( err, result ) {
// 		if ( result ) {
// 			console.log( result );
// 			return result;
// 		} else {
// 			console.log( 'sampe kosong' );
// 			return 0;
// 		}
// 	});
// }

const setResponseCache = async({ name, etag, data }) => await client.set(`_responseCache/${ name }`, JSON.stringify({
	etag,
	...data
}));
const deleteResponseCache = async( name ) => await client.del( `_responseCache/${ name }` );

// const fetchUsers = async({ url, res, last_updated }) => {

// 	await getHandler({ url }).then(({ status, data }) => {
// 		if ( status === 'success' ) {
// 			const dataResponse = toArrayResponse( data );
// 			res
// 				.status( 200 )
// 				.send(success( `success get ${ getName( url ) }!`, {
// 					table_name: getName( url ),
// 					last_updated,
// 					length: dataResponse.length,
// 					data: dataResponse
// 				}, res.statusCode ));
// 		} else {
// 			res
// 				.status( 500 )
// 				.send(error( "something was wrong with firebase!", res.statusCode ));
// 		}
// 	});
// }

const postUsers = async({ url, res, username, email }) => {
	await postHandler({
		url,
		data: {
			username,
			email,
			create_at: timestamp,
			last_updated: timestamp
		}
	}).then(({ status }) => {
		if ( status === 'success' ) {

			res
				.status( 200 )
				.send(success( "OK", {
					data: {
						username,
						email
					}
				}, res.statusCode ));
			deleteResponseCache(getName( url ));
		} else {
			res
				.status( 500 )
				.send(error( "something was wrong!", res.statusCode ));
		}
	});
}

const updateUsers = async({ id, username, email }) => {
	return await patchHandler({
		url: `/users/${ id }`,
		data: {
			username,
			email,
			last_updated: timestamp
		}
	});
}

const deleteUsers = async({ id }) => {
	return await deleteHandler({ url: `/users/${ id }.json` });
}

router.get("/test", routeValidator.validate({
	query: {
		sync: {
			isRequired: true,
			isAllowSync: {
				pattern: unixFormat
			},
			message: `validation failed!, must include sync query with the 13 digits unix milliseconds epoch format or \`true\` value.`
		}
	}
}), async( req, res ) => {
	const parsedURL = req._parsedUrl.pathname;
	const getMethod = req.method;
	console.log(parsedURL.replace( '/', '' ));
	console.log( getMethod );
	console.log( req.query.sync );

	client.get( `_responseCache/${ parsedURL }`, function ( err, result ) {
		if ( result ) {
			const parsedResult = JSON.parse( result );
			res.send( parsedResult );
		} else {
			setResponseCache({ name: parsedURL, etag: 'kajdf87uy898YU8jh', data: 'welcome 2!' });
			res.send({ data: 'welcome 2!' });
		}
	});

});

router.get("/users", async( req, res ) => {
	const pathname = req._parsedUrl.pathname;
	client.get(`_responseCache/${ getName( pathname ) }`, async( err, result ) => {
		if ( result ) {
			const parsedResult = JSON.parse( result );
			res
				.status( 200 )
				.send(success( `success get ${ getName( pathname ) }!`, parsedResult, res.statusCode ));
		} else {
			await getHandler({ url: pathname }).then(({ status, data, etag }) => {
				console.log( data );
				if ( status === 'success' ) {
					const dataResponse = toArrayResponse( data );
					const dataResult = {
						etag,
						table_name: getName( pathname ),
						length: dataResponse.length,
						data: dataResponse
					};
					res
						.status( 200 )
						.send(success( `success get ${ getName( pathname ) }!`, dataResult, res.statusCode ));
					setResponseCache({ name: getName( pathname ), etag, data: dataResult });
				} else {
					res
						.status( 500 )
						.send(error( "something was wrong with firebase!", res.statusCode ));
				}
			});

		}
	});
});

router.post("/users", routeValidator.validate({
	body: {
		username: {
			isRequired: true,
			isByteLength: {
				min: 4,
				max: 32
			}
		},
		email: {
			isRequired: true,
			isEmail: true,
			normalizeEmail: true
		}
	}
}), ( req, res ) => {
	const { username, email } = req.body;
	const pathname = req._parsedUrl.pathname;
	postUsers({ url: pathname, res, username, email });
});

router.put("/users", ( req, res ) => {
	const {
		id,
		...otherBody
	} = req.body;
	if (Object.keys( req.body ).length > 0 && Object.keys( otherBody ).length > 0 && Object.keys( req.body ).includes( 'id' )) {
		updateUsers({
			id,
			...otherBody
		}).then(({ status }) => {
			if ( status === 'success' ) {
				res
							.status( 200 )
							.send(success( "OK", {
								data: {
									last_updated: timestamp,
									...otherBody
								}
							}, res.statusCode ));
				deleteResponseCache(getName( url ));
			} else {
				res
					.status( 500 )
					.send(error( "something was wrong!", res.statusCode ));
			}
		});
	} else {
		res
			.status( 400 )
			.send(error( `must include '?id' body to update process!`, res.statusCode ));
	}
});

router.delete("/users", ( req, res ) => {
	const { id } = req.body;
	if (Object.keys( req.body ).length > 0 && Object.keys( req.body ).includes( 'id' )) {
		deleteUsers({ id }).then(({ status }) => {
			if ( status === 'success' ) {
				res
							.status( 200 )
							.send(success( "OK", {
								data: {
									last_updated: timestamp
								}
							}, res.statusCode ));
				deleteResponseCache(getName( url ));
			} else {
				res
					.status( 500 )
					.send(error( "request delete failed!", res.statusCode ));
			}
		});
	} else {
		res
			.status( 500 )
			.send(error( "request require `id` on body!", res.statusCode ));
	}
});

app.use( `/.netlify/functions/api`, router );

app.listen(process.env.port || 4000, ( ) => {
	console.log( 'listening api' );
});

module.exports = app;
module.exports.handler = serverless( app );