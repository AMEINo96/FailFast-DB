"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface MultiSelectTagProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function MultiSelectTag({ availableTags, selectedTags, onChange }: MultiSelectTagProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTags = availableTags.filter(
    (tag) => tag.toLowerCase().includes(query.toLowerCase()) && !selectedTags.includes(tag)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    onChange([...selectedTags, tag]);
    setQuery("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim() !== "") {
      e.preventDefault();
      // Allow custom tags if they don't match, or just select first match
      const match = filteredTags.find((t) => t.toLowerCase() === query.toLowerCase());
      if (match) {
        addTag(match);
      } else if (!selectedTags.includes(query.trim().toLowerCase())) {
        // allowing custom tagging to keep it flexible
        addTag(query.trim().toLowerCase());
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="min-h-[48px] w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl flex flex-wrap gap-2 items-center cursor-text focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all outline-none"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md text-sm">
            {tag}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-indigo-400 hover:text-white rounded-full bg-indigo-500/10 hover:bg-red-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? "Search or type tags..." : ""}
          className="flex-1 bg-transparent text-slate-200 outline-none text-sm min-w-[120px]"
        />
      </div>

      {isOpen && (query || filteredTags.length > 0) && (
        <div className="absolute mt-2 w-full max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {filteredTags.length === 0 && query !== "" ? (
             <div 
               className="p-3 text-sm text-slate-300 hover:bg-indigo-600 cursor-pointer flex items-center justify-between"
               onClick={() => addTag(query.trim().toLowerCase())}
             >
               <span>Add custom tag: <strong className="text-white">"{query}"</strong></span>
             </div>
          ) : (
            filteredTags.map((tag) => (
              <div
                key={tag}
                onClick={() => addTag(tag)}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer flex items-center justify-between transition-colors"
              >
                {tag}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
