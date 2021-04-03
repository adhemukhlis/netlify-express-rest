global.fetch = require( "node-fetch" ).default;
const express = require( "express" );
const serverless = require( "serverless-http" );
const cors = require( 'cors' );
var responseTime = require( 'response-time' );
var routeValidator = require( 'express-route-validator' );
const {
	postHandler,
	getHandler,
	putHandler,
	patchHandler,
	deleteHandler,
	fetchPropertiesByName,
	updateProperties,
	timestamp,
	unixFormat,
	toArrayResponse,
	getName
} = require( "../firerest/core.firerest" );
const { success, error } = require( "../config/responseApi" );

const app = express( );
const router = express.Router( );

app.use(cors( ));
app.use(express.json( ));
app.use(express.urlencoded({ extended: true }));
app.use(responseTime( ));

routeValidator.addValidator( 'isAllowSync', function ( val, config ) {
	/**  only allow milliseconds timestamp epoch (13 digits number) example: https://currentmillis.com/ and `true` value*/
	const pattern = config.pattern;
	return ( pattern.test( val ) || val === 'true' );
});

const fetchUsers = async({ url, res, last_updated }) => {
	await getHandler({ url }).then(({ status, data }) => {
		if ( status === 'success' ) {
			const dataResponse = toArrayResponse( data );
			res
				.status( 200 )
				.send(success( `success get ${ getName( url ) }!`, {
					table_name: getName( url ),
					last_updated,
					length: dataResponse.length,
					data: dataResponse
				}, res.statusCode ));
		} else {
			res
				.status( 500 )
				.send(error( "something was wrong with firebase!", res.statusCode ));
		}
	});
}

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
			updateProperties({ name: getName( url ), last_updated: timestamp }).then(({ status: prop_update_status }) => {
				if ( prop_update_status === 'success' ) {
					res
						.status( 200 )
						.send(success( "OK", {
							data: {
								username,
								email
							}
						}, res.statusCode ));
				} else {
					res
						.status( 500 )
						.send(error( "something was wrong!", res.statusCode ));
				}
			});
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
	res.send({ data: 'success' });

});

router.get("/users", routeValidator.validate({
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
	const { sync } = req.query;
	const pathname = req._parsedUrl.pathname;
	if ( sync === 'true' ) {
		const { data: prop_user } = await fetchPropertiesByName({name: getName( pathname )});
		await fetchUsers({ url: pathname, last_updated: prop_user['last_updated'], res });
	} else {
		const { data: prop_user } = await fetchPropertiesByName({ name: 'users' });
		if (parseInt( sync ) === prop_user['last_updated']) {
			res
				.status( 200 )
				.send(success( "Looks like data is up to date, no need to request!", [], 204 ));
		} else {
			await fetchUsers({ url: pathname, last_updated: prop_user['last_updated'], res });
		}
	}
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
				updateProperties({ name: 'users', last_updated: timestamp }).then(({ status: prop_update_status }) => {
					if ( prop_update_status === 'success' ) {
						res
							.status( 200 )
							.send(success( "OK", {
								data: {
									last_updated: timestamp,
									...otherBody
								}
							}, res.statusCode ));
					} else {
						res
							.status( 500 )
							.send(error( "something was wrong!", res.statusCode ));
					}
				});
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
				updateProperties({ name: 'users', last_updated: timestamp }).then(({ status: prop_update_status }) => {
					if ( prop_update_status === 'success' ) {
						res
							.status( 200 )
							.send(success( "OK", {
								data: {
									last_updated: timestamp
								}
							}, res.statusCode ));
					} else {
						res
							.status( 500 )
							.send(error( "something was wrong!", res.statusCode ));
					}
				});
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

// app.use( `/.netlify/functions/api`, router );
app.use( `/api`, router );

app.listen(process.env.port || 4000, ( ) => {
	console.log( 'listening api' );
});

module.exports = app;
module.exports.handler = serverless( app );