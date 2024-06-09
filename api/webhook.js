const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const randomize = require("randomatic");
const moment = require("moment");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Function to generate a random reference number
// const generateRef = () => {
//   return randomize("a0", 6);
// };

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

    if (message.text === "otp") {
      console.log(BOT_TOKEN, chatId, "ini start");

      const otp = generateOTP();
      const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      const replyMessage = `Permintaan Kode Verifikasi OTP\n\n HATI HATI PENIPUAN\n\nOTP: ${otp}\nTgl/Jam: ${timestamp}`;

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
      axios
        .post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: responseMessage,
        })
        .then(() => {
          res.status(200).send("Message sent");
        })
        .catch((error) => {
          console.error("Error sending message", error);
          res.status(500).send(message);
          // res.status(500).send('Error sending message');
        });
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
