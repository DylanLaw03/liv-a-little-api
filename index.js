const express = require('express');
require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const { Pool } = require('pg');


cloudinary.config().cloud_name;

/// HELPER FUNCTIONS. need to be refactored to another file

// get max post id
const getMaxPost = async(db) => {
  const query = "SELECT MAX(postid) from posttbl";

  const result = await db.query(query);

  return result.rows;
}


// getPostBody
const getPostBody = async(db, lowerBound, upperBound) => {
  // query lower bound to upper bound for post body
  const result = await db.query(`SELECT * FROM posttbl WHERE postid >= ${lowerBound} and postid < ${upperBound}`);


  
  return result.rows;
}

const getPostImages = async(db, lowerBound, upperBound) => {
  // create query and param
  const query = "SELECT * FROM postimages WHERE postid >= $1 and postid < $2";
  const values = [lowerBound, upperBound];
  
  // query lower bound to upper bound for post images
  const result = await db.query(query, values);


  return result.rows;
}

// function to retrieve posts,
// returns result rows
const getPosts = async (db, lowerBound, upperBound) => {
  // query lower bound to upper bound for post body
  const postResult = await getPostBody(db, lowerBound, upperBound);

  let posts = postResult;

  // get id of last post to know which images need to be searched for, update upperBound
  upperBound = posts[posts.length - 1].postid + 1;

  const imageResult = await getPostImages(db, lowerBound, upperBound);


  // now add image links to posts
  for (let i = 0; i < posts.length; i++) {
    posts[i]["imageurl"] = imageResult[i].imageurl;
  }


  return posts;
}

// function to upload post text
const uploadPost = async (db, postBody, postImg) => {


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
      console.log(error);
      return 1;
    }
  });

  // if it all works, upload image url to DB
  result = await db.query(`INSERT INTO postImages (postid, imageURL) VALUES ('${postId}', '${cloudinaryResponse.url}')`);

  // return 0 if no errors
  return 0;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// connect pool
client.connect();

// create app 
const app = express();
app.use(express.json({limit: "15mb"}));

// setup cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// returns post id of highest post
app.get('/getMaxPost', async (req, res) => {
  
  const result = await getMaxPost(client);

  res.send(result);
});


// get posts
// insert range of posts you want (lowerBound, upperBound(exclusive)), returns JSON of Posts, each Post has post #, post img url, and post body
app.post('/getPosts', async (req, res) => {
  console.log(req.body);

  // save bounds as ints
  const lowerBound = parseInt(req.body.lowerBound);
  const upperBound = parseInt(req.body.upperBound);

  console.log(lowerBound, upperBound);
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

// endpoint to send purchase request

// takes name, contactInfo, and numStickers
app.post('/purchaseRequest', async(req, res) => {
  // define email to send from 'transporter'
  const transporter = new nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_EMAIL,
      pass: process.env.GOOGLE_PASSWORD,
      clientId: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_SECRET_TOKEN,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
  })

  // define message body
  const messageBody = `Hello!\n${req.body.name} has requested to purchase ${req.body.numStickers} stickers.\nTheir contact information is: ${req.body.contactInfo}`;


  // define email to send
  var mailOptions = {
    from: process.env.GOOGLE_EMAIL,
    to: process.env.TEST_EMAIL,
    subject: 'A Request to Purchase Stickers',
    text: messageBody
  };

  // send email
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
})

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));