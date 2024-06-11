const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const admin = require("firebase-admin");
const moment = require("moment");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

// Inisialisasi Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", async (req, res) => {
  try {
    res.status(200).send("alo alo!" + BOT_TOKEN);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/api/webhook", async (req, res) => {
  const { message } = req.body;

  if (message) {
    const chatId = message.chat.id;
    const sessionRef = db.collection('sessions').doc(chatId.toString());
    
    // Ambil konteks dari Firestore
    const doc = await sessionRef.get();
    let history = doc.exists ? doc.data().history : [];

    // Tambahkan pesan pengguna ke riwayat
    history.push({
      role: "user",
      parts: [{ text: message.text }],
    });

    // Mulai sesi percakapan dengan riwayat yang ada
    const chatSession = model.startChat({
      generationConfig,
      history: history,
    });

    try {
      const result = await chatSession.sendMessage(message.text);
      const responseText = await result.response.text();
      
      // Tambahkan respons AI ke riwayat
      history.push({
        role: "model",
        parts: [{ text: responseText }],
      });

      // Simpan riwayat yang diperbarui ke Firestore
      await sessionRef.set({ history: history, last_updated: new Date() });

      // Kirim respons ke pengguna
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: responseText,
      });

      res.status(200).send("Message sent");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send(error.message);
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
