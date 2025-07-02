
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Upload, MessageSquare, HelpCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIService } from "@/services/AIService";
import { BulkQAInput } from "./BulkQAInput";

export const LearningInterface = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLearning, setIsLearning] = useState(false);
  const [isAddingQA, setIsAddingQA] = useState(false);
  const { toast } = useToast();

  const handleLearnFromText = async () => {
    if (!content.trim() || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content to learn from.",
        variant: "destructive"
      });
      return;
    }

    setIsLearning(true);

    try {
      await AIService.learnFromText(title, content);
      
      toast({
        title: "Learning Successful!",
        description: "I have successfully learned from the provided content.",
      });
      
      setContent("");
      setTitle("");
    } catch (error) {
      console.error("Error learning from text:", error);
      toast({
        title: "Learning Failed",
        description: "Something went wrong while learning. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLearning(false);
    }
  };

  const handleAddQuestionAnswer = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "অনুপস্থিত তথ্য",
        description: "প্রশ্ন এবং উত্তর দুটোই প্রদান করুন।",
        variant: "destructive"
      });
      return;
    }

    setIsAddingQA(true);

    try {
      await AIService.addQuestionAnswer(question, answer);
      
      toast({
        title: "সফল!",
        description: "প্রশ্ন-উত্তর সফলভাবে যোগ করা হয়েছে।",
      });
      
      setQuestion("");
      setAnswer("");
    } catch (error) {
      console.error("Error adding Q&A:", error);
      toast({
        title: "ব্যর্থ",
        description: "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive"
      });
    } finally {
      setIsAddingQA(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">একটি প্রশ্ন-উত্তর</TabsTrigger>
          <TabsTrigger value="bulk">অনেক প্রশ্ন-উত্তর</TabsTrigger>
          <TabsTrigger value="text">টেক্সট শেখান</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          {/* Single Question-Answer Section */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <span>একটি প্রশ্ন-উত্তর যোগ করুন</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question">প্রশ্ন</Label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="যেমন: কেমন আছো?"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="answer">উত্তর</Label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="যেমন: আমি ভালো আছি।"
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              <Button
                onClick={handleAddQuestionAnswer}
                disabled={isAddingQA || !question.trim() || !answer.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isAddingQA ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    যোগ করছি...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    প্রশ্ন-উত্তর যোগ করুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <BulkQAInput />
        </TabsContent>

        <TabsContent value="text" className="space-y-6">
          {/* Text Learning Section */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <span>টেক্সট থেকে শিখান</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">শিরোনাম</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="এই বিষয়টির একটি শিরোনাম দিন..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="content">বিষয়বস্তু</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="এখানে যেকোনো প্যারাগ্রাফ, তথ্য, বা বিষয়বস্তু লিখুন যা থেকে AI শিখবে..."
                  className="mt-1 min-h-[200px]"
                />
              </div>
              
              <Button
                onClick={handleLearnFromText}
                disabled={isLearning || !content.trim() || !title.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isLearning ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    শিখছি...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    শেখান
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">একটি প্রশ্ন</h3>
              <p className="text-sm text-gray-600">
                একটি নির্দিষ্ট প্রশ্নের জন্য সরাসরি উত্তর সেট করুন
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <Plus className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">অনেক প্রশ্ন</h3>
              <p className="text-sm text-gray-600">
                একসাথে অনেকগুলো প্রশ্ন-উত্তর যোগ করুন দ্রুত শেখানোর জন্য
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">স্মার্ট লার্নিং</h3>
              <p className="text-sm text-gray-600">
                প্রতিটি নতুন তথ্য থেকে শিখে আরও বুদ্ধিমান হয়ে ওঠে
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
