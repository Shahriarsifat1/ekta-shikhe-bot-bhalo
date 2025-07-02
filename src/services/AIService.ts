import Fuse from 'fuse.js';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
  keywords: string[]; // নতুন field
}

class AIServiceClass {
  private knowledgeBase: KnowledgeItem[] = [];
  private fuseInstance: Fuse<KnowledgeItem> | null = null;

  // Enhanced Bengali to English mapping and synonyms
  private bengaliSynonyms: Record<string, string[]> = {
    'কি': ['কী', 'কেমন', 'কোন'],
    'কী': ['কি', 'কেমন', 'কোন'],
    'কে': ['কার', 'কাকে', 'কাহার'],
    'কেন': ['কিসের জন্য', 'কোন কারণে'],
    'কিভাবে': ['কেমনে', 'কিরূপে', 'কোন উপায়ে'],
    'কোথায়': ['কোন জায়গায়', 'কোন স্থানে'],
    'কখন': ['কোন সময়', 'কত সময়'],
    'কত': ['কতটা', 'কেমন'],
    'কোন': ['কোনটা', 'কোনো'],
    'হয়': ['হওয়া', 'হইয়া', 'হল'],
    'করে': ['করা', 'করিয়া', 'করল'],
    'বলে': ['বলা', 'বলিয়া', 'বলল'],
    'দেয়': ['দেওয়া', 'দিয়া', 'দিল'],
    'নেয়': ['নেওয়া', 'নিয়া', 'নিল'],
    'আছে': ['আছিল', 'থাকে', 'রয়েছে'],
    'ছিল': ['ছিলো', 'ছাইল', 'আছিল'],
    'মৃত্যুবরণ': ['মারা যান', 'মৃত্যু', 'মরে যান', 'ইন্তেকাল'],
    'জন্মগ্রহণ': ['জন্ম', 'জন্মায়', 'জন্মেছিলেন'],
    'গ্রাম': ['গ্রামে', 'পল্লী', 'পল্লীতে'],
    'নাম': ['নামধারী', 'নামক', 'নামের'],
    'বাবা': ['পিতা', 'পিতার', 'বাবার'],
    'মা': ['মাতা', 'মায়ের', 'মাতার'],
    'মেয়ে': ['কন্যা', 'কন্যার', 'মেয়ের'],
    'ছেলে': ['পুত্র', 'পুত্রের', 'ছেলের']
  };

  // Enhanced question patterns for better understanding
  private questionPatterns = {
    name: ['নাম', 'নামের', 'নামটি', 'নামক', 'কি নাম', 'কী নাম'],
    where: ['কোথায়', 'কোন জায়গায়', 'কোন স্থানে', 'কোন দেশে', 'কোন এলাকায়', 'কোন গ্রামে', 'কোন শহরে'],
    when: ['কখন', 'কোন সময়', 'কত সালে', 'কোন বছর', 'কোন তারিখে'],
    what: ['কি', 'কী', 'কোন জিনিস'],
    who: ['কে', 'কার', 'কোন ব্যক্তি'],
    how: ['কিভাবে', 'কেমনে', 'কোন উপায়ে'],
    why: ['কেন', 'কিসের জন্য', 'কোন কারণে']
  };

  // Relationship mapping
  private relationshipMapping: Record<string, string[]> = {
    'বাবা': ['বাবার', 'পিতা', 'পিতার'],
    'মা': ['মা', 'মাতা', 'মায়ের', 'মাতার'],
    'মেয়ে': ['মেয়ে', 'মেয়ের', 'কন্যা', 'কন্যার'],
    'ছেলে': ['ছেলে', 'ছেলের', 'পুত্র', 'পুত্রের']
  };

  constructor() {
    this.loadKnowledgeFromStorage();
    this.updateFuseInstance();
  }

