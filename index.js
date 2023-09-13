const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
// const helmet = require("helmet");
// const morgan = require("morgan");
const userRoute = require("./routes/users.js");
const authRoute = require("./routes/auth.js");
const conversationRoute = require("./routes/conversations.js");
const messageRoute = require("./routes/messages.js");
const postRoute = require("./routes/post.js");
const multer = require("multer");
const path = require("path");
const cors =require("cors");

// Set Mongoose to use built-in JavaScript Promises
mongoose.Promise = global.Promise;

mongoose.connect(
  "mongodb+srv://website2522:25222522@cluster0.mp2pckn.mongodb.net/Social?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(cors());
app.use(express.json());
// app.use(helmet());
// app.use(morgan("common"));
// fetch('http://localhost:8800');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }

});

// Use the user route for "/api/users"
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/post", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

app.listen(8800, () => {
  console.log("Backend is running!");
});
