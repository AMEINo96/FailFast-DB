"use client";

import { useState, useEffect } from "react";
import { Project, fetchProjectById, postComment } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { X, Star, MessageSquare, AlertCircle, Loader2, Send, User as UserIcon } from "lucide-react";

interface ProjectDetailModalProps {
  project?: Project;
  projectId?: string;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export default function ProjectDetailModal({ project: placeholderProject, projectId, onClose, onRequireAuth }: ProjectDetailModalProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(placeholderProject || null);
  const [loading, setLoading] = useState(true);
  
  // Comment form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resolvedId = projectId || placeholderProject?.id;

  const loadLatestDetails = async () => {
    if (!resolvedId) return;
    setLoading(true);
    const detailedProject = await fetchProjectById(resolvedId);
    if (detailedProject) {
      setProject(detailedProject);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLatestDetails();
  }, [resolvedId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onRequireAuth?.(); return; }
    if (!commentText.trim()) { setErrorMsg("Please write a comment."); return; }
    if (rating === 0) { setErrorMsg("Please select a star rating."); return; }
    if (!project) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const success = await postComment(project.id, user.user_id, rating, commentText);
      if (success) {
        setCommentText("");
        setRating(0);
        await loadLatestDetails();
      } else {
        setErrorMsg("Failed to post comment. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between bg-slate-900 z-10 shrink-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-100">{project.title}</h2>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                project.status === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                project.status === 'Under Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {project.status || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 text-xs">{project.category}</span>
              {project.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {project.rating.toFixed(1)} avg
                </span>
              )}
              <span>{project.comments?.length || 0} comments</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-slate-200 leading-relaxed">{project.description}</p>
          </div>

          {/* Failure Reasons / Post-Mortem */}
          {project.failure_reasons && project.failure_reasons.length > 0 && (
            <div className={`border rounded-2xl p-5 ${
              project.status === 'Failed' ? 'bg-red-500/5 border-red-500/10' : 
              project.status === 'Active' ? 'bg-emerald-500/5 border-emerald-500/10' :
              'bg-slate-500/5 border-slate-500/10'
            }`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                project.status === 'Failed' ? 'text-red-400' : 
                project.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                <AlertCircle className="w-4 h-4" /> Outcome Post-Mortem
              </h3>
              <div className="space-y-3">
                {project.failure_reasons.map((reason, idx) => (
                  <div key={idx} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mb-2 ${
                      project.status === 'Failed' ? 'bg-red-500/10 text-red-400' : 
                      project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
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

          {/* Tags */}
          {project.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-800" />

          {/* Comments & Ratings Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 
              Comments & Ratings ({project.comments?.length || 0})
            </h3>

            {/* Post a Comment Form */}
            <form onSubmit={handleCommentSubmit} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 mb-6">
              <div className="mb-3">
                <label className="text-sm text-slate-300 mb-2 block">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || rating) 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-slate-600'
                      }`} />
                    </button>
                  ))}
                  {rating > 0 && <span className="text-sm text-slate-400 ml-2 self-center">{rating}/5</span>}
                </div>
              </div>
              
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
                placeholder="Share your thoughts on this idea..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 mb-3 resize-none transition-all"
              />
              
              {errorMsg && (
                <p className="text-red-400 text-sm mb-2">{errorMsg}</p>
              )}

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Post Comment</>
                  )}
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {project.comments && project.comments.length > 0 ? (
                project.comments.map((c: any, index: number) => (
                  <div key={c.feedback_id || c.id || index} className="border border-slate-800 rounded-xl p-4 bg-slate-900/50 hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <UserIcon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-200">{c.user_name || 'Anonymous'}</span>
                          <span className="text-xs text-slate-500 ml-2">{formatDate(c.formatted_date || c.created_at || '')}</span>
                        </div>
                      </div>
                      {c.rating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${
                              star <= c.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-600'
                            }`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed pl-10">{c.comment || c.description || c.text || ''}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
