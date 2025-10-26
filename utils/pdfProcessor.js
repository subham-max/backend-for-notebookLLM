const pdf = require('pdf-parse');

class PDFProcessor {
  static async extractText(buffer) {
    const data = await pdf(buffer);
    const pages = [];
  
    const pageTexts = data.text.split('\f'); 
    pageTexts.forEach((text, index) => {
      if (text.trim()) {
        pages.push({
          pageNumber: index + 1,
          text: text.trim()
        });
      }
    });

    return {
      fullText: data.text,
      pages,
      pageCount: pages.length
    };
  }

  static createCitations(response, pages) {
    const citations = [];
    const sentences = response.split('. ');
    
    sentences.forEach((sentence, idx) => {
      if (sentence.trim()) {
        // Simple keyword matching for citations
        const relevantPages = pages
          .map((page, pageIdx) => {
            const score = this.calculateRelevance(sentence, page.text);
            return { pageNumber: pageIdx + 1, score };
          })
          .filter(p => p.score > 0.3)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);

        if (relevantPages.length > 0) {
          citations.push({
            sentenceIndex: idx,
            pages: relevantPages.map(p => p.pageNumber)
          });
        }
      }
    });

    return citations;
  }

  static calculateRelevance(sentence, pageText) {
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const pageWords = pageText.toLowerCase().split(/\s+/);
    
    let matches = 0;
    sentenceWords.forEach(word => {
      if (pageWords.includes(word)) matches++;
    });
    
    return matches / sentenceWords.length;
  }
}

module.exports = PDFProcessor;