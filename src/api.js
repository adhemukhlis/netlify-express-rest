const express = require("express");
// const serverless = require("serverless-http");
// const {users,postUsers} = require("../config/_firebase/firebaseRef")
const firebase = require( 'firebase' );
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

const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/test", (req, res) => {
  res.send({message:'/test success!'})
});
router.get("/users", (req, res) => {
  firebaseFirestore.settings({ timestampsInSnapshots: true });
	firebaseFirestore
		.collection( 'users' )
		.orderBy( 'waktu', 'desc' )
		.get( )
		.then(snapshot => {
			const response = snapshot.map(( hasil ) => ({
				...hasil.data( )
			}));
			res.send({response})
		})
		.catch(( error ) => {
			res.send({error})
		})
});
router.post("/users", ( req, res ) => {
  const {username,email} = req.body
  firebaseFirestore.settings({ timestampsInSnapshots: true });
	firebaseFirestore
		.collection( 'users' )
		.add({username, email, waktu: new Date( )});
	res.send({ username, email });
});

app.use(`/.netlify/functions/api`, router);

module.exports = app;
// module.exports.handler = serverless(app);