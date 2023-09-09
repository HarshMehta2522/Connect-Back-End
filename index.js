const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/users.js");
const authRoute = require("./routes/auth.js");
const postRoute = require("./routes/post.js");


// Set Mongoose to use built-in JavaScript Promises
mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://website2522:25222522@cluster0.mp2pckn.mongodb.net/Social?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

// Use the user route for "/api/users"
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/post", postRoute);

app.listen(8800, () => {
  console.log("Backend is running!");    
});
