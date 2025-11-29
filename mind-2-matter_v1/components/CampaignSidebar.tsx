
import React from "react";
import { Campaign } from "../types";
import { exportCampaignToJSON } from "../services/exportUtils";

interface CampaignSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  onLoad: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export const CampaignSidebar: React.FC<CampaignSidebarProps> = ({
  isOpen,
  onClose,
  campaigns,
  onLoad,
  onDelete,
}) => {
  const handleExport = async (e: React.MouseEvent, campaign: Campaign) => {
      e.stopPropagation();
      await exportCampaignToJSON(campaign);
  };

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
          <div>
              <h2 className="text-lg font-bold text-slate-800">Campaign Manager</h2>
              <p className="text-xs text-slate-500 mt-1">{campaigns.length} cached campaigns</p>
          </div>
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
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm">No saved campaigns.</p>
              <p className="text-xs mt-1">Campaigns auto-save as you work.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 pr-6" title={campaign.name}>
                    {campaign.name || "Untitled Campaign"}
                  </h3>
                  
                  <div className="flex gap-1">
                      <button 
                        onClick={(e) => handleExport(e, campaign)}
                        className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                        title="Export JSON"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Delete Campaign"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                   {campaign.data.selectedPlatforms.slice(0,3).map(p => (
                     <span key={p} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">
                       {p}
                     </span>
                   ))}
                   {campaign.data.selectedPlatforms.length > 3 && (
                       <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded font-medium">
                        +{campaign.data.selectedPlatforms.length - 3}
                       </span>
                   )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(campaign.updatedAt || campaign.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onLoad(campaign)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Load Draft →
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
