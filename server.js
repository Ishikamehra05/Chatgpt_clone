const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const colors = require("colors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

//dotenv
dotenv.config();

//mongo connection
connectDB();

//rest object
const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(morgan('dev'));
app.use(cors());

// const port = 8080;
const port = process.env.PORT || 8080;

app.listen(port, () => {
    // console.log(`server running at ${port}`);
    console.log(`server running at ${process.env.DEV_MODE} mode on ${port}`. bgCyan.white);
})