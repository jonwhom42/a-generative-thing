
import React from "react";
import { PromptTemplate } from "../types";

interface PromptLibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  onLoad: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
}

export const PromptLibrarySidebar: React.FC<PromptLibrarySidebarProps> = ({
  isOpen,
  onClose,
  templates,
  onLoad,
  onDelete,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Prompt Library</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm">Your library is empty.</p>
              <p className="text-xs mt-1">Save prompts to reuse them later.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight pr-6">{template.title}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Delete Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                
                <p className="text-xs text-slate-600 mb-3 line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    "{template.idea}"
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                   <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium border border-indigo-100">
                       {template.tone}
                   </span>
                   <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-medium border border-purple-100">
                       {template.imageStyle}
                   </span>
                   {template.brandVoice.style && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium border border-amber-100">
                          Custom Voice
                      </span>
                   )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onLoad(template)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    Load Template
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
