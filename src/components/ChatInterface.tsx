
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Paperclip, Smile, MoreVertical, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAIService } from "@/services/EnhancedAIService";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  emotion?: string;
  confidence?: number;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "👋 হ্যালো! আমি Sofia, আপনার উন্নত AI সহায়ক। আমি এখন আরও স্মার্ট হয়েছি এবং আপনার প্রসঙ্গ ও আবেগ বুঝতে পারি। কিভাবে সাহায্য করতে পারি?",
      timestamp: new Date(),
      emotion: "friendly"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate intelligent processing delay
      setTimeout(() => setIsTyping(false), 800);
      
      const response = await EnhancedAIService.generateResponse(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response,
        timestamp: new Date(),
        confidence: 0.9
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1200);
    } catch (error) {
      console.error("Error generating enhanced response:", error);
      setIsTyping(false);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInsights = () => {
    return EnhancedAIService.getConversationInsights();
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-gradient-to-b from-purple-100 to-pink-50 rounded-lg overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Enhanced Header with AI Status */}
        <div className="bg-white/90 backdrop-blur-sm border-b p-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Enhanced AI Mode</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
            className="text-xs"
          >
            {showInsights ? 'লুকান' : 'তথ্য দেখুন'}
          </Button>
        </div>

        {/* Conversation Insights Panel */}
        {showInsights && (
          <div className="bg-purple-50 p-3 border-b text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>প্রশ্ন: {getInsights().totalQuestions}</div>
              <div>বর্তমান বিষয়: {getInsights().currentTopic || 'নেই'}</div>
            </div>
          </div>
        )}
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-end space-x-2 max-w-[75%] ${
                  message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {message.type === "user" ? (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Brain size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <div
                  className={`rounded-2xl p-3 shadow-sm relative ${
                    message.type === "user"
                      ? "bg-purple-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm border border-purple-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs ${
                      message.type === "user" ? "text-purple-100" : "text-gray-400"
                    }`}>
                      {message.timestamp.toLocaleTimeString('bn-BD', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {message.confidence && message.type === "bot" && (
                      <span className="text-xs text-green-600">
                        ✓ {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {message.emotion && message.type === "bot" && (
                    <div className="absolute -top-1 -right-1 text-xs">
                      {message.emotion === 'friendly' ? '😊' : 
                       message.emotion === 'helpful' ? '🤝' : 
                       message.emotion === 'curious' ? '🤔' : '💭'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Enhanced Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Brain size={16} className="text-white animate-pulse" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm p-3 shadow-sm border border-purple-100">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-xs text-purple-600">চিন্তা করছি...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Enhanced Input Area */}
        <div className="bg-white/90 backdrop-blur-sm border-t p-4">
          <div className="flex items-center space-x-3 bg-white rounded-full shadow-sm border border-purple-200 px-4 py-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-600">
              <Paperclip size={20} />
            </Button>
            
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="আমার সাথে কথা বলুন... (আমি এখন আরও স্মার্ট!)"
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-600">
              <Smile size={20} />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full w-10 h-10 p-0 shadow-lg"
            >
              <Send size={16} />
            </Button>
          </div>
          
          {/* Quick suggestion chips */}
          <div className="flex space-x-2 mt-2 overflow-x-auto">
            {["আরও জানতে চাই", "ব্যাখ্যা করুন", "উদাহরণ দিন"].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap"
                onClick={() => setInputMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
