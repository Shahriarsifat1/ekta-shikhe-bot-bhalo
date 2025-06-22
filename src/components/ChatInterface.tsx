
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Paperclip, Smile, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIService } from "@/services/AIService";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "👋 হ্যালো! আমি আপনার ভার্চুয়াল সহায়ক। কিভাবে সাহায্য করতে পারি?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Maintain focus on input after sending message
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
      // Simulate typing delay
      setTimeout(() => setIsTyping(false), 1000);
      
      const response = await AIService.generateResponse(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error generating response:", error);
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

  return (
    <div className="h-[calc(100vh-120px)] bg-gradient-to-b from-purple-100 to-pink-50 rounded-lg overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-end space-x-2 max-w-[70%] ${
                  message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {message.type === "user" ? (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  ) : (
                    <img 
                      src="/lovable-uploads/d4bde19e-2ae2-48fb-8d93-0f4bd9293bf9.png" 
                      alt="Sofia" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div
                  className={`rounded-2xl p-3 shadow-sm ${
                    message.type === "user"
                      ? "bg-purple-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm border"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === "user" ? "text-purple-100" : "text-gray-400"
                  }`}>
                    {message.timestamp.toLocaleTimeString('bn-BD', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src="/lovable-uploads/d4bde19e-2ae2-48fb-8d93-0f4bd9293bf9.png" 
                    alt="Sofia" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm p-3 shadow-sm border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-sm border-t p-4">
          <div className="flex items-center space-x-3 bg-white rounded-full shadow-sm border px-4 py-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Paperclip size={20} />
            </Button>
            
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="প্রশ্ন লিখুন..."
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Smile size={20} />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-full w-10 h-10 p-0"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
