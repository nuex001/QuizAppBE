const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter email"],
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
    },
    point: {
      type: Number,
      default: 1000,
    },
    lastQuizAttempt: {
      type: Date,
      default: null, // Default value is null, indicating no attempt yet
    },
  },
  { timestamps: true }
);

// Unique validation
userSchema.plugin(uniqueValidator, {
  message: "{PATH} has already been taken",
});

// Hashing password
userSchema.pre("save", async function (next) {
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
  // console.log("about to be created",this.password);
  next();
});

//model
const User = mongoose.model("user", userSchema);

const quizSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Please enter a question"],
    },
    A: {
      type: String,
      required: [true, "Please enter option A"],
    },
    B: {
      type: String,
      required: [true, "Please enter option B"],
    },
    C: {
      type: String,
      required: [true, "Please enter option C"],
    },
    D: {
      type: String,
      required: [true, "Please enter option D"],
    },
    answer: {
      type: String,
      required: [true, "Please enter the correct answer"],
      enum: ["A", "B", "C", "D"], // Specify the valid options for the answer
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("quiz", quizSchema);
module.exports = { User, Quiz };
