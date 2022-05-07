const express = require('express');

// create app 
const app = express();

// home page
app.get('/', async (req, res) => {
    res.send("hello!")
})

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App listening on PORT: ${port}`));