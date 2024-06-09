const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const randomize = require("randomatic");
const moment = require("moment");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Store OTPs and chat IDs in-memory for simplicity (use a database in production)
let otpStorage = {};
let chatIdStorage = {};
let refStorage = {};

// Function to generate a random reference number
const generateRef = () => {
  return randomize("a0", 6);
};

// Function to generate OTP
const generateOTP = () => {
  return randomize("0", 6);
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", async (req, res) => {
  try {
    res.status(200).send("alo alo!" + BOT_TOKEN);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/api/webhook", (req, res) => {
  const { message } = req.body;

  if (message) {
    const chatId = message.chat.id;
    const responseMessage = `Hello, you said: ${message.text}`;

    // axios
    //   .post(`${TELEGRAM_API}/sendMessage`, {
    //     chat_id: chatId,
    //     text: responseMessage,
    //   })
    //   .then(() => {
    //     res.status(200).send("Message sent");
    //   })
    //   .catch((error) => {
    //     console.error("Error sending message", error);
    //     res.status(500).send(message);
    //     // res.status(500).send('Error sending message');
    //   });

    if (message.text === "otp") {
      console.log(botToken, chatId, "ini start");

      const ref = generateRef();
      const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      const replyMessage = `Permintaan Kode Verifikasi OTP\n\nNo. Ref: ${ref}\nTgl/Jam: ${timestamp}`;

      // Store the ref to be used later
      refStorage[ref] = chatId;

      // Send the reply message
      axios
        .post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: replyMessage,
        })
        .then((response) => {
          console.log("Start message sent:", response.data);
          res.status(200).send("Start message sent successfully");
        })
        .catch((error) => {
          console.error(
            "Error sending start message:",
            error.response ? error.response.data : error.message
          );
          res.status(500).send("Failed to send start message");
        });
    } else {
      console.log(botToken, chatId, "ini else");
      const refMatch = text.match(/No\. Ref: (\w+)/);
      if (refMatch && refMatch[1]) {
        console.log("masuk sini 1");
        const ref = refMatch[1];
        if (refStorage[ref] === chatId) {
          console.log("masuk sini 2");

          // Generate OTP and store it
          const otp = generateOTP();
          otpStorage[chatId] = otp;

          // Send OTP to the user
          const otpMessage = `Your OTP code is ${otp}`;
          axios
            .post(`${TELEGRAM_API}/sendMessage`, {
              chat_id: chatId,
              text: otpMessage,
            })
            .then((response) => {
              console.log("OTP sent:", response.data);
              res.status(200).send("OTP sent successfully");
            })
            .catch((error) => {
              console.error(
                "Error sending OTP:",
                error.response ? error.response.data : error.message
              );
              res.status(500).send("Failed to send OTP");
            });
        } else {
          res.status(400).send("Invalid reference number or chat ID mismatch");
        }
      } else {
        res.status(400).send("Invalid message format");
      }
    }
  } else {
    res.status(200).send("No message to process");
  }
});

// Add this line to start server locally
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
