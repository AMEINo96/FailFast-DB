"use client";

import { useState } from "react";
import { Project, fetchProjects, submitFeedback, submitSuggestion } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { X, Star, Calendar, MessageSquare, Lightbulb, User as UserIcon, AlertCircle, Loader2 } from "lucide-react";

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onRequireAuth: () => void;
}

export default function ProjectDetailModal({ project, onClose, onRequireAuth }: ProjectDetailModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "feedback" | "suggestions">("details");
  
  // Forms
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [suggestionDesc, setSuggestionDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onRequireAuth(); return; }
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg("");
    try {
      await submitFeedback({ project_id: project.id, user_id: user.user_id, rating, comment, created_at: new Date().toISOString() });
      setSuccessMsg("Feedback submitted successfully!");
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onRequireAuth(); return; }
    if (!suggestionDesc.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg("");
    try {
      await submitSuggestion({ project_id: project.id, user_id: user.user_id, description: suggestionDesc, created_at: new Date().toISOString() });
      setSuccessMsg("Suggestion submitted successfully!");
      setSuggestionDesc("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100">{project.title}</h2>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {project.category}
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
              project.status === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              project.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {project.status || "Failed"}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation within modal */}
        <div className="flex border-b border-slate-800 bg-slate-800/20 px-6">
          <button onClick={() => {setActiveTab("details"); setSuccessMsg("");}} className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Overview</button>
          <button onClick={() => {setActiveTab("feedback"); setSuccessMsg("");}} className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Feedback ({project.feedback?.length || 0})</button>
          <button onClick={() => {setActiveTab("suggestions"); setSuccessMsg("");}} className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'suggestions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Suggestions ({project.suggestions?.length || 0})</button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-200 text-lg leading-relaxed">{project.description}</p>
              </div>

              {project.failure_reasons && project.failure_reasons.length > 0 && (
                <div className={`border rounded-2xl p-5 ${
                  project.status === 'Failed' ? 'bg-red-500/5 border-red-500/10' : 
                  project.status === 'Active' ? 'bg-emerald-500/5 border-emerald-500/10' :
                  project.status === 'Under Review' ? 'bg-amber-500/5 border-amber-500/10' :
                  'bg-slate-500/5 border-slate-500/10'
                }`}>
                  <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                    project.status === 'Failed' ? 'text-red-400' : 
                    project.status === 'Active' ? 'text-emerald-400' :
                    project.status === 'Under Review' ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    <AlertCircle className="w-4 h-4" /> Outcome Post-Mortem
                  </h3>
                  <div className="space-y-4">
                    {project.failure_reasons.map((reason, idx) => (
                      <div key={idx} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mb-2 ${
                          project.status === 'Failed' ? 'bg-red-500/10 text-red-400' : 
                          project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                          project.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {reason.reason_type}
                        </span>
                        <p className="text-slate-300 text-sm">{reason.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
             <div className="space-y-8 animate-in fade-in">
               <form onSubmit={handleFeedbackSubmit} className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                 <h4 className="text-slate-200 font-medium mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-400"/> Leave a Review</h4>
                 <div className="mb-4">
                   <select value={rating} onChange={(e)=>setRating(Number(e.target.value))} className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                     {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                   </select>
                 </div>
                 <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="What did you think of this idea?" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3"/>
                 <div className="flex justify-between items-center">
                   <p className="text-emerald-400 text-sm">{successMsg}</p>
                   <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Submit Feedback"}
                   </button>
                 </div>
               </form>

               <div className="space-y-4">
                 {project.feedback && project.feedback.length > 0 ? project.feedback.map(f => (
                   <div key={f.feedback_id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/50">
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><UserIcon className="w-4 h-4 text-slate-400"/></div>
                         <span className="text-sm font-medium text-slate-300">{f.user_id ? 'User' : 'Anonymous'}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                         <span className="text-sm text-slate-300 font-medium">{f.rating}</span>
                       </div>
                     </div>
                     <p className="text-slate-400 text-sm">{f.comment}</p>
                   </div>
                 )) : (
                   <p className="text-slate-500 text-center py-8">No feedback yet. Be the first!</p>
                 )}
               </div>
             </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === "suggestions" && (
             <div className="space-y-8 animate-in fade-in">
               <form onSubmit={handleSuggestionSubmit} className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10">
                 <h4 className="text-slate-200 font-medium mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400"/> Offer a Suggestion</h4>
                 <textarea value={suggestionDesc} onChange={e=>setSuggestionDesc(e.target.value)} rows={3} placeholder="How could they have pivoted or fixed this?" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3"/>
                 <div className="flex justify-between items-center">
                   <p className="text-emerald-400 text-sm">{successMsg}</p>
                   <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Submit Suggestion"}
                   </button>
                 </div>
               </form>

               <div className="space-y-4">
                 {project.suggestions && project.suggestions.length > 0 ? project.suggestions.map(s => (
                   <div key={s.suggestion_id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/50">
                     <p className="text-slate-300 text-sm mb-2">{s.description}</p>
                     <p className="text-xs text-slate-500">Shared by {s.user_id ? 'a User' : 'Anonymous'}</p>
                   </div>
                 )) : (
                   <p className="text-slate-500 text-center py-8">No suggestions yet. Have a pivot idea?</p>
                 )}
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
