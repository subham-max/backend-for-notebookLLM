// backend/utils/rag.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFProcessor = require("./pdfProcessor");

console.log("Gemini SDK loaded, initializing...");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// BEST MODEL: gemini-2.5-flash
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",  // FROM YOUR LIST
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 500,
  },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  ],
});

class RAG {
  static buildContext(document, question) {
    console.log("Building context for:", question);
    const qWords = question.toLowerCase().split(/\s+/);
    const scored = document.pages
      .map((p, i) => {
        let score = 0;
        qWords.forEach(w => {
          if (p.text.toLowerCase().includes(w)) score++;
        });
        return { page: p, score, idx: i };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    let context = "";
    for (const x of scored) {
      const chunk = `Page ${x.page.pageNumber}: ${x.page.text.substring(0, 6000)}...`;
      if ((context + chunk).length > 20000) break;
      context += chunk + "\n\n";
    }
    console.log("Context built:", context.length, "chars");
    return context.trim();
  }

  static async query(document, question) {
    console.log("RAG.query STARTED:", question);

    const context = this.buildContext(document, question);
    const prompt = `Answer using ONLY this context. Cite with [Page X]. Be concise.

Context:
${context}

Question: ${question}

Answer:`;

    try {
      console.log("Sending to Gemini 2.5 Flash...");
      const result = await model.generateContent(prompt);
      const answer = await result.response.text();

      if (!answer.trim()) {
        return { answer: "No relevant info found in document.", citations: [] };
      }

      console.log("Gemini Answer:", answer.substring(0, 200) + "...");

      const citations = PDFProcessor.createCitations(answer, document.pages);
      return { answer, citations, usage: {} };

    } catch (err) {
      console.error("GEMINI ERROR:");
      console.error(err.message);
      return { 
        answer: `Gemini Error: ${err.message}`, 
        citations: [] 
      };
    }
  }
}

module.exports = RAG;