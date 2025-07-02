import Fuse from 'fuse.js';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
  keywords: string[];
}

interface ConversationContext {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  lastUpdated: Date;
}

interface ExtractedFact {
  type: 'location' | 'time' | 'name' | 'relationship' | 'general' | 'address' | 'occupation' | 'education';
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

class AIServiceClass {
  private knowledgeBase: KnowledgeItem[] = [];
  private fuseInstance: Fuse<KnowledgeItem> | null = null;
  private conversationContext: ConversationContext | null = null;

  // Enhanced Bengali question patterns with more variations
  private questionPatterns = {
    home_location: [
      'বাসা কোথায়', 'তোমার বাসা কোথায়', 'আপনার বাসা কোথায়', 'ঘর কোথায়', 
      'থাকেন কোথায়', 'থাকো কোথায়', 'বাড়ি কোথায়', 'বসবাস কোথায়',
      'আবাস কোথায়', 'বাসস্থান কোথায়', 'বাসা কোন জায়গায়'
    ],
    birth_location: [
      'কোথায় জন্মগ্রহণ', 'কোথায় জন্ম', 'জন্মস্থান', 'কোন গ্রামে জন্ম', 
      'কোন জায়গায় জন্ম', 'জন্ম কোথায়'
    ],
    name: [
      'নাম কি', 'নাম কী', 'কি নাম', 'কী নাম', 'তোমার নাম', 'আপনার নাম',
      'নামটা কি', 'নামটা কী'
    ],
    age: [
      'বয়স কত', 'কত বয়স', 'তোমার বয়স', 'আপনার বয়স', 'বয়স কতো'
    ],
    occupation: [
      'কি কাজ করে', 'কী কাজ করে', 'পেশা কি', 'পেশা কী', 'চাকরি কি', 
      'কাজ কি', 'কর্মক্ষেত্র কি'
    ],
    education: [
      'কোথায় পড়ে', 'কোথায় পড়াশোনা', 'স্কুল কোথায়', 'কলেজ কোথায়', 
      'পড়াশোনা কোথায়', 'অধ্যয়ন কোথায়'
    ],
    marital_status: [
      'বিবাহিত', 'বিয়ে হয়েছে', 'বিবাহের অবস্থা', 'স্বামী আছে', 'স্ত্রী আছে'
    ]
  };

  constructor() {
    this.loadKnowledgeFromStorage();
    this.loadConversationContext();
    this.updateFuseInstance();
  }

  private loadConversationContext() {
    try {
      const stored = localStorage.getItem('conversation-context');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.conversationContext = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          messages: parsed.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
      } else {
        this.conversationContext = {
          id: Date.now().toString(),
          messages: [],
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Error loading conversation context:', error);
      this.conversationContext = {
        id: Date.now().toString(),
        messages: [],
        lastUpdated: new Date()
      };
    }
  }

  private saveConversationContext() {
    try {
      if (this.conversationContext) {
        localStorage.setItem('conversation-context', JSON.stringify(this.conversationContext));
      }
    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  }

  private addToConversationContext(role: 'user' | 'assistant', content: string) {
    if (!this.conversationContext) {
      this.conversationContext = {
        id: Date.now().toString(),
        messages: [],
        lastUpdated: new Date()
      };
    }

    this.conversationContext.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep only last 10 messages to prevent memory issues
    if (this.conversationContext.messages.length > 10) {
      this.conversationContext.messages = this.conversationContext.messages.slice(-10);
    }

    this.conversationContext.lastUpdated = new Date();
    this.saveConversationContext();
  }

  private normalizeQuestion(question: string): string {
    let normalized = question.toLowerCase().trim();
    
    // Remove common punctuation
    normalized = normalized.replace(/[।,;:!?\-()]/g, ' ');
    
    // Normalize spacing
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized;
  }

  private findQuestionType(question: string): string {
    const normalized = this.normalizeQuestion(question);
    
    for (const [type, patterns] of Object.entries(this.questionPatterns)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern.toLowerCase())) {
          return type;
        }
      }
    }
    
    return 'general';
  }

