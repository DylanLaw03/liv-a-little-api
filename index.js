const express = require('express');
require("dotenv").config();
const cloudinary = require('cloudinary').v2;

// create app 
const app = express();
app.use(express.json({limit: "15mb"}));
// home page
app.get('/', async (req, res) => {
    res.send("hello!")
    console.log("Request Received")
})

app.post('/uploadPost', async (req, res) => {
  cloudinary.uploader.upload(req.body.postImg);
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));