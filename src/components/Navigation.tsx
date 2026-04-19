"use client";

import { Activity, User as UserIcon } from "lucide-react";
import { useAuth } from "./AuthContext";

interface NavigationProps {
  activeTab: "explore" | "rate" | "share";
  onTabChange: (tab: "explore" | "rate" | "share") => void;
  onOpenSignUp?: () => void;
}

export default function Navigation({ activeTab, onTabChange, onOpenSignUp }: NavigationProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer w-[150px]" onClick={() => onTabChange("explore")}>
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-100 hidden sm:block">FailFast DB</span>
          </div>

          {/* Center Tabs */}
          <div className="hidden sm:flex sm:items-center sm:justify-center flex-1">
            <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-xl">
              <button
                onClick={() => onTabChange("explore")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "explore" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                Explore Community
              </button>
              <button
                onClick={() => onTabChange("rate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "rate" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                Rate Your Idea
              </button>
              <button
                onClick={() => onTabChange("share")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "share" ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                Share Your Idea
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex w-[150px] justify-end items-center">
             {user ? (
               <div className="flex items-center gap-3">
                 <div className="text-right hidden md:block">
                   <p className="text-sm font-medium text-slate-200">{user.name}</p>
                   <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300">Sign Out</button>
                 </div>
                 <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                    <UserIcon className="w-5 h-5 text-indigo-400" />
                 </div>
               </div>
             ) : (
               <button 
                 onClick={onOpenSignUp}
                 className="text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700"
               >
                 Sign Up
               </button>
             )}
          </div>

        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden pb-3 flex justify-center mt-2 overflow-x-auto w-full">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-full min-w-max">
            <button
              onClick={() => onTabChange("explore")}
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "explore" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onTabChange("rate")}
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "rate" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Rate
            </button>
            <button
              onClick={() => onTabChange("share")}
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "share" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Share Idea
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
