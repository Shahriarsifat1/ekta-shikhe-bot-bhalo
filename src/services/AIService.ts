
import Fuse from 'fuse.js';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
  keywords: string[];
}

interface ExtractedFact {
  type: 'location' | 'time' | 'name' | 'relationship' | 'general';
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
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
    birth_location: ['কোথায় জন্মগ্রহণ', 'কোথায় জন্ম', 'জন্মস্থান', 'কোন গ্রামে জন্ম', 'কোন জায়গায় জন্ম'],
    death_location: ['কোথায় মৃত্যু', 'কোথায় মারা', 'মৃত্যুস্থান'],
    birth_time: ['কখন জন্মগ্রহণ', 'কখন জন্ম', 'জন্ম সাল', 'কত সালে জন্ম'],
    death_time: ['কখন মৃত্যু', 'কখন মারা', 'মৃত্যু সাল', 'কত সালে মৃত্যু'],
    name: ['নাম কি', 'নাম কী', 'কি নাম', 'কী নাম'],
    father_name: ['বাবার নাম', 'পিতার নাম'],
    mother_name: ['মায়ের নাম', 'মাতার নাম'],
    daughter_name: ['মেয়ের নাম', 'কন্যার নাম'],
    son_name: ['ছেলের নাম', 'পুত্রের নাম'],
    where: ['কোথায়', 'কোন জায়গায়', 'কোন স্থানে', 'কোন দেশে', 'কোন এলাকায়', 'কোন গ্রামে', 'কোন শহরে'],
    when: ['কখন', 'কোন সময়', 'কত সালে', 'কোন বছর', 'কোন তারিখে'],
    what: ['কি', 'কী', 'কোন জিনিস'],
    who: ['কে', 'কার', 'কোন ব্যক্তি'],
    how: ['কিভাবে', 'কেমনে', 'কোন উপায়ে'],
    why: ['কেন', 'কিসের জন্য', 'কোন কারণে']
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

