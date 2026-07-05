const express = require("express")
require('dotenv').config()
const app = express()
const port = process.env.PORT


//listening
app.listen(port, console.log(`Listening on port ${port}`))