  private extractContextualFacts(content: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const sentences = content.split(/[।!\n]/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Name extraction
      const namePattern = /আমার নাম (.+?)(?:\s|।|$)/;
      const nameMatch = trimmed.match(namePattern);
      if (nameMatch) {
        facts.push({
          type: 'name',
          subject: 'আমি',
          predicate: 'নাম',
          object: nameMatch[1].trim(),
          confidence: 0.9
        });
      }

      // Age extraction
      const agePattern = /বয়স (\d+)/;
      const ageMatch = trimmed.match(agePattern);
      if (ageMatch) {
        facts.push({
          type: 'general',
          subject: 'আমার',
          predicate: 'বয়স',
          object: ageMatch[1] + ' বছর',
          confidence: 0.9
        });
      }

      // Address extraction - enhanced
      const addressPattern = /বাসা (.+?)(?:\s|।|$)/;
      const addressMatch = trimmed.match(addressPattern);
      if (addressMatch) {
        facts.push({
          type: 'address',
          subject: 'আমার',
          predicate: 'বাসা',
          object: addressMatch[1].trim(),
          confidence: 0.9
        });
      }

      // Location extraction
      const locationPattern = /থাকি (.+?)(?:\s|।|$)/;
      const locationMatch = trimmed.match(locationPattern);
      if (locationMatch) {
        facts.push({
          type: 'location',
          subject: 'আমি',
          predicate: 'থাকি',
          object: locationMatch[1].trim(),
          confidence: 0.9
        });
      }

      // Occupation extraction
      const occupationPattern = /(.+?)\s+(কর্মরত|চাকরি|কাজ)/;
      const occupationMatch = trimmed.match(occupationPattern);
      if (occupationMatch) {
        facts.push({
          type: 'occupation',
          subject: 'স্বামী',
          predicate: 'পেশা',
          object: occupationMatch[1].trim(),
          confidence: 0.8
        });
      }

      // Education extraction
      const educationPattern = /(.+?)\s+(পড়ি|অধ্যয়ন)/;
      const educationMatch = trimmed.match(educationPattern);
      if (educationMatch) {
        facts.push({
          type: 'education',
          subject: 'আমি',
          predicate: 'পড়াশোনা',
          object: educationMatch[1].trim(),
          confidence: 0.8
        });
      }

      // Marital status
      if (trimmed.includes('বিবাহিতা')) {
        facts.push({
          type: 'general',
          subject: 'আমি',
          predicate: 'বৈবাহিক অবস্থা',
          object: 'বিবাহিতা',
          confidence: 0.9
        });
      }
    });
    
    return facts;
  }

  private generateContextualResponse(question: string, facts: ExtractedFact[]): string | null {
    const questionType = this.findQuestionType(question);
    const normalized = this.normalizeQuestion(question);
    
    console.log('Question type:', questionType);
    console.log('Available facts:', facts);
    
    switch (questionType) {
      case 'home_location':
        // Find address or location facts
        const addressFact = facts.find(f => f.type === 'address' || (f.type === 'location' && f.predicate === 'থাকি'));
        if (addressFact) {
          return `আমার ${addressFact.object}।`;
        }
        break;
        
      case 'name':
        const nameFact = facts.find(f => f.type === 'name');
        if (nameFact) {
          return `আমার নাম ${nameFact.object}।`;
        }
        break;
        
      case 'age':
        const ageFact = facts.find(f => f.predicate === 'বয়স');
        if (ageFact) {
          return `আমার ${ageFact.object}।`;
        }
        break;
        
      case 'occupation':
        const occupationFact = facts.find(f => f.type === 'occupation');
        if (occupationFact) {
          return `আমার স্বামী ${occupationFact.object} হিসেবে কাজ করেন।`;
        }
        break;
        
      case 'education':
        const educationFact = facts.find(f => f.type === 'education');
        if (educationFact) {
          return `আমি ${educationFact.object} পড়ি।`;
        }
        break;
        
      case 'marital_status':
        const maritalFact = facts.find(f => f.predicate === 'বৈবাহিক অবস্থা');
        if (maritalFact) {
          return `হ্যাঁ, আমি ${maritalFact.object}।`;
        }
        break;
    }
    
    return null;
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

  private findBestMatches(question: string): KnowledgeItem[] {
    if (!this.fuseInstance) return [];
    
    const fuseResults = this.fuseInstance.search(question);
    return fuseResults
      .filter(result => result.score! < 0.5)
      .map(result => result.item)
      .slice(0, 3);
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
  }

  async generateResponse(question: string): Promise<string> {
    // Add user question to conversation context
    this.addToConversationContext('user', question);
    
    const relevantKnowledge = this.findBestMatches(question);
    
    if (relevantKnowledge.length > 0) {
      // Extract facts from knowledge
      const allFacts = relevantKnowledge.flatMap(knowledge => 
        this.extractContextualFacts(knowledge.content)
      );
      
      // Try contextual response first
      const contextualResponse = this.generateContextualResponse(question, allFacts);
      
      if (contextualResponse) {
        this.addToConversationContext('assistant', contextualResponse);
        return contextualResponse;
      }
      
      // Fallback to general response
      const generalResponse = this.generateSmartResponse(question, relevantKnowledge);
      this.addToConversationContext('assistant', generalResponse);
      return generalResponse;
    }

    const generalResponse = this.generateGeneralResponse(question);
    this.addToConversationContext('assistant', generalResponse);
    return generalResponse;
  }

  private generateSmartResponse(question: string, knowledgeItems: KnowledgeItem[]): string {
    const primaryKnowledge = knowledgeItems[0];
    return `${primaryKnowledge.title} সম্পর্কে: ${primaryKnowledge.content.substring(0, 300)}${primaryKnowledge.content.length > 300 ? '...' : ''}`;
  }

  private generateGeneralResponse(question: string): string {
    if (question.toLowerCase().includes('হ্যালো') || question.toLowerCase().includes('নমস্কার')) {
      return "নমস্কার! আমি আপনার AI সহায়ক। আপনি আমাকে যেকোনো প্রশ্ন করতে পারেন।";
    }
    
    return "দুঃখিত, আমার কাছে এই বিষয়ে তথ্য নেই। আপনি চাইলে আমাকে এই বিষয়ে শেখাতে পারেন।";
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

  clearConversationContext(): void {
    this.conversationContext = {
      id: Date.now().toString(),
      messages: [],
      lastUpdated: new Date()
    };
    this.saveConversationContext();
  }
}

export const AIService = new AIServiceClass();
