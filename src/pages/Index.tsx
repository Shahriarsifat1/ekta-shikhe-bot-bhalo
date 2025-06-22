
import { useState } from "react";
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { LearningInterface } from "@/components/LearningInterface";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="chat" className="text-sm font-medium">
                💬 চ্যাট করুন
              </TabsTrigger>
              <TabsTrigger value="learn" className="text-sm font-medium">
                📚 শেখান
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="text-sm font-medium">
                🧠 নলেজ বেস
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0">
              <ChatInterface />
            </TabsContent>

            <TabsContent value="learn" className="mt-0">
              <LearningInterface />
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0">
              <KnowledgeBase />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
