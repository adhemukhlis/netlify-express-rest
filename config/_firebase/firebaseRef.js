import firebase from "./firebaseInit";

export const users = async( ) => {
	firebase.settings({ timestampsInSnapshots: true });
	firebase
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
	firebase.settings({ timestampsInSnapshots: true });
	firebase
		.collection( 'users' )
		.add({username, email, waktu: new Date( )});
	return ({ username, email });
}