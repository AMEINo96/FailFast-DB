"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import ExploreView from "@/components/ExploreView";
import RateIdeaForm from "@/components/RateIdeaForm";
import ShareIdeaForm from "@/components/ShareIdeaForm";
import { AuthProvider } from "@/components/AuthContext";
import SignUpModal from "@/components/SignUpModal";
import ProjectDetailModal from "@/components/ProjectDetailModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"explore" | "rate" | "share">("explore");
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col relative w-full overflow-hidden bg-slate-950">
        
        {/* Background Decorators */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-slate-800/40 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
        </div>

        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onOpenSignUp={() => setShowSignUp(true)} 
        />
        
        <main className="flex-1 w-full relative z-10">
          {activeTab === "explore" && <ExploreView onRequireAuth={() => setShowSignUp(true)} />}
          {activeTab === "rate" && (
            <RateIdeaForm 
              onProjectClick={(projectId) => setSelectedProjectId(projectId)} 
            />
          )}
          {activeTab === "share" && <ShareIdeaForm onRequireAuth={() => setShowSignUp(true)} />}
        </main>

        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}

        {/* Detail modal — opened from Analyze tab's similar projects OR from ExploreView */}
        {selectedProjectId && (
          <ProjectDetailModal
            projectId={selectedProjectId}
            onClose={() => setSelectedProjectId(null)}
          />
        )}
      </div>
    </AuthProvider>
  );
}
