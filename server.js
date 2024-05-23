//
const express = require("express");
const { urlencoded } = require("express");
const jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken/verify");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const cron = require("node-cron");
const OpenAI = require("openai");
const cors = require("cors");

// SCHEMA
const { Quiz } = require("./models/Schema");
const auth = require("./middleWare/auth");

// Middleware
const app = express();
app.use(
  cors({
    origin: "https://quizfe.netlify.app", // Allow this origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow these HTTP methods
    credentials: true, // Allow cookies to be sent
  })
);
app.use(express.json());

// connecting db
let dbURL = process.env.DBURL;

// initializing port
const PORT = process.env.PORT || 5000;

//Create our openAi instance
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// fetchQuestion
const fetchQuiz = async () => {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a quiz master generating a crypto quiz question with four multiple-choice options and the correct answer.",
      },
      {
        role: "user",
        content:
          "Create a multiple-choice crypto quiz question with four options and the correct answer.",
      },
    ],
    max_tokens: 150,
  });
  const data = chatCompletion.choices[0].message.content;
  // console.log(data);
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Extract the question and options
  const question = lines[0].replace("Question: ", "");
  const options = {
    A: lines[1].substring(3),
    B: lines[2].substring(3),
    C: lines[3].substring(3),
    D: lines[4].substring(3),
  };
  // Find the correct answer line
  const correctAnswerLine = lines.find(
    (line) =>
      line.startsWith("Correct answer:") || line.startsWith("Correct Answer:")
  );
  if (!correctAnswerLine) {
    console.error("Correct answer line not found");
    return;
  }

  // Extract the correct answer
  const correctAnswer = correctAnswerLine.split(" ")[2].substring(0, 1); // Extract only the option letter

  // Create a new quiz question object
  const quiz = new Quiz({
    question,
    A: options.A,
    B: options.B,
    C: options.C,
    D: options.D,
    answer: correctAnswer,
  });
  await quiz.save();
};

// connecting the db
const options = {
  ssl: true,
};

mongoose
  .connect(dbURL, options)
  .then((result) => {
    app.listen(PORT);
    fetchQuiz();
    console.log("Connected Successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// API

app.get("/", async (req, res) => {
  res.json({ msg: "Gotten successfully" });
});

// // task

// Define your task
const task = () => {
  // This function will be executed every day at 00:00
  console.log("Executing task at midnight...");
  fetchQuiz();
};

// // Schedule the task to run every day at 00:00
cron.schedule("0 0 * * *", task);

// Schedule the task to run every two minutes
// cron.schedule('*/2 * * * *', task);

// ROUTES
app.use("/api/user", require("./Routes/user"));
app.use("/api/quiz", require("./Routes/quiz"));
