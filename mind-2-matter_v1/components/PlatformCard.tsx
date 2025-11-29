
import React, { useState, useRef, useEffect } from "react";
import { Platform, GeneratedPost, ImageResolution } from "../types";

interface PlatformCardProps {
  post: GeneratedPost;
  imageStyle?: string;
  imageResolution: ImageResolution;
  onVariantChange: (variant: 'A' | 'B') => void;
  onContentEdit: (content: string) => void;
  onGenerateVideo: () => void;
  onAspectRatioChange: (ratio: "16:9" | "3:4" | "1:1" | "4:3" | "9:16") => void;
  onResolutionChange: (resolution: ImageResolution) => void;
  onRegenerateImage: () => void;
  onImageEdit: (prompt: string, mask?: string | null, refImage?: string | null) => Promise<void>;
  onImageRestore: (imageUrl: string) => void;
  onSchedule: (date: string) => void;
}

export const PlatformIcons: Record<Platform, React.ReactNode> = {
  [Platform.LINKEDIN]: (
    <svg className="w-5 h-5 text-[#0a66c2]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  ),
  [Platform.TWITTER]: (
    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  [Platform.INSTAGRAM]: (
    <svg className="w-5 h-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  [Platform.TIKTOK]: (
    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.82-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.35-1.08 1.08-1.15 1.81-.06 1.28.68 2.46 1.8 2.96.96.43 2.14.3 3.14-.2.58-.28 1.13-.73 1.54-1.23.75-.9 1.14-2.12 1.11-3.33 0-4.72-.02-9.44-.01-14.16z"/>
    </svg>
  ),
  [Platform.FACEBOOK]: (
    <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

export const PlatformCard: React.FC<PlatformCardProps> = ({ 
  post, 
  imageStyle,
  imageResolution,
  onVariantChange, 
  onContentEdit, 
  onGenerateVideo,
  onAspectRatioChange,
  onResolutionChange,
  onRegenerateImage,
  onImageEdit,
  onImageRestore,
  onSchedule
}) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTool, setActiveTool] = useState<'prompt' | 'mask' | 'ref'>('prompt');
  
  // Editor States
  const [refImage, setRefImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);

  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState("");
  
  const currentVariant = post.variants[post.selectedVariantId];
  const isPublished = post.status === 'published';

  useEffect(() => {
    if (post.scheduledDate) {
        // Convert ISO to local YYYY-MM-DDThh:mm for input
        const date = new Date(post.scheduledDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setScheduleDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
        setScheduleDate("");
    }
  }, [post.scheduledDate]);

  const handleRegenerate = async () => {
    setIsGeneratingImage(true);
    try {
      await onRegenerateImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImageSubmit = async () => {
    if ((!editPrompt.trim() && !refImage && !activeTool) || isEditingImage) return;
    setIsEditingImage(true);
    try {
      let maskBase64 = null;
      if (activeTool === 'mask' && canvasRef.current) {
          maskBase64 = canvasRef.current.toDataURL("image/png");
      }
      await onImageEdit(editPrompt, maskBase64, refImage);
      setEditPrompt("");
      setRefImage(null);
      // Clear canvas
      const cvs = canvasRef.current;
      const ctx = cvs?.getContext("2d");
      if (cvs && ctx) ctx.clearRect(0,0, cvs.width, cvs.height);
      // Editor stays open for sequential edits
    } catch (e) {
      console.error("Failed to edit image", e);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setRefImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleScheduleSubmit = () => {
    if (scheduleDate) {
        const date = new Date(scheduleDate);
        onSchedule(date.toISOString());
    }
  };

  // Canvas drawing logic
  useEffect(() => {
    if (activeTool === 'mask' && canvasRef.current && currentVariant.imageUrl) {
        const cvs = canvasRef.current;
        const ctx = cvs.getContext('2d');
        if(!ctx) return;
        
        // Dynamic sizing to match container exactly for precise alignment
        const parent = cvs.parentElement;
        if(parent) {
             cvs.width = parent.clientWidth;
             cvs.height = parent.clientHeight;
        } else {
             cvs.width = 512;
             cvs.height = 512;
        }
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(255, 255, 255, 1)"; // Solid mask
        ctx.lineWidth = brushSize;
    }
  }, [activeTool, currentVariant.imageUrl, post.imageAspectRatio]);

  // Update brush size live
  useEffect(() => {
     if(activeTool === 'mask' && canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if(ctx) ctx.lineWidth = brushSize;
     }
  }, [brushSize, activeTool]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if(activeTool !== 'mask') return;
      setIsDrawing(true);
      const cvs = canvasRef.current;
      if(!cvs) return;
      const ctx = cvs.getContext('2d');
      if(!ctx) return;
      
      const rect = cvs.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (cvs.width / rect.width);
      const y = (e.clientY - rect.top) * (cvs.height / rect.height);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if(!isDrawing || activeTool !== 'mask') return;
      const cvs = canvasRef.current;
      if(!cvs) return;
      const ctx = cvs.getContext('2d');
      if(!ctx) return;

      const rect = cvs.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (cvs.width / rect.width);
      const y = (e.clientY - rect.top) * (cvs.height / rect.height);

      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
  };

  const clearMask = () => {
      const cvs = canvasRef.current;
      const ctx = cvs?.getContext('2d');
      if (cvs && ctx) ctx.clearRect(0,0, cvs.width, cvs.height);
  };

  return (
    <div className={`bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col w-full transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden group/card relative ${isPublished ? 'ring-2 ring-green-500/20' : ''}`}>
      
      {/* --- 1. Header (Always Visible) --- */}
      <div 
         className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10 cursor-pointer hover:bg-slate-50 transition-colors"
         onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
           <div className="p-2 bg-slate-50 rounded-xl ring-1 ring-slate-100">
             {PlatformIcons[post.platform]}
           </div>
           <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">{post.platform}</h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    post.status === 'published' ? 'bg-green-50 text-green-600 border-green-200' : 
                    post.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                    {post.status === 'published' ? 'Published' : post.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                </span>
             </div>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Social Post</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Chevron */}
            <svg 
                className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>

      {/* --- Expandable Content --- */}
      {isExpanded && (
        <div className="flex flex-col lg:flex-row border-t border-slate-100 h-auto lg:h-[750px] transition-all">
            
            {/* --- COLUMN 1: Editor & Options --- */}
            <div className="w-full lg:w-1/2 p-6 md:p-8 space-y-8 bg-white overflow-y-auto border-r border-slate-100 custom-scrollbar">
                
                {/* Variant & Aspect Ratio Row */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 flex p-1 bg-slate-100 rounded-xl">
                        {(['A', 'B'] as const).map((variantId) => (
                            <button
                                key={variantId}
                                onClick={() => onVariantChange(variantId)}
                                className={`flex-1 py-2 text-xs font-bold rounded-[9px] transition-all duration-200 ${
                                    post.selectedVariantId === variantId
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Option {variantId}
                            </button>
                        ))}
                    </div>

                    <div className="relative group/dropdown min-w-[90px]">
                        <select
                            className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl py-2.5 pl-3 pr-8 cursor-pointer focus:outline-none focus:border-indigo-300 transition-all"
                            value={post.imageAspectRatio}
                            onChange={(e) => onAspectRatioChange(e.target.value as any)}
                            disabled={isGeneratingImage || isEditingImage || isPublished || post.isImageRegenerating}
                        >
                            <option value="16:9">16:9</option>
                            <option value="3:4">3:4</option>
                            <option value="1:1">1:1</option>
                            <option value="4:3">4:3</option>
                            <option value="9:16">9:16</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Caption Editing */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Caption</label>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {currentVariant.content ? `${currentVariant.content.length} chars` : '0 chars'}
                        </span>
                    </div>
                    <textarea
                        className="w-full h-32 text-sm leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                        value={currentVariant.content || ""}
                        onChange={(e) => onContentEdit(e.target.value)}
                        placeholder="Generating caption..."
                        readOnly={isPublished}
                    />
                </div>

                {/* Performance Forecast (NEW) */}
                <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Performance Forecast</label>
                    <div className="grid grid-cols-2 gap-3">
                            {/* Likes */}
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm group/stat hover:border-indigo-100 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Likes</span>
                                    <svg className="w-4 h-4 text-indigo-100 group-hover/stat:text-indigo-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-700">{currentVariant.analytics?.likes?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        +12%
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">vs. 30-day avg</div>
                            </div>

                            {/* Comments */}
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm group/stat hover:border-blue-100 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Comments</span>
                                    <svg className="w-4 h-4 text-blue-100 group-hover/stat:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-700">{currentVariant.analytics?.comments?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        +8%
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">vs. 30-day avg</div>
                            </div>

                            {/* Shares */}
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm group/stat hover:border-purple-100 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Shares</span>
                                    <svg className="w-4 h-4 text-purple-100 group-hover/stat:text-purple-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-700">{currentVariant.analytics?.shares?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        +15%
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">vs. 30-day avg</div>
                            </div>

                            {/* Reach */}
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm group/stat hover:border-amber-100 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Reach</span>
                                    <svg className="w-4 h-4 text-amber-100 group-hover/stat:text-amber-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-700">{currentVariant.analytics?.reach?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        +5%
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">vs. 30-day avg</div>
                            </div>
                    </div>
                    {currentVariant.rationale && (
                        <div className="mt-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 flex items-start gap-2">
                            <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-indigo-900/80 leading-relaxed">
                                <span className="font-bold text-indigo-700">AI Insight:</span> {currentVariant.rationale}
                            </p>
                        </div>
                    )}
                </div>

                {/* Visual Assets Tools */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Visual Editor</label>
                         <div className="relative group/dropdown w-[80px]">
                            <select
                                className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg py-1.5 pl-2 pr-6 cursor-pointer focus:outline-none focus:border-indigo-300 transition-all"
                                value={imageResolution}
                                onChange={(e) => onResolutionChange(e.target.value as any)}
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
                                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden transition-all ${showEditor ? 'p-3' : 'p-0 border-0'}`}>
                         
                         {/* Minimized View (Simple) */}
                         {!showEditor && (
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => setShowEditor(true)}
                                    className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                    disabled={!currentVariant.imageUrl}
                                 >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Advanced Edit
                                 </button>
                                 <button
                                    onClick={handleRegenerate}
                                    disabled={isGeneratingImage || !currentVariant.imageUrl}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                 >
                                     <svg className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                     Regenerate
                                 </button>
                             </div>
                         )}

                         {/* Maximized Editor */}
                         {showEditor && (
                             <div className="space-y-3">
                                 {/* Tool Tabs */}
                                 <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                     <button 
                                        onClick={() => setActiveTool('prompt')}
                                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${activeTool === 'prompt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                     >
                                         Text
                                     </button>
                                     <button 
                                        onClick={() => setActiveTool('mask')}
                                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${activeTool === 'mask' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                     >
                                         Annotate / Mask
                                     </button>
                                     <button 
                                        onClick={() => setActiveTool('ref')}
                                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${activeTool === 'ref' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                     >
                                         Reference
                                     </button>
                                 </div>

                                 {/* Tool Content */}
                                 <div className="min-h-[120px]">
                                     {activeTool === 'mask' && (
                                         <div className="space-y-2">
                                            {/* Aspect Ratio aware container */}
                                            <div className={`relative w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-300 group/canvas cursor-crosshair ${
                                                post.imageAspectRatio === '16:9' ? 'aspect-video' :
                                                post.imageAspectRatio === '3:4' ? 'aspect-[3/4]' :
                                                post.imageAspectRatio === '1:1' ? 'aspect-square' :
                                                post.imageAspectRatio === '4:3' ? 'aspect-[4/3]' :
                                                'aspect-[9/16]'
                                            }`}>
                                                {currentVariant.imageUrl && (
                                                    <img src={currentVariant.imageUrl} className="absolute inset-0 w-full h-full object-contain opacity-50 pointer-events-none" alt="Base for mask" />
                                                )}
                                                <canvas 
                                                    ref={canvasRef}
                                                    className="absolute inset-0 w-full h-full z-10 touch-none"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                />
                                            </div>
                                            
                                            {/* Mask Controls */}
                                            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                                                <div className="flex flex-col gap-0.5 min-w-[60px]">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Brush Size</span>
                                                    <span className="text-[10px] font-mono text-indigo-600">{brushSize}px</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="5" 
                                                    max="100" 
                                                    value={brushSize} 
                                                    onChange={(e) => setBrushSize(Number(e.target.value))} 
                                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                                                />
                                                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                                <button 
                                                    onClick={clearMask} 
                                                    className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                         </div>
                                     )}
                                     
                                     {activeTool === 'ref' && (
                                         <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2 h-[200px] relative hover:bg-slate-100 transition-colors">
                                             {refImage ? (
                                                 <div className="relative w-full h-full">
                                                     <img src={refImage} className="w-full h-full object-contain rounded" alt="Reference Upload" />
                                                     <button 
                                                        onClick={() => setRefImage(null)}
                                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transform translate-x-1/3 -translate-y-1/3"
                                                     >
                                                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                     </button>
                                                 </div>
                                             ) : (
                                                 <>
                                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span className="text-xs text-slate-500 font-medium">Upload reference image</span>
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleRefImageUpload} accept="image/*" />
                                                 </>
                                             )}
                                         </div>
                                     )}

                                     <div className="mt-3">
                                         <input
                                            type="text"
                                            className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400"
                                            placeholder={activeTool === 'mask' ? "Describe changes for masked area..." : "Describe edit instructions..."}
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                         />
                                     </div>
                                 </div>

                                 <div className="flex gap-2 pt-1">
                                     <button 
                                        onClick={() => setShowEditor(false)}
                                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                                     >
                                         Cancel
                                     </button>
                                     <button 
                                        onClick={handleEditImageSubmit}
                                        disabled={isEditingImage}
                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                     >
                                         {isEditingImage ? (
                                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                         ) : (
                                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                         )}
                                         Apply Changes
                                     </button>
                                 </div>
                             </div>
                         )}
                    </div>
                    
                    {/* Version History */}
                    {(currentVariant.imageHistory?.length || 0) > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version History</label>
                                <span className="text-[10px] text-slate-400">{currentVariant.imageHistory?.length} versions</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                {currentVariant.imageHistory?.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onImageRestore(url)}
                                        disabled={isGeneratingImage || isEditingImage || post.isImageRegenerating}
                                        className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border transition-all ${
                                            url === currentVariant.imageUrl 
                                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 z-10' 
                                            : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={url} className="w-full h-full object-cover" alt={`Version ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Video Generation / Download Button */}
                    <div className="pt-2 border-t border-slate-100">
                        {currentVariant.videoUrl ? (
                            <div className="flex gap-2">
                                <a 
                                    href={currentVariant.videoUrl}
                                    download={`mind2matter-video-${post.platform}-${post.selectedVariantId}.mp4`}
                                    className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Video
                                </a>
                                <button 
                                    onClick={onGenerateVideo}
                                    disabled={currentVariant.isVideoLoading}
                                    className="px-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                                    title="Regenerate Video"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={onGenerateVideo}
                                disabled={!currentVariant.imageUrl || isPublished || currentVariant.isVideoLoading}
                                className={`w-full py-3 border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-100 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {currentVariant.isVideoLoading ? (
                                    <>
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
                                        Creating Video...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Generate Video
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Scheduling Section */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Schedule Post</label>
                            {post.status === 'scheduled' && (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                    {new Date(post.scheduledDate!).toLocaleString()}
                                </span>
                            )}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="datetime-local" 
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                             />
                             <button
                                onClick={handleScheduleSubmit}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                    post.status === 'scheduled' 
                                    ? 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50' 
                                    : 'bg-slate-800 text-white hover:bg-slate-900'
                                }`}
                             >
                                {post.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* --- COLUMN 2: Mobile Preview --- */}
            <div className="w-full lg:w-1/2 bg-[#0F172A] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[600px] lg:min-h-0">
                 {/* Glow effect */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>

                 <div className="relative z-10 flex flex-col items-center">
                    <div className="w-[320px] bg-white rounded-[3rem] overflow-hidden relative shadow-2xl border-[8px] border-slate-800 flex flex-col h-[640px]">
                        
                        {/* Status Bar */}
                        <div className="h-10 bg-white flex items-center justify-between px-6 pt-2 select-none z-20">
                            <span className="text-[12px] font-bold text-slate-800">9:41</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 bg-slate-800 rounded-full opacity-20"></div>
                                <div className="w-4 h-4 bg-slate-800 rounded-full opacity-20"></div>
                            </div>
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide bg-white pb-4 relative">
                            {/* Platform Specific Header */}
                            <div className="px-4 py-3 flex items-center gap-3 bg-white sticky top-0 z-10">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">M</div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 leading-none">Mind 2 Matter</span>
                                    <span className="text-[10px] text-slate-500">The AI Creative Agency</span>
                                </div>
                                <div className="ml-auto text-slate-400">•••</div>
                            </div>

                            {/* Content based on Platform Layout */}
                            {(() => {
                                const renderMedia = () => (
                                    <div className={`relative w-full bg-slate-100 overflow-hidden ${
                                        post.imageAspectRatio === '16:9' ? 'aspect-video' :
                                        post.imageAspectRatio === '3:4' ? 'aspect-[3/4]' :
                                        post.imageAspectRatio === '1:1' ? 'aspect-square' :
                                        post.imageAspectRatio === '4:3' ? 'aspect-[4/3]' :
                                        'aspect-[9/16]'
                                    }`}>
                                        {post.isLoading || isGeneratingImage || isEditingImage || post.isImageRegenerating ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                                                <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                                            </div>
                                        ) : currentVariant.videoUrl ? (
                                             <video src={currentVariant.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                        ) : currentVariant.imageUrl ? (
                                            <>
                                                <img src={currentVariant.imageUrl} className="w-full h-full object-cover" alt="Post content" />
                                                {/* Style Badge Overlay */}
                                                {imageStyle && (
                                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded">
                                                        {imageStyle} • {imageResolution}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                                <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                );

                                const renderCaption = () => (
                                    <div className="px-4 py-3">
                                        {post.platform === Platform.TWITTER ? (
                                           <div className="text-sm text-slate-800 whitespace-pre-wrap">{currentVariant.content}</div>
                                        ) : (
                                           <div className="text-xs text-slate-800">
                                              <span className="font-bold mr-1">Mind 2 Matter</span>
                                              <span className="whitespace-pre-wrap">{currentVariant.content}</span>
                                           </div>
                                        )}
                                        <div className="mt-2 flex gap-1 flex-wrap">
                                            <span className="text-xs text-indigo-600 font-medium">#Pro</span>
                                            <span className="text-xs text-indigo-600 font-medium">#Social</span>
                                        </div>
                                    </div>
                                );

                                // Layout logic
                                if (post.platform === Platform.TWITTER || post.platform === Platform.FACEBOOK || post.platform === Platform.LINKEDIN) {
                                    return (
                                        <>
                                            {renderCaption()}
                                            {renderMedia()}
                                        </>
                                    );
                                } 
                                // Instagram & Others
                                return (
                                    <>
                                        {renderMedia()}
                                        {/* Actions Row */}
                                        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-slate-700">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                            </div>
                                            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                        </div>
                                        {renderCaption()}
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* Footer (Actions/Nav Mock) */}
                        <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-around text-slate-400">
                             <svg className="w-6 h-6 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                             <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                        </div>
                    </div>

                    <div className="mt-6 px-5 py-2 rounded-full bg-white/10 backdrop-blur text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase border border-white/5">
                        Live Preview
                    </div>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};