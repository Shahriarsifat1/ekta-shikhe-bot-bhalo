import Fuse from 'fuse.js';

interface ConversationContext {
  previousQuestions: string[];
  currentTopic: string;
  userPreferences: Record<string, any>;
  sessionMemory: Array<{ question: string; answer: string; timestamp: Date }>;
}

interface EmotionalContext {
  sentiment: 'positive' | 'negative' | 'neutral' | 'curious' | 'frustrated';
  confidence: number;
  suggestedTone: 'friendly' | 'helpful' | 'encouraging' | 'informative';
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
  keywords: string[];
  importance: number;
  relatedTopics: string[];
}

interface ExtractedFact {
  type: 'location' | 'time' | 'name' | 'relationship' | 'general' | 'cause' | 'effect';
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  context: string;
}

class EnhancedAIServiceClass {
  private knowledgeBase: KnowledgeItem[] = [];
  private conversationContext: ConversationContext;
  private fuseInstance: Fuse<KnowledgeItem> | null = null;

  // Enhanced Bengali language processing
  private bengaliSynonyms: Record<string, string[]> = {
    'কি': ['কী', 'কেমন', 'কোন', 'কিরকম'],
    'কী': ['কি', 'কেমন', 'কোন', 'কিরকম'],
    'কে': ['কার', 'কাকে', 'কাহার', 'কোন ব্যক্তি'],
    'কেন': ['কিসের জন্য', 'কোন কারণে', 'কি কারণে'],
    'কিভাবে': ['কেমনে', 'কিরূপে', 'কোন উপায়ে', 'কোন পদ্ধতিতে'],
    'কোথায়': ['কোন জায়গায়', 'কোন স্থানে', 'কোথাকার'],
    'কখন': ['কোন সময়', 'কত সময়', 'কোন কালে'],
    'কত': ['কতটা', 'কেমন', 'কি পরিমাণ'],
    'জন্মগ্রহণ': ['জন্ম নেওয়া', 'জন্মায়', 'জন্মেছিলেন', 'ভূমিষ্ঠ'],
    'মৃত্যুবরণ': ['মারা যাওয়া', 'মৃত্যু', 'মরে যান', 'ইন্তেকাল', 'পরলোকগমন'],
    'বাবা': ['পিতা', 'পিতার', 'বাবার', 'জনক'],
    'মা': ['মাতা', 'মায়ের', 'মাতার', 'জননী'],
    'ভালো': ['চমৎকার', 'সুন্দর', 'দারুণ', 'অসাধারণ'],
    'খারাপ': ['বাজে', 'খারাপ', 'নিম্নমানের', 'দুর্বল']
  };

  // Enhanced question patterns with emotional context
  private advancedQuestionPatterns = {
    birth_location: {
      patterns: ['কোথায় জন্মগ্রহণ', 'কোথায় জন্ম', 'জন্মস্থান', 'কোন গ্রামে জন্ম', 'জন্মভূমি'],
      intent: 'location_inquiry',
      emotion: 'curious'
    },
    death_location: {
      patterns: ['কোথায় মৃত্যু', 'কোথায় মারা', 'মৃত্যুস্থান', 'শেষ নিঃশ্বাস কোথায়'],
      intent: 'location_inquiry',
      emotion: 'serious'
    },
    relationship: {
      patterns: ['সম্পর্ক কি', 'কিভাবে সম্পর্কিত', 'সংযোগ কি', 'কি সম্পর্ক'],
      intent: 'relationship_inquiry',
      emotion: 'curious'
    },
    comparison: {
      patterns: ['তুলনা', 'পার্থক্য কি', 'কোনটা ভালো', 'কোনটা বেশি'],
      intent: 'comparison_inquiry',
      emotion: 'analytical'
    },
    explanation: {
      patterns: ['ব্যাখ্যা', 'কেন এমন', 'কিভাবে সম্ভব', 'কি কারণে'],
      intent: 'explanation_request',
      emotion: 'curious'
    }
  };

