
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { 
  Settings, 
  Database, 
  MessageSquare, 
  Users, 
  BarChart3,
  Download,
  Upload,
  Trash2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState("settings");
  const { toast } = useToast();

  const adminTabs = [
    { id: "settings", label: "সেটিংস", icon: Settings },
    { id: "knowledge", label: "নলেজ বেস", icon: Database },
    { id: "conversations", label: "কথোপকথন", icon: MessageSquare },
    { id: "users", label: "ইউজার", icon: Users },
    { id: "analytics", label: "এনালিটিক্স", icon: BarChart3 },
  ];

  const handleExportData = () => {
    toast({
      title: "ডেটা এক্সপোর্ট",
      description: "ডেটা সফলভাবে এক্সপোর্ট হয়েছে।",
    });
  };

  const handleClearConversations = () => {
    toast({
      title: "কথোপকথন মুছে ফেলা হয়েছে",
      description: "সব কথোপকথন সফলভাবে মুছে ফেলা হয়েছে।",
      variant: "destructive"
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">এডমিন প্যানেল</SheetTitle>
          <SheetDescription>
            সিস্টেম কনফিগারেশন এবং ম্যানেজমেন্ট
          </SheetDescription>
        </SheetHeader>

        <div className="flex mt-6">
          <div className="w-48 border-r pr-4">
            <nav className="space-y-2">
              {adminTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex-1 pl-6">
            {activeTab === "settings" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI কনফিগারেশন</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">AI মডেল</label>
                      <Input defaultValue="GPT-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">টেম্পারেচার</label>
                      <Input type="number" defaultValue="0.7" min="0" max="1" step="0.1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">ম্যাক্স টোকেন</label>
                      <Input type="number" defaultValue="2048" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>সিস্টেম প্রম্পট</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="সিস্টেম প্রম্পট এখানে লিখুন..."
                      rows={4}
                      defaultValue="আপনি একটি সহায়ক AI সহায়ক। আপনি বাংলায় উত্তর দেবেন এবং সর্বদা ভদ্র থাকবেন।"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "knowledge" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>নলেজ বেস ম্যানেজমেন্ট</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Upload className="mr-2 h-4 w-4" />
                        ডকুমেন্ট আপলোড
                      </Button>
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="mr-2 h-4 w-4" />
                        এক্সপোর্ট
                      </Button>
                    </div>
                    <Textarea 
                      placeholder="নতুন তথ্য যোগ করুন..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "conversations" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>কথোপকথন পরিসংখ্যান</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">১২৫</div>
                        <div className="text-sm text-gray-600">মোট কথোপকথন</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">৯৮%</div>
                        <div className="text-sm text-gray-600">সফল রেসপন্স রেট</div>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full mt-4"
                      onClick={handleClearConversations}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      সব কথোপকথন মুছে ফেলুন
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>ইউজার ম্যানেজমেন্ট</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span>মোট ইউজার: ৪৫</span>
                        <span>সক্রিয় ইউজার: ২৮</span>
                      </div>
                      <Input placeholder="ইউজার খুঁজুন..." />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>পারফরমেন্স মেট্রিক্স</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-purple-50 rounded">
                        <div className="text-lg font-semibold text-purple-600">গড় রেসপন্স টাইম</div>
                        <div className="text-2xl font-bold">১.২ সেকেন্ড</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded">
                        <div className="text-lg font-semibold text-orange-600">দৈনিক কোয়েরি</div>
                        <div className="text-2xl font-bold">২৪৭</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