  private loadKnowledgeFromStorage() {
    try {
      const stored = localStorage.getItem('ai-knowledge-base');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.knowledgeBase = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          keywords: item.keywords || this.extractKeywords(item.content)
        }));
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  private saveKnowledgeToStorage() {
    try {
      localStorage.setItem('ai-knowledge-base', JSON.stringify(this.knowledgeBase));
    } catch (error) {
      console.error('Error saving knowledge base:', error);
    }
  }

  private extractTags(content: string): string[] {
    const keywords = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)];
    return uniqueKeywords.slice(0, 5);
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[।,;:!?\-()]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = ['এবং', 'বা', 'কিন্তু', 'তবে', 'যদি', 'তাহলে', 'এই', 'সেই', 'যে', 'যা', 'যার', 'তার', 'এর', 'সে', 'তা', 'এটা', 'ওটা', 'একটি', 'একটা', 'কোনো', 'কোন'];
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    return [...new Set(filteredWords)];
  }

  private updateFuseInstance() {
    if (this.knowledgeBase.length > 0) {
      const options = {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'content', weight: 0.3 },
          { name: 'tags', weight: 0.2 },
          { name: 'keywords', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true
      };
      
      this.fuseInstance = new Fuse(this.knowledgeBase, options);
    }
  }

  private normalizeText(text: string): string {
    let normalized = text.toLowerCase().trim();
    
    // Handle Bengali synonyms
    Object.entries(this.bengaliSynonyms).forEach(([key, synonyms]) => {
      synonyms.forEach(synonym => {
        const regex = new RegExp(`\\b${synonym}\\b`, 'g');
        normalized = normalized.replace(regex, key);
      });
    });
    
    return normalized;
  }

  // New enhanced question analysis method
  private extractSpecificAnswer(question: string, content: string): string {
    const normalizedQuestion = this.normalizeText(question);
    const normalizedContent = this.normalizeText(content);
    
    console.log('Analyzing specific question:', normalizedQuestion);
    console.log('Content to analyze:', normalizedContent);
    
    // Parse content into structured information
    const sentences = content.split(/[।!?\n]/).filter(s => s.trim().length > 0);
    const factMap = new Map<string, string>();
    
    // Extract facts from each sentence
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      
      // Pattern: "তার বাবার নাম শেখ মনসুর আলী"
      const namePattern = /(.+?)\s+(বাবার|মাতার|মায়ের|মেয়ের|ছেলের|পিতার|কন্যার|পুত্রের)\s+নাম\s+(.+)/;
      const nameMatch = trimmedSentence.match(namePattern);
      
      if (nameMatch) {
        const person = nameMatch[1].trim();
        const relation = nameMatch[2].trim();
        const name = nameMatch[3].trim();
        
        const key = `${person}_${relation}_নাম`;
        factMap.set(key, name);
        
        console.log('Extracted fact:', key, '=', name);
      }
      
      // Alternative pattern: "তার মেয়ের নাম রেহানা"
      const altNamePattern = /(তার|তাঁর|তিনি)\s+(বাবার|মাতার|মায়ের|মেয়ের|ছেলের|পিতার|কন্যার|পুত্রের)\s+নাম\s+(.+)/;
      const altNameMatch = trimmedSentence.match(altNamePattern);
      
      if (altNameMatch) {
        const relation = altNameMatch[2].trim();
        const name = altNameMatch[3].trim();
        
        const key = `main_person_${relation}_নাম`;
        factMap.set(key, name);
        
        console.log('Extracted alternative fact:', key, '=', name);
      }
      
      // Birth year pattern
      const birthPattern = /(\d{4})\s*সালে?\s*(জন্ম|জন্মগ্রহণ)/;
      const birthMatch = trimmedSentence.match(birthPattern);
      
      if (birthMatch) {
        factMap.set('জন্ম_সাল', birthMatch[1]);
        console.log('Extracted birth year:', birthMatch[1]);
      }
      
      // Simple name extraction: "নাম [name]"
      const simpleNamePattern = /নাম\s+([^\s।]+)/;
      const simpleNameMatch = trimmedSentence.match(simpleNamePattern);
      
      if (simpleNameMatch) {
        factMap.set('সাধারণ_নাম', simpleNameMatch[1]);
        console.log('Extracted simple name:', simpleNameMatch[1]);
      }
    });
    
    console.log('All extracted facts:', Array.from(factMap.entries()));
    
    // Now analyze the question to find what specific information is being asked
    const questionWords = normalizedQuestion.split(/\s+/);
    
    // Check if it's asking for a name
    if (questionWords.includes('নাম') && questionWords.includes('কি')) {
      // Determine whose name is being asked
      let targetRelation = '';
      
      for (const [relation, variations] of Object.entries(this.relationshipMapping)) {
        if (variations.some(variant => normalizedQuestion.includes(variant))) {
          targetRelation = relation;
          break;
        }
      }
      
      if (targetRelation) {
        // Look for the specific relationship fact
        const relationKey = `main_person_${targetRelation}র_নাম`;
        const relationKeyAlt = `main_person_${targetRelation}_নাম`;
        
        console.log('Looking for relation key:', relationKey, 'or', relationKeyAlt);
        
        if (factMap.has(relationKey)) {
          return factMap.get(relationKey)!;
        }
        
        if (factMap.has(relationKeyAlt)) {
          return factMap.get(relationKeyAlt)!;
        }
        
        // Fallback: search for any key containing the relation
        for (const [key, value] of factMap.entries()) {
          if (key.includes(targetRelation)) {
            return value;
          }
        }
      }
    }
    
    // If no specific fact found, try the old method
    return this.analyzeQuestionAndExtractAnswer(question, content);
  }

  private analyzeQuestionAndExtractAnswer(question: string, content: string): string {
    const normalizedQuestion = this.normalizeText(question);
    const normalizedContent = this.normalizeText(content);
    
    console.log('Analyzing question:', normalizedQuestion);
    console.log('Content to search:', normalizedContent);
    
    const sentences = content.split(/[।!?\n]/).filter(s => s.trim().length > 0);
    
    const questionWords = normalizedQuestion.split(/\s+/);
    let questionType = 'general';
    let targetEntity = '';
    
    for (const [type, patterns] of Object.entries(this.questionPatterns)) {
      if (patterns.some(pattern => normalizedQuestion.includes(pattern))) {
        questionType = type;
        break;
      }
    }
    
    const importantWords = questionWords.filter(word => 
      word.length > 2 && 
      !Object.values(this.questionPatterns).flat().includes(word) &&
      !['কোন', 'কি', 'কী', 'করেন', 'করে', 'হয়', 'আছে'].includes(word)
    );
    
    if (importantWords.length > 0) {
      targetEntity = importantWords.join(' ');
    }
    
    console.log('Question type:', questionType, 'Target entity:', targetEntity);
    
    switch (questionType) {
      case 'name':
        return this.extractNameAnswer(question, sentences, targetEntity);
      case 'where':
        return this.extractLocationAnswer(question, sentences, targetEntity);
      case 'when':
        return this.extractTimeAnswer(question, sentences, targetEntity);
      case 'what':
        return this.extractDefinitionAnswer(question, sentences, targetEntity);
      case 'who':
        return this.extractPersonAnswer(question, sentences, targetEntity);
      default:
        return this.extractGeneralAnswer(question, sentences, targetEntity);
    }
  }

  // New method for extracting name-related answers
  private extractNameAnswer(question: string, sentences: string[], targetEntity: string): string {
    const normalizedQuestion = this.normalizeText(question);
    
    for (const sentence of sentences) {
      const normalizedSentence = this.normalizeText(sentence);
      
      // Check for name patterns
      if (normalizedSentence.includes('নাম')) {
        // Pattern for "তার মেয়ের নাম রেহানা"
        const nameMatch = sentence.match(/নাম\s+([^\s।]+)/);
        if (nameMatch) {
          return nameMatch[1];
        }
      }
    }
    
    return "দুঃখিত, নামের তথ্য খুঁজে পাইনি।";
  }

  private extractLocationAnswer(question: string, sentences: string[], targetEntity: string): string {
    console.log('Extracting location answer for:', targetEntity);
    
    for (const sentence of sentences) {
      const normalizedSentence = this.normalizeText(sentence);
      
      if (targetEntity && !normalizedSentence.includes(targetEntity)) {
        continue;
      }
      
      const locationPatterns = [
        /(\w+)\s*গ্রামে?\s*(জন্ম|জন্মগ্রহণ)/,
        /(জন্ম|জন্মগ্রহণ).*?(\w+)\s*গ্রামে?/,
        /(\w+ে?)\s*(জন্ম|জন্মগ্রহণ|মৃত্যু|মারা)/,
        /(\w+)\s*(পল্লী|গ্রাম|শহর|জেলা|বিভাগ)ে?\s*(জন্ম|জন্মগ্রহণ)/
      ];
      
      for (const pattern of locationPatterns) {
        const match = sentence.match(pattern);
        if (match) {
          const location = match[1] || match[2];
          if (location && location.length > 1) {
            if (question.includes('জন্ম')) {
              return `${targetEntity || 'তিনি'} ${location}${location.endsWith('ে') ? '' : 'তে'} জন্মগ্রহণ করেন।`;
            } else if (question.includes('মৃত্যু') || question.includes('মারা')) {
              return `${targetEntity || 'তিনি'} ${location}${location.endsWith('ে') ? '' : 'তে'} মৃত্যুবরণ করেন।`;
            } else {
              return `${location}${location.endsWith('ে') ? '' : 'তে'}।`;
            }
          }
        }
      }
    }
    
    return "দুঃখিত, নির্দিষ্ট স্থানের তথ্য খুঁজে পাইনি।";
  }

  private extractTimeAnswer(question: string, sentences: string[], targetEntity: string): string {
    console.log('Extracting time answer for:', targetEntity);
    
    for (const sentence of sentences) {
      const normalizedSentence = this.normalizeText(sentence);
      
      if (targetEntity && !normalizedSentence.includes(targetEntity)) {
        continue;
      }
      
      const yearMatch = sentence.match(/(\d{4})\s*সালে?/);
      if (yearMatch) {
        const year = yearMatch[1];
        if (question.includes('জন্ম')) {
          return `${targetEntity || 'তিনি'} ${year} সালে জন্মগ্রহণ করেন।`;
        } else if (question.includes('মৃত্যু')) {
          return `${targetEntity || 'তিনি'} ${year} সালে মৃত্যুবরণ করেন।`;
        } else {
          return `${year} সালে।`;
        }
      }
      
      const dateMatch = sentence.match(/(\d{1,2})\s*(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/);
      if (dateMatch) {
        return `${dateMatch[1]} ${dateMatch[2]}।`;
      }
    }
    
    return "দুঃখিত, নির্দিষ্ট সময়ের তথ্য খুঁজে পাইনি।";
  }

  private extractDefinitionAnswer(question: string, sentences: string[], targetEntity: string): string {
    for (const sentence of sentences) {
      const normalizedSentence = this.normalizeText(sentence);
      
      if (targetEntity && normalizedSentence.includes(targetEntity)) {
        const parts = sentence.split(targetEntity);
        if (parts.length > 1) {
          const description = parts[1].trim();
          if (description.length > 10) {
            return `${targetEntity} ${description}`;
          }
        }
      }
    }
    
    return sentences[0]?.substring(0, 150) + "..." || "দুঃখিত, সংজ্ঞা খুঁজে পাইনি।";
  }

  private extractPersonAnswer(question: string, sentences: string[], targetEntity: string): string {
    for (const sentence of sentences) {
      if (sentence.includes('যিনি') || sentence.includes('তিনি')) {
        return sentence.trim();
      }
    }
    return sentences[0]?.trim() || "দুঃখিত, ব্যক্তির তথ্য খুঁজে পাইনি।";
  }

  private extractGeneralAnswer(question: string, sentences: string[], targetEntity: string): string {
    let bestSentence = '';
    let maxRelevance = 0;
    
    const questionWords = this.normalizeText(question).split(/\s+/);
    
    for (const sentence of sentences) {
      const sentenceNormalized = this.normalizeText(sentence);
      let relevance = 0;
      
      for (const word of questionWords) {
        if (word.length > 2 && sentenceNormalized.includes(word)) {
          relevance++;
        }
      }
      
      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestSentence = sentence.trim();
      }
    }
    
    return bestSentence || sentences[0]?.trim() || "দুঃখিত, উত্তর খুঁজে পাইনি।";
  }

  private findBestMatches(question: string): KnowledgeItem[] {
    const normalizedQuestion = this.normalizeText(question);
    
    if (!this.fuseInstance) {
      return [];
    }
    
    const fuseResults = this.fuseInstance.search(normalizedQuestion);
    
    const goodMatches = fuseResults
      .filter(result => result.score! < 0.5)
      .map(result => result.item);
    
    if (goodMatches.length === 0) {
      const questionWords = normalizedQuestion.split(/\s+/).filter(word => word.length > 2);
      const keywordMatches = this.knowledgeBase.filter(item => {
        const itemText = this.normalizeText(`${item.title} ${item.content} ${item.keywords.join(' ')}`);
        return questionWords.some(word => itemText.includes(word));
      });
      
      return keywordMatches.slice(0, 3);
    }
    
    return goodMatches.slice(0, 3);
  }

  async learnFromText(title: string, content: string): Promise<void> {
    const keywords = this.extractKeywords(content);
    const newKnowledge: KnowledgeItem = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      timestamp: new Date(),
      tags: this.extractTags(content),
      keywords: keywords
    };

    this.knowledgeBase.push(newKnowledge);
    this.saveKnowledgeToStorage();
    this.updateFuseInstance();
    
    console.log('Learned new knowledge with keywords:', newKnowledge);
  }

  async generateResponse(question: string): Promise<string> {
    const normalizedQuestion = this.normalizeText(question);
    
    const relevantKnowledge = this.findBestMatches(question);
    
    console.log('Found relevant knowledge:', relevantKnowledge.length);
    
    if (relevantKnowledge.length > 0) {
      // First try the new specific extraction method
      const specificAnswer = this.extractSpecificAnswer(question, relevantKnowledge[0].content);
      
      if (specificAnswer && !specificAnswer.includes('দুঃখিত')) {
        return specificAnswer;
      }
      
      // Try with multiple knowledge sources
      for (const knowledge of relevantKnowledge) {
        const answer = this.extractSpecificAnswer(question, knowledge.content);
        if (answer && !answer.includes('দুঃখিত')) {
          return answer;
        }
      }
      
      // Fallback to smart response
      return this.generateSmartResponse(question, relevantKnowledge);
    }

    return this.generateGeneralResponse(question);
  }

  private generateSmartResponse(question: string, knowledgeItems: KnowledgeItem[]): string {
    const questionWords = this.normalizeText(question).split(/\s+/);
    const isWhatQuestion = questionWords.some(word => ['কি', 'কী', 'কোন'].includes(word));
    const isHowQuestion = questionWords.some(word => ['কিভাবে', 'কেমনে'].includes(word));
    const isWhyQuestion = questionWords.some(word => ['কেন', 'কিসের'].includes(word));
    const isWhereQuestion = questionWords.some(word => ['কোথায়', 'কোন'].includes(word));
    const isWhenQuestion = questionWords.some(word => ['কখন', 'কত'].includes(word));
    
    const primaryKnowledge = knowledgeItems[0];
    
    let responseContent = primaryKnowledge.content;
    
    const sentences = primaryKnowledge.content.split(/[।!?]/);
    const relevantSentences = sentences.filter(sentence => {
      const sentenceNormalized = this.normalizeText(sentence);
      return questionWords.some(word => 
        word.length > 2 && sentenceNormalized.includes(word)
      );
    });
    
    if (relevantSentences.length > 0) {
      responseContent = relevantSentences.join('। ') + '।';
    }
    
    if (isWhatQuestion) {
      return `"${primaryKnowledge.title}" সম্পর্কে আমি জানি যে: ${responseContent.substring(0, 400)}${responseContent.length > 400 ? '...' : ''}`;
    } else if (isHowQuestion) {
      return `"${primaryKnowledge.title}" সম্পর্কিত প্রক্রিয়া হলো: ${responseContent.substring(0, 400)}${responseContent.length > 400 ? '...' : ''}`;
    } else if (isWhyQuestion) {
      return `"${primaryKnowledge.title}" এর কারণ: ${responseContent.substring(0, 400)}${responseContent.length > 400 ? '...' : ''}`;
    } else if (isWhereQuestion) {
      return `"${primaryKnowledge.title}" সম্পর্কে স্থান/অবস্থান: ${responseContent.substring(0, 400)}${responseContent.length > 400 ? '...' : ''}`;
    } else if (isWhenQuestion) {
      return `"${primaryKnowledge.title}" এর সময়কাল: ${responseContent.substring(0, 400)}${responseContent.length > 400 ? '...' : ''}`;
    }
    
    let response = `আপনার প্রশ্নের উত্তরে আমি বলতে পারি:\n\n`;
    response += `"${primaryKnowledge.title}" থেকে: ${responseContent.substring(0, 300)}${responseContent.length > 300 ? '...' : ''}`;
    
    if (knowledgeItems.length > 1) {
      response += `\n\nঅতিরিক্ত তথ্য "${knowledgeItems[1].title}" থেকে: ${knowledgeItems[1].content.substring(0, 200)}...`;
    }
    
    return response;
  }

  private generateGeneralResponse(question: string): string {
    const greetings = ['হ্যালো', 'নমস্কার', 'সালাম', 'হাই', 'hello', 'hi'];
    const thanks = ['ধন্যবাদ', 'থ্যাংক', 'thanks', 'thank you'];
    
    if (greetings.some(greeting => question.toLowerCase().includes(greeting))) {
      return "নমস্কার! আমি একটা স্মার্ট AI বট। আপনি আমাকে যেকোনো প্রশ্ন করতে পারেন অথবা নতুন কিছু শেখাতে পারেন।";
    }
    
    if (thanks.some(thank => question.toLowerCase().includes(thank))) {
      return "আপনাকেও ধন্যবাদ! আমি সব সময় আপনাকে সাহায্য করার জন্য এখানে আছি।";
    }

    if (question.includes('?') || question.includes('কী') || question.includes('কিভাবে') || question.includes('কেন')) {
      return `এটি একটি আকর্ষণীয় প্রশ্ন! দুঃখিত, আমার কাছে এই বিষয়ে এখনো পর্যাপ্ত তথ্য নেই। আপনি চাইলে আমাকে এই বিষয়ে কিছু শেখাতে পারেন "শেখান" ট্যাবে গিয়ে। আমি এখন আরও স্মার্ট হয়েছি এবং সরাসরি উত্তর দিতে পারি।`;
    }

    const generalResponses = [
      "আমি আপনার কথা বুঝতে পারছি। আমি এখন ChatGPT ও Gemini এর মতো স্মার্ট হয়েছি এবং সংক্ষিপ্ত, সঠিক উত্তর দিতে পারি।",
      "আকর্ষণীয়! আপনি চাইলে আমাকে এই বিষয়ে আরও শেখাতে পারেন। আমি এখন প্রসঙ্গ বুঝে নির্দিষ্ট উত্তর দিতে পারি।",
      "আমি প্রতিদিন নতুন কিছু শিখছি এবং আরও বুদ্ধিমান হচ্ছি। এখন আমি প্রশ্নের মূল অর্থ বুঝে সরাসরি উত্তর দিতে পারি।",
      "আমি আপনাকে সাহায্য করতে চাই। আমার নতুন AI ক্ষমতা দিয়ে আমি সংক্ষিপ্ত এবং নির্ভুল উত্তর দিতে পারব।"
    ];

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  getKnowledgeBase(): KnowledgeItem[] {
    return [...this.knowledgeBase].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  deleteKnowledge(id: string): void {
    this.knowledgeBase = this.knowledgeBase.filter(item => item.id !== id);
    this.saveKnowledgeToStorage();
    this.updateFuseInstance();
  }

  clearKnowledgeBase(): void {
    this.knowledgeBase = [];
    this.saveKnowledgeToStorage();
    this.updateFuseInstance();
  }

  getKnowledgeStats(): { total: number; topics: string[] } {
    return {
      total: this.knowledgeBase.length,
      topics: [...new Set(this.knowledgeBase.map(item => item.title))]
    };
  }
}

export const AIService = new AIServiceClass();
