import firebase from "./firebaseInit";

const rootRef = firebase
	.database( )
	.ref( );
export const usersRef = rootRef.child('users')
export const postUsers =({username,email})= usersRef.push({username,email})