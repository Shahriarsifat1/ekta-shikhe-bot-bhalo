
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 flex flex-col">
      <Header />
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
