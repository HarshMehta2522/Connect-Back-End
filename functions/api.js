const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const serverless = require('serverless-http');
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
// const morgan = require("morgan");
// const userRoute = require("../routes/users.js");
// const authRoute = require("../routes/auth.js");
const conversationRoute = require("../routes/conversations.js");
const messageRoute = require("../routes/messages.js");
const postRoute = require("../routes/post.js");
const cors =require("cors");
const router =express.Router();


//
// Set Mongoose to use built-in JavaScript Promises
mongoose.Promise = global.Promise;

mongoose.connect(
  "mongodb+srv://website2522:25222522@cluster0.mp2pckn.mongodb.net/Social?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(cors());
app.use(express.json());
app.use(helmet());
// app.use(morgan("common"));
// fetch('http://localhost:8800');
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "/images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'process.env.REACT_APP_NAME' ,
  api_key: 'REACT_APP_API_KEY',
  api_secret: 'REACT_APP_API_SECRET',
});
app.post("/api/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.file;

    // Upload the file to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(file.tempFilePath);

    // Return the URL of the uploaded file from Cloudinary
    res.status(200).json({ url: cloudinaryResponse.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/api/post/:id/image", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post.img);
  } catch (err) {
    res.status(500).json(err);
  }
});

// const upload = multer({ storage: storage });
// Use the user route for "/api/users"
// app.use("/server/users", userRoute);
// app.use("/server/auth", authRoute);
app.use("/server/post", postRoute);
app.use("/server/conversations", conversationRoute);
app.use("/server/messages", messageRoute);

app.listen(8800, () => {
  console.log("Backend is running!");
});
router.get('/', (req, res) => {
    res.send('App is running..');
  });


//auth router
const User = require("../models/User");
router.post("/api/auth/register", async (req, res) => {
  try {
    // Check if the user already exists by email
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      // User with the same email already exists
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword, // Save the hashed password
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//login

router.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" }); // Return JSON with error message
    }
    const validPassword = await bcryptjs.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(502).json({ error: "Wrong password" }); // Return JSON with error message
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" }); // Return JSON with error message
  }
});

//user route


const bcryptjs = require("bcryptjs");

//update user
router.put("/api/users/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcryptjs.genSalt(10);
        req.body.password = await bcryptjs.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
router.delete("/api/users/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//get a user
router.get("/api/users/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get all user
router.get("/api/users/all/:currentUserId", async (req, res) => {
  try {
    const currentUserId = req.params.currentUserId;

    const users = await User.find({
      _id: { $not: { $eq: currentUserId } },
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/api/users/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture, followings, followers } = friend;
      friendList.push({ _id, username, profilePicture, followings, followers });
    });
    res.status(200).json(friendList);
  } catch (err) {
    res.status(500).json(err);
  }
});
//follow a user

router.put("/api/users/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});

//unfollow a user

router.put("/api/users/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});



const Conversation = require("../models/Conversation");

router.post("/api/conversations/", async (req, res) => {
  try {
    // Check if a conversation already exists with the same members
    const existingConversation = await Conversation.findOne({
      members: {
        $all: [req.body.sender, req.body.receiverId],
      },
    });

    if (existingConversation) {
      // If a conversation already exists, return it
      res.status(201).json(existingConversation);
    } else {
      // If no conversation exists, create a new one
      const newConversation = new Conversation({
        members: [req.body.sender, req.body.receiverId],
      });
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/api/conversations/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: {
        $in: [req.params.userId],
      },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

const Message = require("../models/Message");


router.post("/api/messages/",async(req,res)=>{
    const newMessage = new Message(req.body)
    try{
        const savedMessage =await newMessage.save();
        res.status(200).json(savedMessage)
    }catch(err){
        res.status(500).json(err)
    }
})

router.get("/api/messages/:conversationId",async(req,res)=>{
    try{
        const messages =await Message.find({
            conversationId:req.params.conversationId,
        });
        res.status(200).json(messages)
    }catch(err){
        res.status(500).json(err)
    }
})

const Post = require("../models/Post");
//create a post

router.post("/api/post/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});
//update a post

router.put("/api/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//delete a post

router.delete("/api/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//like / dislike a post

router.put("/api/post/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//get a post

router.get("/api/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get timeline posts

router.get("/api/post/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

//get user's all posts

router.get("/api/post/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});



app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);