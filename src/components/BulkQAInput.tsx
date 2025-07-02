
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIService } from "@/services/AIService";

export const BulkQAInput = () => {
  const [bulkText, setBulkText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processBulkQA = async () => {
    if (!bulkText.trim()) {
      toast({
        title: "ত্রুটি",
        description: "দয়া করে প্রশ্ন-উত্তর তথ্য প্রদান করুন।",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Parse the bulk text into question-answer pairs
      const pairs = parseBulkText(bulkText);
      
      if (pairs.length === 0) {
        toast({
          title: "ত্রুটি",
          description: "কোনো বৈধ প্রশ্ন-উত্তর জোড়া পাওয়া যায়নি।",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Process each pair
      for (const pair of pairs) {
        try {
          await AIService.addQuestionAnswer(pair.question, pair.answer);
          successCount++;
        } catch (error) {
          console.error("Error adding Q&A pair:", error);
          errorCount++;
        }
      }

      toast({
        title: "সফল!",
        description: `${successCount}টি প্রশ্ন-উত্তর সফলভাবে যোগ করা হয়েছে।${errorCount > 0 ? ` ${errorCount}টি ব্যর্থ হয়েছে।` : ''}`,
      });

      if (successCount > 0) {
        setBulkText("");
      }
    } catch (error) {
      console.error("Error processing bulk Q&A:", error);
      toast({
        title: "ত্রুটি",
        description: "প্রশ্ন-উত্তর প্রক্রিয়াকরণে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseBulkText = (text: string): { question: string; answer: string }[] => {
    const pairs: { question: string; answer: string }[] = [];
    
    // Split by double newlines to separate Q&A pairs
    const sections = text.split(/\n\s*\n/).filter(section => section.trim());
    
    for (const section of sections) {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length >= 2) {
        // Try different patterns
        let question = '';
        let answer = '';
        
        // Pattern 1: Q: question, A: answer
        const qPattern = lines.find(line => line.match(/^(Q|প্রশ্ন|প্র):\s*/i));
        const aPattern = lines.find(line => line.match(/^(A|উত্তর|উ):\s*/i));
        
        if (qPattern && aPattern) {
          question = qPattern.replace(/^(Q|প্রশ্ন|প্র):\s*/i, '').trim();
          answer = aPattern.replace(/^(A|উত্তর|উ):\s*/i, '').trim();
        }
        // Pattern 2: First line is question, second line is answer
        else if (lines.length >= 2) {
          question = lines[0].replace(/^(Q|প্রশ্ন|প্র):\s*/i, '').trim();
          answer = lines[1].replace(/^(A|উত্তর|উ):\s*/i, '').trim();
        }
        
        if (question && answer) {
          pairs.push({ question, answer });
        }
      }
    }
    
    return pairs;
  };

  const exampleText = `প্রশ্ন: তুমি কেমন আছো?
উত্তর: আমি ভালো আছি, ধন্যবাদ।

প্রশ্ন: তোমার নাম কি?
উত্তর: আমি একটি AI সহায়ক।

Q: আজকের আবহাওয়া কেমন?
A: আজকের আবহাওয়া ভালো।`;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-6 w-6 text-green-600" />
          <span>একসাথে অনেক প্রশ্ন-উত্তর যোগ করুন</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">ফরম্যাট:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>প্রতিটি প্রশ্ন-উত্তর জোড়া আলাদা লাইনে লিখুন</li>
                <li>"প্রশ্ন:" বা "Q:" দিয়ে প্রশ্ন শুরু করুন</li>
                <li>"উত্তর:" বা "A:" দিয়ে উত্তর শুরু করুন</li>
                <li>প্রতিটি জোড়ার মধ্যে একটি খালি লাইন রাখুন</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="bulkText">প্রশ্ন-উত্তর তালিকা</Label>
          <Textarea
            id="bulkText"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={exampleText}
            className="mt-1 min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bulkText ? `${bulkText.split(/\n\s*\n/).filter(s => s.trim()).length} টি সেকশন পাওয়া গেছে` : 'উদাহরণ অনুসরণ করুন'}
          </p>
        </div>

        <Button
          onClick={processBulkQA}
          disabled={isProcessing || !bulkText.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {isProcessing ? (
            <>
              <Plus className="mr-2 h-4 w-4 animate-spin" />
              প্রক্রিয়াকরণ চলছে...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              সব প্রশ্ন-উত্তর যোগ করুন
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
