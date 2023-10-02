const router = require("express").Router();
const Conversation = require("../models/Conversation");
const cors =require("cors");
app.use(cors());
router.post("/", async (req, res) => {
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

router.get("/:userId", async (req, res) => {
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

module.exports = router;
