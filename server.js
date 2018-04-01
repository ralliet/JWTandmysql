require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser')
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
app.use(require('./routes'));

//startup server on port 5000
app.listen(process.env.API_PORT, () => console.log(`server listening on port ${process.env.API_PORT}`))