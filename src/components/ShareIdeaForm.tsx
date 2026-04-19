"use client";

import { useState } from "react";
import { Loader2, Share2, AlertCircle, CheckCircle2 } from "lucide-react";
import { shareProject, AVAILABLE_CATEGORIES, FAILURE_TYPES, AVAILABLE_TAGS } from "@/lib/api";
import { useAuth } from "./AuthContext";
import MultiSelectTag from "./MultiSelectTag";

interface ShareIdeaFormProps {
  onRequireAuth: () => void;
}

export default function ShareIdeaForm({ onRequireAuth }: ShareIdeaFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    category: AVAILABLE_CATEGORIES[0],
    description: "",
    status: "Failed",
    reason_type: FAILURE_TYPES[0],
    reason_description: ""
  });
  const [tags, setTags] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.reason_description.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await shareProject({
        ...formData,
        tags
      }, user.user_id);

      setSuccessMsg(response.message);
      setFormData({
        title: "",
        category: AVAILABLE_CATEGORIES[0],
        description: "",
        status: "Failed",
        reason_type: FAILURE_TYPES[0],
        reason_description: ""
      });
      setTags([]);
      
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4">
          <Share2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Add to The Vault</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">
          Share a project outcome. Be it a monumental success, a swift pivot, or a glorious failure. Clean data helps the community learn.
        </p>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Project Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700/50 pb-2">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Title <span className="text-red-400">*</span></label>
                <input
                  type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                  placeholder="App Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Category <span className="text-red-400">*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none">
                  {AVAILABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
              <textarea
                name="description" value={formData.description} onChange={handleChange} rows={3}
                placeholder="What was the project meant to do?"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none">
                  <option value="Active">Active</option>
                  <option value="Failed">Failed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tags</label>
                <MultiSelectTag availableTags={AVAILABLE_TAGS} selectedTags={tags} onChange={setTags} />
              </div>
            </div>
          </div>

          {/* Section 2: Post-Mortem */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700/50 pb-2">Outcome Details</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Primary Failure/Success Type <span className="text-red-400">*</span></label>
                <select name="reason_type" value={formData.reason_type} onChange={handleChange} className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none">
                  {FAILURE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Detailed Explanation <span className="text-red-400">*</span></label>
                <textarea
                  name="reason_description" value={formData.reason_description} onChange={handleChange} rows={4}
                  placeholder="Explain exactly why it succeeded or failed. What were the core reasons?"
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
            </div>
          )}

          <div className="pt-2 border-t border-slate-700/50 flex justify-end">
            <button
              type="submit" disabled={isSubmitting}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> saving...</> : "Submit Project"}
            </button>
          </div>

          {successMsg && !isSubmitting && (
            <div className="flex items-center justify-center gap-2 p-4 mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 shrink-0" />{successMsg}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
