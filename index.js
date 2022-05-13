const express = require('express');
require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

const { Client, Pool } = require('pg');

cloudinary.config().cloud_name;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// create app 
const app = express();
app.use(express.json({limit: "15mb"}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// function to upload post text
const uploadPost = async (db, postBody, postImg) => {

  //open db connection
  db.connect();

  //insert Post body, return postID
  let result = await db.query(`INSERT INTO postTbl (postBody) VALUES ('${postBody}') RETURNING postID`);

  // save post id
  const postId = (result.rows[0].postid);
  
  // upload image
  let cloudinaryResponse = await cloudinary.uploader.upload(postImg,
  // handle any errors 
  function(error) {
    // send non 200 code back if there was an issue uploading
    if (error != undefined) {
      res.sendStatus(400);
    }
  });

  // if it all works, upload image url to DB
  result = await db.query(`INSERT INTO postImages (postid, base64) VALUES ('${postId}', '${cloudinaryResponse.url}')`);
  
  // close db
  db.end();
}

// home page
app.get('/', async (req, res) => {
    res.send("hello!")
    console.log("Request Received")
})

app.post('/uploadPost', async (req, res) => {
  console.log(req.body.postBody);
 
  uploadPost(client, req.body.postBody, req.body.postImg);

  res.sendStatus(200);
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));