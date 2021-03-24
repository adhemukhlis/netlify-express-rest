const express = require( "express" );
const serverless = require( "serverless-http" );
const multer = require('multer');
const forms = multer();
const app = express( );
const router = express.Router( );
app.use(express.json());
app.use(forms.array()); 
app.use(express.urlencoded({
  extended: true
}));

router.get("/", ( req, res ) => {
  console.log(req.query)
  console.log(Object.keys(req.query))
  if(Object.keys(req.query).length>0){
    const {id} = req.query
    res.send({ data: {id} });
  } else {
    res.send({ data: "empty queries!" });
  }
});
// app.get('/:userId', (req, res) => {
//   req.params; // { userId: '42' }
//   res.send({data:req.params});
// });

router.post("/", ( req, res ) => {
	console.log( req.body )

	res.send({ data: req.body });
});
router.put("/", ( req, res ) => {
	res.send({ text: "Hi There!" });
});
router.delete("/", ( req, res ) => {
	res.send({ text: "Hi There!" });
});
app.use( `/api`, router );
app.listen(process.env.port || 4000, ( ) => {
	console.log( 'listening api' );
});
module.exports = app;
module.exports.handler = serverless( app );