  // Emotional response templates
  private emotionalResponses = {
    positive: {
      greeting: ['খুব ভালো প্রশ্ন!', 'চমৎকার!', 'দারুণ!'],
      helpful: ['আমি আপনাকে সাহায্য করতে পেরে খুশি', 'এটা জানতে পেরে আনন্দিত'],
      encouraging: ['আরও জানুন!', 'চালিয়ে যান!', 'খুব ভালো চিন্তাভাবনা!']
    },
    curious: {
      questioning: ['আকর্ষণীয় প্রশ্ন!', 'চিন্তাশীল প্রশ্ন!'],
      exploring: ['আসুন দেখি...', 'চলুন জানি...', 'আবিষ্কার করা যাক...']
    },
    serious: {
      respectful: ['এটা একটা গুরুত্বপূর্ণ বিষয়', 'সম্মানের সাথে বলছি'],
      thoughtful: ['গভীর চিন্তার বিষয়', 'এটা নিয়ে ভাবার মতো']
    }
  };

  constructor() {
    this.conversationContext = {
      previousQuestions: [],
      currentTopic: '',
      userPreferences: {},
      sessionMemory: []
    };
    this.loadKnowledgeFromStorage();
    this.loadConversationContext();
    this.updateFuseInstance();
  }

  private loadConversationContext() {
    try {
      const stored = localStorage.getItem('ai-conversation-context');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.conversationContext = {
          ...parsed,
          sessionMemory: parsed.sessionMemory?.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })) || []
        };
      }
    } catch (error) {
      console.error('Error loading conversation context:', error);
    }
  }

  private saveConversationContext() {
    try {
      localStorage.setItem('ai-conversation-context', JSON.stringify(this.conversationContext));
    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  }

  private loadKnowledgeFromStorage() {
    try {
      const stored = localStorage.getItem('ai-knowledge-base');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.knowledgeBase = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          keywords: item.keywords || this.extractKeywords(item.content),
          importance: item.importance || 1,
          relatedTopics: item.relatedTopics || []
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

  private updateFuseInstance() {
    if (this.knowledgeBase.length > 0) {
      const options = {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'content', weight: 0.25 },
          { name: 'tags', weight: 0.15 },
          { name: 'keywords', weight: 0.1 },
          { name: 'relatedTopics', weight: 0.1 }
        ],
        threshold: 0.3,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true
      };
      
      this.fuseInstance = new Fuse(this.knowledgeBase, options);
    }
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[।,;:!?\-()]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = ['এবং', 'বা', 'কিন্তু', 'তবে', 'যদি', 'তাহলে', 'এই', 'সেই', 'যে', 'যা', 'যার', 'তার', 'এর', 'সে', 'তা', 'এটা', 'ওটা', 'একটি', 'একটা', 'কোনো', 'কোন', 'সব', 'সকল', 'আর', 'ও'];
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    return [...new Set(filteredWords)];
  }

  // Enhanced emotional intelligence
  private analyzeEmotionalContext(question: string): EmotionalContext {
    const normalizedQuestion = question.toLowerCase();
    
    // Detect frustration
    if (normalizedQuestion.includes('কেন বুঝতে পারছ না') || 
        normalizedQuestion.includes('আবার বল') ||
        normalizedQuestion.includes('ঠিকমতো বল')) {
      return { sentiment: 'frustrated', confidence: 0.8, suggestedTone: 'encouraging' };
    }
    
    // Detect curiosity
    if (normalizedQuestion.includes('কিভাবে') || 
        normalizedQuestion.includes('কেন') || 
        normalizedQuestion.includes('কি') ||
        normalizedQuestion.includes('আরও জানতে চাই')) {
      return { sentiment: 'curious', confidence: 0.9, suggestedTone: 'informative' };
    }
    
    // Detect positive sentiment
    if (normalizedQuestion.includes('ধন্যবাদ') || 
        normalizedQuestion.includes('ভালো') || 
        normalizedQuestion.includes('দারুণ')) {
      return { sentiment: 'positive', confidence: 0.8, suggestedTone: 'friendly' };
    }
    
    // Detect negative sentiment
    if (normalizedQuestion.includes('খারাপ') || 
        normalizedQuestion.includes('সমস্যা') || 
        normalizedQuestion.includes('ভুল')) {
      return { sentiment: 'negative', confidence: 0.7, suggestedTone: 'helpful' };
    }
    
    return { sentiment: 'neutral', confidence: 0.6, suggestedTone: 'friendly' };
  }

  // Enhanced context-aware response generation
  private generateContextAwareResponse(question: string, facts: ExtractedFact[], emotionalContext: EmotionalContext): string {
    const previousQuestions = this.conversationContext.previousQuestions;
    const currentTopic = this.conversationContext.currentTopic;
    
    // Check if this is a follow-up question
    const isFollowUp = previousQuestions.length > 0 && (
      question.includes('আরও') || 
      question.includes('তাহলে') || 
      question.includes('আর') ||
      question.includes('অন্য')
    );
    
    let responsePrefix = '';
    
    // Add emotional intelligence to response
    switch (emotionalContext.sentiment) {
      case 'frustrated':
        responsePrefix = 'আমি বুঝতে পারছি আপনি হয়তো কিছুটা বিরক্ত। আসুন আমি আরও স্পষ্ট করে বলি: ';
        break;
      case 'curious':
        responsePrefix = this.getRandomResponse(this.emotionalResponses.curious.exploring) + ' ';
        break;
      case 'positive':
        responsePrefix = this.getRandomResponse(this.emotionalResponses.positive.greeting) + ' ';
        break;
    }
    
    if (isFollowUp && currentTopic) {
      responsePrefix += `${currentTopic} সম্পর্কে আরও তথ্য: `;
    }
    
    // Generate main response based on facts
    const mainResponse = this.generateFactBasedResponse(question, facts);
    
    return responsePrefix + mainResponse;
  }

  private generateFactBasedResponse(question: string, facts: ExtractedFact[]): string {
    if (facts.length === 0) return '';
    
    const bestFact = facts.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    const questionWords = question.toLowerCase().split(/\s+/);
    
    // Context-aware response generation
    if (questionWords.some(word => ['কোথায়', 'স্থান'].includes(word))) {
      return `${bestFact.subject} ${bestFact.object}। এই তথ্যটি ${Math.round(bestFact.confidence * 100)}% নিশ্চিততার সাথে বলা যায়।`;
    }
    
    if (questionWords.some(word => ['কখন', 'সময়'].includes(word))) {
      return `${bestFact.subject} ${bestFact.object}। সময়ের হিসেবে এটি একটি গুরুত্বপূর্ণ তথ্য।`;
    }
    
    if (questionWords.some(word => ['নাম', 'কে'].includes(word))) {
      return `${bestFact.predicate}: ${bestFact.object}। এই নামটি ${bestFact.context || 'ইতিহাসে'} বিশেষ গুরুত্ব রাখে।`;
    }
    
    return `${bestFact.subject} সম্পর্কে: ${bestFact.object}। ${bestFact.context ? 'প্রসঙ্গ: ' + bestFact.context : ''}`;
  }

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Enhanced fact extraction with more patterns
  private extractAdvancedFacts(content: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const sentences = content.split(/[।!?\n]/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      
      // Enhanced birth location patterns
      const birthLocationPatterns = [
        /(.+?)\s+(পশ্চিমবঙ্গের?|বাংলাদেশের?|ভারতের?)\s*(.+?)\s*(জেলার?|বিভাগের?)\s*(.+?)\s*(গ্রামে?|শহরে?)\s*(জন্মগ্রহণ|জন্ম)/,
        /(জন্মগ্রহণ|জন্ম).+?(.+?)\s*(গ্রামে?|শহরে?|জেলায?)/,
        /(.+?)\s*(এ|এর|তে)\s*(জন্ম|জন্মগ্রহণ)/
      ];
      
      birthLocationPatterns.forEach((pattern, index) => {
        const match = trimmedSentence.match(pattern);
        if (match) {
          let location, subject;
          if (index === 0) {
            subject = match[1]?.trim() || 'তিনি';
            const state = match[2]?.replace(/র$/, '') || '';
            const district = match[3] || '';
            const village = match[5] || '';
            location = `${state} ${district} জেলার ${village} গ্রামে`;
          } else if (index === 1) {
            subject = 'তিনি';
            location = match[2]?.trim() + ' ' + match[3];
          } else {
            subject = 'তিনি';
            location = match[1]?.trim();
          }
          
          facts.push({
            type: 'location',
            subject: subject,
            predicate: 'জন্মগ্রহণ করেছেন',
            object: location.trim(),
            confidence: 0.9 - (index * 0.1),
            context: 'জন্মস্থান তথ্য'
          });
        }
      });
      
      // Enhanced relationship patterns
      const relationshipPatterns = [
        /(তার|তাঁর|তিনি|এর)\s+(বাবার|মাতার|মায়ের|মেয়ের|ছেলের|পিতার|কন্যার|পুত্রের|স্ত্রীর|স্বামীর)\s+নাম\s+(.+)/,
        /(.+?)\s*(তার|তাঁর|এর)\s+(বাবা|মা|পিতা|মাতা|স্ত্রী|স্বামী|পুত্র|কন্যা)/,
        /(বিবাহ|বিয়ে).+?(.+)/
      ];
      
      relationshipPatterns.forEach(pattern => {
        const match = trimmedSentence.match(pattern);
        if (match) {
          facts.push({
            type: 'relationship',
            subject: match[1] || 'তিনি',
            predicate: match[2] + ' নাম' || 'সম্পর্ক',
            object: match[3]?.trim() || '',
            confidence: 0.85,
            context: 'পারিবারিক সম্পর্ক'
          });
        }
      });
      
      // Time-based facts
      const timePatterns = [
        /(\d{4})\s*সালে?\s*(জন্ম|জন্মগ্রহণ|মৃত্যু|মারা|ইন্তেকাল)/,
        /(\d{1,2})\s*(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)\s*(\d{4})/
      ];
      
      timePatterns.forEach(pattern => {
        const match = trimmedSentence.match(pattern);
        if (match) {
          facts.push({
            type: 'time',
            subject: 'তিনি',
            predicate: match[2] || 'সময়কাল',
            object: match[1] + (match[3] ? ' ' + match[2] + ' ' + match[3] : ' সালে'),
            confidence: 0.9,
            context: 'সময়কাল তথ্য'
          });
        }
      });
    });
    
    return facts;
  }

  async generateResponse(question: string): Promise<string> {
    // Update conversation context
    this.conversationContext.previousQuestions.push(question);
    if (this.conversationContext.previousQuestions.length > 10) {
      this.conversationContext.previousQuestions.shift();
    }
    
    // Analyze emotional context
    const emotionalContext = this.analyzeEmotionalContext(question);
    
    // Find relevant knowledge
    const relevantKnowledge = this.findBestMatches(question);
    
    if (relevantKnowledge.length > 0) {
      // Extract facts with enhanced patterns
      const facts = this.extractAdvancedFacts(relevantKnowledge[0].content);
      
      // Generate context-aware response
      const intelligentResponse = this.generateContextAwareResponse(question, facts, emotionalContext);
      
      if (intelligentResponse.trim()) {
        // Save to session memory
        this.conversationContext.sessionMemory.push({
          question,
          answer: intelligentResponse,
          timestamp: new Date()
        });
        
        // Update current topic
        this.conversationContext.currentTopic = relevantKnowledge[0].title;
        
        this.saveConversationContext();
        return intelligentResponse;
      }
    }
    
    // Enhanced general response with emotional intelligence
    return this.generateEmotionallyIntelligentResponse(question, emotionalContext);
  }

  private generateEmotionallyIntelligentResponse(question: string, emotionalContext: EmotionalContext): string {
    const greetings = ['হ্যালো', 'নমস্কার', 'সালাম', 'হাই', 'hello', 'hi'];
    const thanks = ['ধন্যবাদ', 'থ্যাংক', 'thanks', 'thank you'];
    
    if (greetings.some(greeting => question.toLowerCase().includes(greeting))) {
      return "নমস্কার! আমি একটি উন্নত AI সহায়ক। আমি এখন আরও স্মার্ট হয়েছি এবং আপনার আবেগ ও প্রসঙ্গ বুঝতে পারি। আপনি আমাকে যেকোনো প্রশ্ন করতে পারেন!";
    }
    
    if (thanks.some(thank => question.toLowerCase().includes(thank))) {
      return "আপনাকেও অনেক ধন্যবাদ! আমি সব সময় আপনার সেবায় নিয়োজিত। আরও কিছু জানতে চাইলে বলুন।";
    }

    // Emotionally intelligent responses based on context
    switch (emotionalContext.sentiment) {
      case 'frustrated':
        return "আমি বুঝতে পারছি আপনি হয়তো হতাশ। আমি আরও ভালো করে সাহায্য করার চেষ্টা করব। আপনার প্রশ্নটি আরেকবার ভিন্নভাবে জিজ্ঞেস করুন, অথবা আমাকে এই বিষয়ে কিছু শেখান।";
        
      case 'curious':
        return "চমৎকার প্রশ্ন! আমার কাছে এই মুহূর্তে এই বিষয়ে পর্যাপ্ত তথ্য নেই, কিন্তু আপনি চাইলে আমাকে শেখাতে পারেন। আমি এখন আরও স্মার্ট এবং প্রসঙ্গ বুঝে কথা বলতে পারি।";
        
      case 'positive':
        return "আপনার ইতিবাচক মনোভাব দেখে আমি খুশি! আমি এখন আরও উন্নত AI হয়েছি যা আপনার আবেগ ও চাহিদা বুঝতে পারে। আরও কিছু জানতে চাইলে জিজ্ঞেস করুন।";
        
      default:
        return "আমি আপনার প্রশ্ন বুঝতে পারছি। আমি এখন আরও স্মার্ট এবং প্রসঙ্গ-সচেতন। আপনার আবেগ ও উদ্দেশ্য বুঝে উত্তর দিতে পারি। আরও বিস্তারিত বললে আমি আরও ভালো সাহায্য করতে পারব।";
    }
  }

  private findBestMatches(question: string): KnowledgeItem[] {
    if (!this.fuseInstance) return [];
    
    const normalizedQuestion = this.normalizeText(question);
    const fuseResults = this.fuseInstance.search(normalizedQuestion);
    
    // Enhanced matching with context consideration
    const contextMatches = fuseResults.filter(result => {
      const currentTopic = this.conversationContext.currentTopic;
      return !currentTopic || result.item.title.includes(currentTopic) || result.score! < 0.3;
    });
    
    return contextMatches.length > 0 ? 
      contextMatches.slice(0, 3).map(r => r.item) : 
      fuseResults.slice(0, 3).map(r => r.item);
  }

  private normalizeText(text: string): string {
    let normalized = text.toLowerCase().trim();
    
    Object.entries(this.bengaliSynonyms).forEach(([key, synonyms]) => {
      synonyms.forEach(synonym => {
        const regex = new RegExp(`\\b${synonym}\\b`, 'g');
        normalized = normalized.replace(regex, key);
      });
    });
    
    return normalized;
  }

  async learnFromText(title: string, content: string): Promise<void> {
    const keywords = this.extractKeywords(content);
    const relatedTopics = this.extractRelatedTopics(content);
    
    const newKnowledge: KnowledgeItem = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      timestamp: new Date(),
      tags: this.extractTags(content),
      keywords: keywords,
      importance: this.calculateImportance(content),
      relatedTopics: relatedTopics
    };

    this.knowledgeBase.push(newKnowledge);
    this.saveKnowledgeToStorage();
    this.updateFuseInstance();
    
    console.log('Enhanced learning completed:', newKnowledge);
  }

  private extractTags(content: string): string[] {
    const keywords = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
    return [...new Set(keywords)].slice(0, 8);
  }

  private extractRelatedTopics(content: string): string[] {
    const topics: string[] = [];
    const sentences = content.split(/[।!?]/);
    
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !topics.includes(word)) {
          topics.push(word);
        }
      });
    });
    
    return topics.slice(0, 5);
  }

  private calculateImportance(content: string): number {
    let importance = 1;
    
    // Increase importance for longer content
    if (content.length > 500) importance += 0.5;
    if (content.length > 1000) importance += 0.5;
    
    // Increase importance for content with dates
    if (/\d{4}/.test(content)) importance += 0.3;
    
    // Increase importance for content with names
    if (content.includes('নাম')) importance += 0.2;
    
    return Math.min(importance, 3);
  }

  // Keep existing methods for compatibility
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
    this.conversationContext = {
      previousQuestions: [],
      currentTopic: '',
      userPreferences: {},
      sessionMemory: []
    };
    this.saveKnowledgeToStorage();
    this.saveConversationContext();
    this.updateFuseInstance();
  }

  getKnowledgeStats(): { total: number; topics: string[] } {
    return {
      total: this.knowledgeBase.length,
      topics: [...new Set(this.knowledgeBase.map(item => item.title))]
    };
  }

  // New method to get conversation insights
  getConversationInsights(): { 
    totalQuestions: number; 
    currentTopic: string; 
    recentQuestions: string[];
    sessionMemoryCount: number;
  } {
    return {
      totalQuestions: this.conversationContext.previousQuestions.length,
      currentTopic: this.conversationContext.currentTopic,
      recentQuestions: this.conversationContext.previousQuestions.slice(-5),
      sessionMemoryCount: this.conversationContext.sessionMemory.length
    };
  }
}

export const EnhancedAIService = new EnhancedAIServiceClass();
