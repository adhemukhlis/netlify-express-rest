global.fetch = require( "node-fetch" ).default;
const express = require( "express" );
const axios = require( "axios" );
const serverless = require( "serverless-http" );
const cors = require( 'cors' );
const timestamp = new Date( ).getTime( );

const { success, error } = require( "../config/responseApi" );
const unixFormat = new RegExp( '^[1-9]([0-9]{12,13}$)' );

const app = express( );
const router = express.Router( );

app.use(cors( ));
app.use(express.json( ));
app.use(express.urlencoded({ extended: true }));

const Axios = axios.create({
	baseURL: 'https://netlify-express-rest-default-rtdb.firebaseio.com',
	timeout: 3000,
	headers: {
		'Content-Type': 'application/json'
	}
});

const toArrayResponse = ( data ) => Object
	.keys( data )
	.map(key => ({
		...data[key],
		id: key
	}));

postHandler = async({ url, headers, data }) => {
	const config = {
		method: 'POST',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(( ) => {
		return { status: "success" };
	}).catch(( error ) => {
		return { status: "failed" };
	});
}

putHandler = async({ url, headers, data }) => {
	const config = {
		method: 'PUT',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		return { status: "success" };
	}).catch(( error ) => {
		return { status: "failed" };
	});
}
patchHandler = async({ url, headers, data }) => {
	const config = {
		method: 'PATCH',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		return { status: "success" };
	}).catch(( error ) => {
		return { status: "failed" };
	});
}
getHandler = async({ url }) => {
	const config = {
		method: 'GET',
		url
	};
	return await Axios( config ).then(async( response ) => {
		const { data } = response;
		return { status: "success", data };;
	}).catch(( error ) => {
		return { status: "failed" };
	});
}

fetchUsers = async( ) => {
	return await getHandler({ url: '/users.json' });
}

fetchPropertiesByName = async({ name }) => {
	return await getHandler({ url: `/_properties/${ name }.json` });
}

postUsers = async({ username, email }) => {
	return await postHandler({
		url: '/users',
		data: {
			username,
			email,
			create_at: timestamp,
			last_updated: timestamp
		}
	});
}

updateUsers = async({ id, username, email }) => {
	return await patchHandler({
		url: `/users/${ id }`,
		data: {
			username,
			email,
			last_updated: timestamp
		}
	});
}
updateProperties = async({ properties_name, last_updated }) => {
	return await putHandler({
		url: `/_properties/users`,
		data: {
			properties_name,
			last_updated
		}
	});
}
deleteUsers = async( ) => {
	const config = {
		method: 'get',
		url: '/users.json'
	};
	return await Axios( config ).then(async( response ) => {
		console.log( 'fetch user' );
		console.log( response.data );
		const { data } = response;
		return data;
	}).catch(( error ) => {
		return "timeout!";
	});
}

router.get("/test", async( req, res ) => {
	const { status, data } = await fetchUsers( );
	if ( status === 'success' ) {
		res.send({data: toArrayResponse( data )});
	} else {
		res.send({ message: 'no data' });
	}
});
router.get("/users", async( req, res ) => {
	if (Object.keys( req.query ).length > 0 && Object.keys( req.query ).includes( 'sync' )) {
		const { sync } = req.query;
		if (unixFormat.test( sync )) {
			const { data: prop_user } = await fetchPropertiesByName({ name: 'users' });
			if ( parseInt( sync ) === prop_user.last_updated ) {
				res
					.status( 200 )
					.send(success( "looks like the data is not updated, the data is up to date !", [], 204 ));
			} else {
				fetchUsers( ).then(({ status, data }) => {
					if ( status !== 'success' ) {
						res
							.status( 200 )
							.send(success( "success get users!", {
								last_updated: prop_user.last_updated,
								data: toArrayResponse( data )
							}, res.statusCode ));
					} else {
						res
							.status( 500 )
							.send(error( "something was wrong!", res.statusCode ));
					}
				});
			}
		} else if ( sync === 'true' ) {
			const { data: prop_user } = await fetchPropertiesByName({ name: 'users' });
			fetchUsers( ).then(({ status, data }) => {
				if ( status !== 'success' ) {
					res
						.status( 200 )
						.send(success( "success get users!", {
							last_updated: prop_user.last_updated,
							data: toArrayResponse( data )
						}, res.statusCode ));
				} else {
					res
						.status( 500 )
						.send(error( "something was wrong!", res.statusCode ));
				}
			});
		} else {
			console.log( 'not match' );
			res
				.status( 400 )
				.send(error( `must include '?sync' query, or maybe sync value not match with unix time format!`, res.statusCode ));
		}
	} else {
		res
			.status( 400 )
			.send(error( `must include '?sync' query, or sync value not match unix time format!`, res.statusCode ));
	}
});

router.post("/users", ( req, res ) => {
	const { username, email } = req.body;
	postUsers({ username, email }).then(({ status }) => {
		if ( status === 'success' ) {
			updateProperties({ properties_name: 'users', last_updated: timestamp }).then(({ status: prop_update_status }) => {
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
});
router.put("/users", ( req, res ) => {
	const { id, ...otherBody } = req.body;
	if (Object.keys( req.body ).length > 0 &&Object.keys( otherBody ).length > 0 && Object.keys( req.body ).includes( 'id' )) {
		updateUsers({ id,...otherBody }).then(({ status }) => {
			if ( status === 'success' ) {
				updateProperties({ properties_name: 'users', last_updated: timestamp }).then(({ status: prop_update_status }) => {
					if ( prop_update_status === 'success' ) {
						res
							.status( 200 )
							.send(success( "OK", {
								data: {
									last_updated:timestamp,
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
	}else{
		res
			.status( 400 )
			.send(error( `must include '?id' query to update process!`, res.statusCode ));
	}

});
app.use( `/.netlify/functions/api`, router );
// app.listen(process.env.port || 4000, ( ) => {
// 	console.log( 'listening api' );
// });
module.exports = app;
module.exports.handler = serverless( app );