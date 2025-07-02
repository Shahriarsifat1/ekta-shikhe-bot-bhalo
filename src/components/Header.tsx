
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AdminPanel } from "./AdminPanel";

export const Header = () => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                <img 
                  src="/lovable-uploads/d4bde19e-2ae2-48fb-8d93-0f4bd9293bf9.png" 
                  alt="Sofia" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Sofia
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-sm text-white/80">Online</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowAdminPanel(true)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
    </>
  );
};
