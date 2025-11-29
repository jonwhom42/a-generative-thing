
import React from "react";
import { Campaign, Platform } from "../types";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  onLoad: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  campaigns,
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
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Campaign History</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <p className="text-sm">No saved campaigns yet.</p>
              <p className="text-xs mt-1">Generate content and save it to see it here.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{campaign.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Delete Campaign"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                   {campaign.data.selectedPlatforms.map(p => (
                     <span key={p} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                       {p}
                     </span>
                   ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onLoad(campaign)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Load Campaign →
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
