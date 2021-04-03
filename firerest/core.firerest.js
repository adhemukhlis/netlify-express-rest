const axios = require( 'axios' );
const { config: AxiosConfig } = require( './config' );
const { baseURL, timeout } = AxiosConfig;

exports.timestamp = new Date( ).getTime( );
exports.unixFormat = new RegExp( '^[1-9]([0-9]{12,13}$)' );
exports.getName = ( str ) => str.replace( '/', '' );
exports.toArrayResponse = ( data ) => Object
	.keys( data )
	.map(key => ({
		...data[key],
		id: key
	}));

const Axios = axios.create({
	baseURL,
	timeout,
	headers: {
		'Content-Type': 'application/json'
	}
});

exports.getHandler = async({ url, headers }) => {
	const config = {
		method: 'GET',
		url: `${ url }.json`,
		headers: {
			'X-Firebase-ETag': 'true',
			...!!headers && headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		const { data, headers } = response;
		console.log( headers.etag );
		return { status: 'success', data };;
	}).catch(( error ) => {
		console.log(error.toJSON( ));
		return {
			status: 'failed',
			error: error.toJSON( )
		};
	});
}

exports.postHandler = async({ url, headers, data }) => {
	const config = {
		method: 'POST',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(( ) => {
		return { status: 'success' };
	}).catch(( error ) => {
		console.log(error.toJSON( ));
		return {
			status: 'failed',
			error: error.toJSON( )
		};
	});
}

exports.putHandler = async({ url, headers, data }) => {
	const config = {
		method: 'PUT',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		return { status: 'success' };
	}).catch(( error ) => {
		console.log(error.toJSON( ));
		return {
			status: 'failed',
			error: error.toJSON( )
		};
	});
}

exports.patchHandler = async({ url, headers, data }) => {
	const config = {
		method: 'PATCH',
		url: `${ url }.json`,
		data,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		return { status: 'success' };
	}).catch(( error ) => {
		console.log(error.toJSON( ));
		return {
			status: 'failed',
			error: error.toJSON( )
		};
	});
}

exports.deleteHandler = async({ url, headers }) => {
	const config = {
		method: 'DELETE',
		url: `${ url }.json`,
		...!!headers && {
			headers
		}
	};
	return await Axios( config ).then(async( response ) => {
		return { status: 'success' };;
	}).catch(( error ) => {
		console.log(error.toJSON( ));
		return {
			status: 'failed',
			error: error.toJSON( )
		};
	});
}

exports.updateProperties = async({ name, last_updated }) => {
	return await this.patchHandler({
		url: `/_properties/${ name }`,
		data: {
			name,
			last_updated
		}
	});
}
exports.fetchPropertiesByName = async({ name }) => {
	return await this.getHandler({ url: `/_properties/${ name }` });
}