const express = require('express');

// create app 
const app = express();

// home page
app.get('/', async (req, res) => {
    res.send("hello!")
    console.log("Request Received")
})

app.post('/uploadPost', async (req, res) => {
  console.log(req.body.postbody)
})
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));