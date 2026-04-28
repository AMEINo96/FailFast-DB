"use client";

import { useState } from "react";
import { Loader2, Zap, AlertCircle, TrendingUp, AlertTriangle, ShieldCheck, Star, ChevronRight, BarChart3, Lightbulb, Search } from "lucide-react";
import { analyzeIdea, AnalysisResult, SimilarProject, AVAILABLE_CATEGORIES, AVAILABLE_TAGS } from "@/lib/api";
import MultiSelectTag from "./MultiSelectTag";

interface RateIdeaFormProps {
  onProjectClick?: (projectId: string) => void;
}

export default function RateIdeaForm({ onProjectClick }: RateIdeaFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    category: AVAILABLE_CATEGORIES[0],
    description: ""
  });
  const [tags, setTags] = useState<string[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSimilar, setShowSimilar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);
    setShowSimilar(false);

    if (!formData.title.trim()) {
      setErrorMsg("Idea Title is required.");
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setErrorMsg("Please provide a description (min 10 characters).");
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisResult = await analyzeIdea({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        tags
      });
      setResult(analysisResult);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 65) return { ring: "stroke-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    if (score >= 40) return { ring: "stroke-amber-500", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    return { ring: "stroke-red-500", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low': return { icon: ShieldCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
      case 'Medium': return { icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
      case 'High': return { icon: AlertCircle, color: "text-red-400 bg-red-500/10 border-red-500/30" };
      default: return { icon: ShieldCheck, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Failed': return "bg-red-500/10 text-red-400 border border-red-500/20";
      case 'Active': return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case 'Successful': case 'Success': case 'Completed': return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
          <Zap className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Analyze Your Idea</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">
          Submit your idea and we'll search our community database for similar projects, predict its success potential, and show you what others have tried.
        </p>
      </div>

      {/* Form */}
      <div className="bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-10 relative overflow-hidden">
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
              <label className="text-sm font-medium text-slate-300">Tags</label>
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
              disabled={isAnalyzing}
              className="w-full relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching Database...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Analyze My Idea</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ============ ANALYSIS RESULTS ============ */}
      {result && (
        <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">

          {/* Prediction + Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Circular Prediction Gauge */}
            <div className={`md:col-span-1 flex flex-col items-center justify-center p-6 rounded-2xl border ${getScoreColor(result.analysis.prediction_score).border} ${getScoreColor(result.analysis.prediction_score).bg} backdrop-blur-sm`}>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Success Probability</p>
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                    strokeLinecap="round"
                    className={`${getScoreColor(result.analysis.prediction_score).ring} transition-all duration-1000`}
                    strokeDasharray={`${(result.analysis.prediction_score / 100) * 327} 327`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(result.analysis.prediction_score).text}`}>
                    {result.analysis.prediction_score}%
                  </span>
                </div>
              </div>
              {/* Risk Badge */}
              {(() => {
                const badge = getRiskBadge(result.analysis.risk_level);
                const Icon = badge.icon;
                return (
                  <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {result.analysis.risk_level} Risk
                  </div>
                );
              })()}
            </div>

            {/* Stats Cards */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                <BarChart3 className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-100">{result.analysis.total_similar}</p>
                <p className="text-xs text-slate-500">Similar Projects</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{result.analysis.success_count}</p>
                <p className="text-xs text-slate-500">Succeeded</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">{result.analysis.failed_count}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400">{result.analysis.avg_community_rating || '—'}</p>
                <p className="text-xs text-slate-500">Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">AI Insights</h3>
            </div>
            <ul className="space-y-2.5">
              {result.analysis.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Similar Projects */}
          {result.similar_projects.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
              <button
                onClick={() => setShowSimilar(!showSimilar)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Similar Projects ({result.similar_projects.length})
                  </h3>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${showSimilar ? 'rotate-90' : ''}`} />
              </button>

              {showSimilar && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                  {result.similar_projects.map((project: SimilarProject) => (
                    <button
                      key={project.project_id}
                      onClick={() => onProjectClick?.(project.project_id.toString())}
                      className="text-left bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {project.title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">{project.category}</span>
                        {project.avg_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-amber-400">{project.avg_rating}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
