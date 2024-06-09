const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.post('/api/webhook', (req, res) => {
  const { message } = req.body;

  if (message) {
    const chatId = message.chat.id;
    const responseMessage = `Hello, you said: ${message.text}`;

    axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: responseMessage
    }).then(() => {
      res.status(200).send('Message sent');
    }).catch((error) => {
      console.error('Error sending message', error);
      res.status(500).send('Error sending message');
    });
  } else {
    res.status(200).send('No message to process');
  }
});

module.exports = app;