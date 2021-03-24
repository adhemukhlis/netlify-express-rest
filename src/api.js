const express = require("express");
const serverless = require("serverless-http");
const {postUsers, usersRef} = require("../config/_firebase/firebaseRef")
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


router.get("/users", (req, res) => {
  usersRef.once('value', snap => {
    const res = snap.map(shot=>({...shot.val()}));
    res.send({
      data: res
    });
  })
});
router.post("/users", ( req, res ) => {
  const {username,email} = req.body
  postUsers({username,email}).then(( ) => {
    res.send({ message: "success!" });
  })
  .catch(( error ) => {
    res.send({ message: "failed!" });
  })
	
});

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);