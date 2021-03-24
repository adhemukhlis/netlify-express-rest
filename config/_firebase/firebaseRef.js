var firebase = require( 'firebase' );
const config = {
	apiKey: "AIzaSyDkI3uplq9THqQ9019P5oj9DD36oNhKpqk",
	authDomain: "netlify-express-rest.firebaseapp.com",
	projectId: "netlify-express-rest",
	storageBucket: "netlify-express-rest.appspot.com",
	messagingSenderId: "522808349855",
	appId: "1:522808349855:web:b9c5510bc1e03b883dfeaa"
};
const firebaseInitConfig = firebase.initializeApp( config );
const firebaseFirestore = firebaseInitConfig.firestore( );
export const users = async( ) => {
	firebaseFirestore.settings({ timestampsInSnapshots: true });
	firebaseFirestore
		.collection( 'users' )
		.orderBy( 'waktu', 'desc' )
		.get( )
		.then(snapshot => {
			const res = snapshot.map(( hasil ) => ({
				...hasil.data( )
			}));
			return res;
		})
		.catch(( error ) => {
			return error;
		})

}

export const postUsers = async({ username, email }) => {
	firebaseFirestore.settings({ timestampsInSnapshots: true });
	firebaseFirestore
		.collection( 'users' )
		.add({username, email, waktu: new Date( )});
	return ({ username, email });
}