  // New intelligent fact extraction using NLP-like approach
  private extractFactsFromContent(content: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const sentences = content.split(/[।!?\n]/).filter(s => s.trim().length > 0);
    
    console.log('Extracting facts from content:', content);
    
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      
      // Birth location pattern
      const birthLocationPattern = /(.+?)\s+(পশ্চিমবঙ্গের?|বাংলাদেশের?|ভারতের?|ঢাকার?)\s*(.+?)\s*(জেলার?|বিভাগের?|এর?)\s*(.+?)\s*(গ্রামে?|শহরে?|এলাকায়?)\s*(জন্মগ্রহণ|জন্ম)/;
      const birthMatch = trimmedSentence.match(birthLocationPattern);
      
      if (birthMatch) {
        const state = birthMatch[2]?.replace(/র$/, '') || '';
        const district = birthMatch[3] || '';
        const village = birthMatch[5] || '';
        const location = `${state} ${district} জেলার ${village} গ্রামে`;
        
        facts.push({
          type: 'location',
          subject: birthMatch[1]?.trim() || 'তিনি',
          predicate: 'জন্মগ্রহণ করেছেন',
          object: location.trim(),
          confidence: 0.9
        });
      }
      
      // Alternative birth location pattern
      const altBirthPattern = /(জন্মগ্রহণ|জন্ম).+?(.+?)\s*(গ্রামে?|শহরে?|জেলায?)/;
      const altBirthMatch = trimmedSentence.match(altBirthPattern);
      
      if (altBirthMatch && !birthMatch) {
        facts.push({
          type: 'location',
          subject: 'তিনি',
          predicate: 'জন্মগ্রহণ করেছেন',
          object: altBirthMatch[2]?.trim() + ' ' + altBirthMatch[3] || '',
          confidence: 0.7
        });
      }
      
      // Relationship name patterns
      const relationPattern = /(তার|তাঁর|তিনি|এর|তাদের)\s+(বাবার|মাতার|মায়ের|মেয়ের|ছেলের|পিতার|কন্যার|পুত্রের)\s+নাম\s+(.+)/;
      const relationMatch = trimmedSentence.match(relationPattern);
      
      if (relationMatch) {
        facts.push({
          type: 'relationship',
          subject: relationMatch[1],
          predicate: relationMatch[2] + ' নাম',
          object: relationMatch[3].trim(),
          confidence: 0.9
        });
      }
      
      // Birth year pattern
      const birthYearPattern = /(\d{4})\s*সালে?\s*(জন্ম|জন্মগ্রহণ)/;
      const birthYearMatch = trimmedSentence.match(birthYearPattern);
      
      if (birthYearMatch) {
        facts.push({
          type: 'time',
          subject: 'তিনি',
          predicate: 'জন্মগ্রহণ করেছেন',
          object: birthYearMatch[1] + ' সালে',
          confidence: 0.9
        });
      }
      
      // Death year pattern
      const deathYearPattern = /(\d{4})\s*সালে?\s*(মৃত্যু|মারা)/;
      const deathYearMatch = trimmedSentence.match(deathYearPattern);
      
      if (deathYearMatch) {
        facts.push({
          type: 'time',
          subject: 'তিনি',
          predicate: 'মৃত্যুবরণ করেছেন',
          object: deathYearMatch[1] + ' সালে',
          confidence: 0.9
        });
      }
    });
    
    console.log('Extracted facts:', facts);
    return facts;
  }

  // Intelligent question analysis
  private analyzeQuestion(question: string): { type: string; intent: string; subject?: string } {
    const normalizedQuestion = this.normalizeText(question);
    console.log('Analyzing question:', normalizedQuestion);
    
    // Extract subject from question (person's name)
    const subjectMatch = question.match(/([a-zA-Zআ-হ\s]+)\s+(কোথায়|কখন|কার|কী|কি)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';
    
    // Determine question type and intent
    for (const [type, patterns] of Object.entries(this.questionPatterns)) {
      for (const pattern of patterns) {
        if (normalizedQuestion.includes(pattern.toLowerCase())) {
          return { type, intent: pattern, subject };
        }
      }
    }
    
    // Fallback analysis
    if (normalizedQuestion.includes('কোথায়')) {
      if (normalizedQuestion.includes('জন্ম')) return { type: 'birth_location', intent: 'জন্মস্থান', subject };
      if (normalizedQuestion.includes('মৃত্যু')) return { type: 'death_location', intent: 'মৃত্যুস্থান', subject };
      return { type: 'where', intent: 'স্থান', subject };
    }
    
    if (normalizedQuestion.includes('কখন')) {
      if (normalizedQuestion.includes('জন্ম')) return { type: 'birth_time', intent: 'জন্মকাল', subject };
      if (normalizedQuestion.includes('মৃত্যু')) return { type: 'death_time', intent: 'মৃত্যুকাল', subject };
      return { type: 'when', intent: 'সময়', subject };
    }
    
    if (normalizedQuestion.includes('নাম')) {
      if (normalizedQuestion.includes('বাবা') || normalizedQuestion.includes('পিতা')) {
        return { type: 'father_name', intent: 'বাবার নাম', subject };
      }
      if (normalizedQuestion.includes('মা') || normalizedQuestion.includes('মাতা')) {
        return { type: 'mother_name', intent: 'মায়ের নাম', subject };
      }
      if (normalizedQuestion.includes('মেয়ে') || normalizedQuestion.includes('কন্যা')) {
        return { type: 'daughter_name', intent: 'মেয়ের নাম', subject };
      }
      if (normalizedQuestion.includes('ছেলে') || normalizedQuestion.includes('পুত্র')) {
        return { type: 'son_name', intent: 'ছেলের নাম', subject };
      }
      return { type: 'name', intent: 'নাম', subject };
    }
    
    return { type: 'general', intent: 'সাধারণ', subject };
  }

  // Generate intelligent responses based on question analysis and extracted facts
  private generateIntelligentResponse(question: string, facts: ExtractedFact[]): string {
    const analysis = this.analyzeQuestion(question);
    console.log('Question analysis:', analysis);
    console.log('Available facts:', facts);
    
    // Find the most relevant fact based on question type
    let relevantFact: ExtractedFact | null = null;
    
    switch (analysis.type) {
      case 'birth_location':
        relevantFact = facts.find(f => 
          f.type === 'location' && 
          f.predicate.includes('জন্মগ্রহণ')
        ) || null;
        break;
        
      case 'death_location':
        relevantFact = facts.find(f => 
          f.type === 'location' && 
          f.predicate.includes('মৃত্যু')
        ) || null;
        break;
        
      case 'birth_time':
        relevantFact = facts.find(f => 
          f.type === 'time' && 
          f.predicate.includes('জন্মগ্রহণ')
        ) || null;
        break;
        
      case 'death_time':
        relevantFact = facts.find(f => 
          f.type === 'time' && 
          f.predicate.includes('মৃত্যু')
        ) || null;
        break;
        
      case 'father_name':
        relevantFact = facts.find(f => 
          f.type === 'relationship' && 
          f.predicate.includes('বাবার নাম')
        ) || null;
        break;
        
      case 'mother_name':
        relevantFact = facts.find(f => 
          f.type === 'relationship' && 
          f.predicate.includes('মায়ের নাম')
        ) || null;
        break;
        
      case 'daughter_name':
        relevantFact = facts.find(f => 
          f.type === 'relationship' && 
          f.predicate.includes('মেয়ের নাম')
        ) || null;
        break;
        
      case 'son_name':
        relevantFact = facts.find(f => 
          f.type === 'relationship' && 
          f.predicate.includes('ছেলের নাম')
        ) || null;
        break;
    }
    
    // Generate natural language response
    if (relevantFact) {
      const subjectName = analysis.subject || relevantFact.subject;
      
      switch (analysis.type) {
        case 'birth_location':
          return `${subjectName} ${relevantFact.object} জন্মগ্রহণ করেছেন।`;
          
        case 'death_location':
          return `${subjectName} ${relevantFact.object} মৃত্যুবরণ করেছেন।`;
          
        case 'birth_time':
          return `${subjectName} ${relevantFact.object} জন্মগ্রহণ করেছেন।`;
          
        case 'death_time':
          return `${subjectName} ${relevantFact.object} মৃত্যুবরণ করেছেন।`;
          
        case 'father_name':
          return `${subjectName}এর বাবার নাম ${relevantFact.object}।`;
          
        case 'mother_name':
          return `${subjectName}এর মায়ের নাম ${relevantFact.object}।`;
          
        case 'daughter_name':
          return `${subjectName}এর মেয়ের নাম ${relevantFact.object}।`;
          
        case 'son_name':
          return `${subjectName}এর ছেলের নাম ${relevantFact.object}।`;
          
        default:
          return `${subjectName} সম্পর্কে: ${relevantFact.object}।`;
      }
    }
    
    return null;
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
      // Extract facts from the most relevant knowledge
      const facts = this.extractFactsFromContent(relevantKnowledge[0].content);
      
      // Try to generate intelligent response first
      const intelligentResponse = this.generateIntelligentResponse(question, facts);
      
      if (intelligentResponse) {
        return intelligentResponse;
      }
      
      // Try with other knowledge sources
      for (const knowledge of relevantKnowledge.slice(1)) {
        const additionalFacts = this.extractFactsFromContent(knowledge.content);
        const response = this.generateIntelligentResponse(question, additionalFacts);
        if (response) {
          return response;
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
