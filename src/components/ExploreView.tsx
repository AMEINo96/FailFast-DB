"use client";

import { useState, useEffect } from "react";
import { Search, FolderOpen, Star, FilterX } from "lucide-react";
import { fetchProjects, Project, AVAILABLE_CATEGORIES } from "@/lib/api";
import ProjectDetailModal from "./ProjectDetailModal";

interface ExploreViewProps {
  onRequireAuth: () => void;
}

export default function ExploreView({ onRequireAuth }: ExploreViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects(search, category);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce the search
    const timer = setTimeout(() => {
      loadProjects();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      
      {/* Header and Controls */}
      <div className="mb-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">The Idea Vault</h1>
          <p className="text-slate-400 mt-2">Explore the spectrum of startup ideas—from monumental successes to glorious failures.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full md:w-[180px] px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {AVAILABLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {(search || category !== "All") && (
              <button 
                onClick={() => { setSearch(""); setCategory("All"); }}
                className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
                title="Clear Filters"
              >
                <FilterX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((sk) => (
            <div key={sk} className="bg-slate-800/20 border border-slate-800 rounded-2xl h-[220px] animate-pulse"></div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">{project.title}</h3>
                <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 border border-slate-700">
                  <FolderOpen className="w-3 h-3" />
                  {project.category}
                </span>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed flex-grow line-clamp-3">
                {project.description}
              </p>
              
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300">
                      #{tag}
                    </span>
                  ))}
                  {project.tags.length > 2 && (
                    <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400">
                      +{project.tags.length - 2}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium text-amber-500">{project.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
          <div className="inline-block p-4 rounded-full bg-slate-800/50 mb-4">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300">No ghosts found</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">We couldn't find any failed projects matching your search criteria. Try adjusting your filters.</p>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
          onRequireAuth={onRequireAuth}
        />
      )}
    </div>
  );
}
