
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Database, BookOpen } from "lucide-react";
import { AIService } from "@/services/AIService";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
}

export const KnowledgeBase = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = knowledgeItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(knowledgeItems);
    }
  }, [searchTerm, knowledgeItems]);

  const loadKnowledgeBase = () => {
    const knowledge = AIService.getKnowledgeBase();
    setKnowledgeItems(knowledge);
  };

  const deleteKnowledgeItem = (id: string) => {
    AIService.deleteKnowledge(id);
    loadKnowledgeBase();
    toast({
      title: "Deleted",
      description: "Knowledge item has been removed from the database.",
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

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-600" />
              <span>নলেজ বেস</span>
              <Badge variant="secondary">{knowledgeItems.length} items</Badge>
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};
