const express = require('express');
require("dotenv").config();
const cors = require('cors');

const { Client, Pool } = require('pg');

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  sslmode: "require",
});

// function to upload post text
const uploadPost = async (db, postBody, postImg) => {
  //open db connection
  db.connect();

  //insert Post body, return postID
  let result = await db.query('INSERT INTO postTbl (postBody) VALUES (${postBody}) RETURNING postID');

  console.log(result);
}
// create app 
const app = express();
app.use(express.json({limit: "15mb"}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// home page
app.get('/', async (req, res) => {
    res.send("hello!")
    console.log("Request Received")
})

app.post('/uploadPost', async (req, res) => {
  console.log(req.body.postBody);
 
  uploadPost(client, req.body.postBody, "Not here");

  res.sendStatus(200);
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));