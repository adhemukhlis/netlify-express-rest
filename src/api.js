const express = require("express");
const serverless = require("serverless-http");
const {users} = require("../config/_firebase/firebaseRef")
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/test", (req, res) => {
  res.send({message:'/test success!'})
});
router.get("/users", (req, res) => {
  users().then((data)=>res.send({  data }))
});
router.post("/users", ( req, res ) => {
  const {username,email} = req.body
  postUsers({username,email}).then((data) => {
    res.send({ data });
  })
});

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);