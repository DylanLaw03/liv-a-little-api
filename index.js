const express = require('express');
require("dotenv").config();
const cors = require('cors');




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
  console.log("New Post!");
  console.log(req.body.postImg);
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));