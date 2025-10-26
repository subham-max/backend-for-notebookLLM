// backend/list-models.js
require('dotenv').config();
const fetch = require('node-fetch'); // npm install node-fetch@2.6.7

const API_KEY = process.env.GEMINI_API_KEY;

(async () => {
  try {
    console.log("Fetching models from Google AI Studio API...\n");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log("AVAILABLE MODELS:");
    data.models.forEach(m => {
      console.log(`- ${m.name}`);
      if (m.supportedGenerationMethods) {
        console.log(`  Supports: ${m.supportedGenerationMethods.join(', ')}`);
      }
      console.log();
    });

  } catch (err) {
    console.error("FAILED TO LIST MODELS:");
    console.error(err.message);
  }
})();