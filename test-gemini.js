// backend/test-gemini.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

(async () => {
  try {
    console.log("Testing gemini-2.5-flash...");
    const result = await model.generateContent("Say 'Hello from Subham'");
    const text = await result.response.text();
    console.log("SUCCESS:", text);
  } catch (err) {
    console.error("TEST FAILED:");
    console.error(err.message);
  }
})();