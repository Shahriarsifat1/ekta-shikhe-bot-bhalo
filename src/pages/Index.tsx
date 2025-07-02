
import { useState } from "react";
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { LearningInterface } from "@/components/LearningInterface";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            একটা স্মার্ট AI বট
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            একটি উন্নত AI বট যা নিজে থেকে শিখতে পারে, প্যারাগ্রাফ বিশ্লেষণ করতে পারে এবং বুদ্ধিমত্তার সাথে উত্তর দিতে পারে
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
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
