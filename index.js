const express = require('express');
require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

const { Client, Pool } = require('pg');

cloudinary.config().cloud_name;

const client = new Pool({
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


// function to retrieve posts,
// returns result rows
const getPosts = async (db, lowerBound, upperBound) => {
  // open db connection
  db.connect();

  // query lower bound to upper bound for post body
  let result = await db.query(`SELECT * FROM posttbl WHERE postid >= ${lowerBound} and postid < ${upperBound}`);

  let posts = result.rows;

  // get id of last post to know which images need to be searched for, update upperBound
  upperBound = posts[posts.length - 1]

  // now get image links
  result = await db.query(`SELECT * FROM posttbl WHERE postid >= ${lowerBound} and postid < ${upperBound}`);

  // now add image links to posts
  for (let i = 0; i < posts.length(); i++) {
    posts[i]["imageurl"] = result.rows[i];
  }


  return posts;
}

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
  // set dir
  {folder: "post-images"},
  // handle any errors 
  function(error) {
    // send non 200 code back if there was an issue uploading
    if (error != undefined) {
      return 1;
    }
  });

  // if it all works, upload image url to DB
  result = await db.query(`INSERT INTO postImages (postid, imageURL) VALUES ('${postId}', '${cloudinaryResponse.url}')`);
  
  // close db
  db.end();

  // return 0 if no errors
  return 0;
};

// get posts
// insert range of posts you want (lowerBound, upperBound(exclusive)), returns JSON of Posts, each Post has post #, post img url, and post body
app.post('/getPosts', async (req, res) => {
  // save bounds as ints
  const lowerBound = parseInt(req.body.lowerBound);
  const upperBound = parseInt(req.body.upperBound);

  console.log(typeof(req.body.lowerBound), upperBound);
  // get posts
  let result = await getPosts(client, lowerBound, upperBound);

  res.send(result);
})

// home page
app.get('/', async (req, res) => {
    res.send("hello!")
    console.log("Request Received")
})

app.post('/uploadPost', async (req, res) => {
  let uploadStatus = await uploadPost(client, req.body.postBody, req.body.postImg);


  if (uploadStatus === 0) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));