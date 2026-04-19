"use client";

import { useState } from "react";
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { submitIdea, AVAILABLE_CATEGORIES, AVAILABLE_TAGS } from "@/lib/api";
import MultiSelectTag from "./MultiSelectTag";

export default function RateIdeaForm() {
  const [formData, setFormData] = useState({
    title: "",
    category: AVAILABLE_CATEGORIES[0],
    description: ""
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
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.title.trim()) {
      setErrorMsg("Idea Title is required.");
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setErrorMsg("Please provide a description (min 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitIdea({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        tags
      });

      setSuccessMsg(response.message);
      setFormData({
        title: "",
        category: AVAILABLE_CATEGORIES[0],
        description: "",
      });
      setTags([]);
      
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
          <Zap className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Test Your Hypothesis</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">
          Submit your product idea to run it against our Vault database. We'll tell you if someone already tried this, and whether they crashed or soared.
        </p>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-10 relative overflow-hidden">
        
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Idea Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. NextGen AI Tutor"
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Category <span className="text-red-400">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                >
                  {AVAILABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe what the product does, who it's for, and why it's unique..."
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Expected Tags</label>
              <MultiSelectTag availableTags={AVAILABLE_TAGS} selectedTags={tags} onChange={setTags} />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Database...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Analyze My Idea</span>
                </>
              )}
            </button>
          </div>

          {successMsg && !isSubmitting && (
            <div className="flex flex-col items-center justify-center p-6 mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              <h4 className="text-emerald-400 font-medium text-lg">Analysis Complete</h4>
              <p className="text-emerald-300/80 text-sm mt-1">{successMsg}</p>
              
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left w-full border border-emerald-500/10 border-dashed">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Preliminary Results</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  We found <strong className="text-emerald-300">3</strong> similar failed attempts and <strong className="text-emerald-300">1</strong> monumental success in the database. 
                </p>
              </div>
            </div>
          )}

        </form>
      </div>

    </div>
  );
}
