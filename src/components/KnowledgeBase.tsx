
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trash2, Database, BookOpen, MessageSquare } from "lucide-react";
import { AIService } from "@/services/AIService";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
}

interface QuestionAnswerPair {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  keywords: string[];
}

export const KnowledgeBase = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [questionAnswerPairs, setQuestionAnswerPairs] = useState<QuestionAnswerPair[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const [filteredQAs, setFilteredQAs] = useState<QuestionAnswerPair[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      // Filter knowledge items
      const filtered = knowledgeItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);

      // Filter Q&A pairs
      const filteredQA = questionAnswerPairs.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredQAs(filteredQA);
    } else {
      setFilteredItems(knowledgeItems);
      setFilteredQAs(questionAnswerPairs);
    }
  }, [searchTerm, knowledgeItems, questionAnswerPairs]);

  const loadKnowledgeBase = () => {
    const knowledge = AIService.getKnowledgeBase();
    const qaPairs = AIService.getQuestionAnswerPairs();
    setKnowledgeItems(knowledge);
    setQuestionAnswerPairs(qaPairs);
  };

  const deleteKnowledgeItem = (id: string) => {
    AIService.deleteKnowledge(id);
    loadKnowledgeBase();
    toast({
      title: "Deleted",
      description: "Knowledge item has been removed from the database.",
    });
  };

  const deleteQAItem = (id: string) => {
    AIService.deleteQuestionAnswer(id);
    loadKnowledgeBase();
    toast({
      title: "মুছে ফেলা হয়েছে",
      description: "প্রশ্ন-উত্তর ডাটাবেস থেকে সরিয়ে দেওয়া হয়েছে।",
    });
  };

  const clearAllKnowledge = () => {
    AIService.clearKnowledgeBase();
    loadKnowledgeBase();
    toast({
      title: "Cleared",
      description: "All knowledge has been cleared from the database.",
    });
  };

  const clearAllQAs = () => {
    AIService.clearQuestionAnswers();
    loadKnowledgeBase();
    toast({
      title: "সাফ করা হয়েছে",
      description: "সব প্রশ্ন-উত্তর ডাটাবেস থেকে সাফ করা হয়েছে।",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-600" />
              <span>নলেজ বেস</span>
              <Badge variant="secondary">{knowledgeItems.length + questionAnswerPairs.length} items</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="নলেজ বেসে খোঁজ করুন..."
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="qa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qa" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>প্রশ্ন-উত্তর ({questionAnswerPairs.length})</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>জ্ঞান ({knowledgeItems.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qa" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">প্রশ্ন-উত্তর তালিকা</h3>
                {questionAnswerPairs.length > 0 && (
                  <Button
                    onClick={clearAllQAs}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    সব মুছে ফেলুন
                  </Button>
                )}
              </div>

              {filteredQAs.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    {questionAnswerPairs.length === 0 ? "কোন প্রশ্ন-উত্তর নেই" : "কিছু খুঁজে পাওয়া যায়নি"}
                  </h3>
                  <p className="text-gray-400">
                    {questionAnswerPairs.length === 0 
                      ? "প্রশ্ন-উত্তর যোগ করুন যাতে AI সরাসরি উত্তর দিতে পারে"
                      : "আপনার খোঁজার সাথে মিলে এমন কোন প্রশ্ন-উত্তর পাওয়া যায়নি"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQAs.map((item) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="mb-2">
                              <Badge variant="outline" className="text-xs mb-1">প্রশ্ন</Badge>
                              <p className="font-medium text-blue-700">{item.question}</p>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs mb-1">উত্তর</Badge>
                              <p className="text-gray-700">{item.answer}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteQAItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.slice(0, 3).map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {item.timestamp.toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">জ্ঞান ভান্ডার</h3>
                {knowledgeItems.length > 0 && (
                  <Button
                    onClick={clearAllKnowledge}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    সব মুছে ফেলুন
                  </Button>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    {knowledgeItems.length === 0 ? "কোন জ্ঞান সংরক্ষিত নেই" : "কিছু খুঁজে পাওয়া যায়নি"}
                  </h3>
                  <p className="text-gray-400">
                    {knowledgeItems.length === 0 
                      ? "AI বটকে কিছু শেখান যাতে এখানে তথ্য দেখা যায়"
                      : "আপনার খোঁজার সাথে মিলে এমন কোন তথ্য পাওয়া যায়নি"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{item.title}</h4>
                          <Button
                            onClick={() => deleteKnowledgeItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                          {item.content.length > 200 
                            ? `${item.content.substring(0, 200)}...` 
                            : item.content
                          }
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {item.timestamp.toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
