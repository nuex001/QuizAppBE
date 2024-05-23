const express = require("express");
const { urlencoded } = require("express");
const router = express.Router();
const { default: mongoose } = require("mongoose");
require("dotenv").config();

//MIDDLEWARE
const auth = require("../middleWare/auth");

// SCHEMA
const { User, Quiz } = require("../models/Schema");

// GET QUIZ
router.get("/", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne().sort({ createdAt: -1 }).select("-answer");
    res.json(quiz);
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
});

// GET QUIZ
router.post("/", auth, async (req, res) => {
  try {
    const { id } = req.user;
    const { quizId, answer } = req.body;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ err: "Invalid Id!" });
    }
    //check if you have attempted already
    const quiz = await Quiz.findById(quizId);
    const user = await User.findById(id);
    const currentDate = new Date();
    // Check if the user has already attempted a quiz today
    if (
      user.lastQuizAttempt &&
      user.lastQuizAttempt.getDate() === currentDate.getDate()
    ) {
      return res
        .status(400)
        .json({ err: "You've already attempted a quiz today! Please try again tomorrow 🤭" });
    }
    if (!quiz) {
      return res.status(404).json({ err: "Quiz not found!" });
    }
    if (quiz.answer.toLowerCase() === answer.toLowerCase()) {
      await User.findByIdAndUpdate(id, {
        $inc: { point: 1000 },
        $set: { lastQuizAttempt: currentDate },
      });
      return res.json({ msg: "You got it right!" });
    } else {
      // Update the lastQuizAttempt field for the user
      await User.findByIdAndUpdate(id, { lastQuizAttempt: currentDate });
      return res.json({ msg: "Opps you failed, try again Tomorrow!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
});

module.exports = router;
/**2023-12-11T06:53:07.743+00:00  old time*/
