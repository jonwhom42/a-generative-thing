
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Platform, Tone, GeneratedPost, BrandVoice, ImageStyle, AnalyticsMetrics, Campaign, ImageResolution, PromptTemplate } from "./types";
import { generatePostContent, generateImage, generateVideo, editImage } from "./services/gemini";
import { PlatformCard, PlatformIcons } from "./components/PlatformCard";
import { ChatWidget } from "./components/ChatWidget";
import { CampaignSidebar } from "./components/CampaignSidebar";
import { PromptLibrarySidebar } from "./components/PromptLibrarySidebar";
import { saveCampaignToIndexedDB, getAllCampaigns, deleteCampaignFromDB, blobUrlToBase64 } from "./services/db";
import { exportCampaignToCSV, exportCampaignToJSON } from "./services/exportUtils";
import { Toast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

const App: React.FC = () => {
  // --- State Definitions ---
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({ style: "", keywords: "", terminology: "" });
  const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.PHOTOREALISTIC);
  const [imageResolution, setImageResolution] = useState<ImageResolution>("1K");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(Object.values(Platform));
  
  // UI Toggles
  const [showBrandVoice, setShowBrandVoice] = useState(false);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [showTone, setShowTone] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  
  // System States
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promptLibrary, setPromptLibrary] = useState<PromptTemplate[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(Date.now().toString());
  
  // Sidebar Toggles
  const [isCampaignManagerOpen, setIsCampaignManagerOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const initialAnalytics: AnalyticsMetrics = { likes: 0, shares: 0, comments: 0, reach: 0 };

  const initialPosts: GeneratedPost[] = [
    {
      platform: Platform.LINKEDIN,
      variants: {
        A: { id: 'A', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
        B: { id: 'B', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
      },
      selectedVariantId: 'A',
      scheduledDate: null,
      imageAspectRatio: "16:9",
      isLoading: false,
      isImageRegenerating: false,
      error: null,
      status: 'draft',
      publishedDate: null
    },
    {
      platform: Platform.TWITTER,
      variants: {
        A: { id: 'A', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
        B: { id: 'B', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
      },
      selectedVariantId: 'A',
      scheduledDate: null,
      imageAspectRatio: "16:9",
      isLoading: false,
      isImageRegenerating: false,
      error: null,
      status: 'draft',
      publishedDate: null
    },
    {
      platform: Platform.INSTAGRAM,
      variants: {
        A: { id: 'A', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
        B: { id: 'B', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
      },
      selectedVariantId: 'A',
      scheduledDate: null,
      imageAspectRatio: "3:4",
      isLoading: false,
      isImageRegenerating: false,
      error: null,
      status: 'draft',
      publishedDate: null
    },
    {
      platform: Platform.TIKTOK,
      variants: {
        A: { id: 'A', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
        B: { id: 'B', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
      },
      selectedVariantId: 'A',
      scheduledDate: null,
      imageAspectRatio: "9:16",
      isLoading: false,
      isImageRegenerating: false,
      error: null,
      status: 'draft',
      publishedDate: null
    },
    {
      platform: Platform.FACEBOOK,
      variants: {
        A: { id: 'A', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
        B: { id: 'B', content: null, imagePrompt: "", imageUrl: null, videoUrl: null, isVideoLoading: false, analytics: initialAnalytics, imageHistory: [] },
      },
      selectedVariantId: 'A',
      scheduledDate: null,
      imageAspectRatio: "4:3",
      isLoading: false,
      isImageRegenerating: false,
      error: null,
      status: 'draft',
      publishedDate: null
    },
  ];

  const [posts, setPosts] = useState<GeneratedPost[]>(initialPosts);

  // --- Undo/Redo History ---
  const [historyStack, setHistoryStack] = useState<GeneratedPost[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const saveHistorySnapshot = useCallback(() => {
    if (isUndoRedoAction.current) return;
    
    setHistoryStack(prev => {
      const newStack = prev.slice(0, historyPointer + 1);
      // Only push if different from last
      const last = newStack[newStack.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(posts)) return prev;
      
      newStack.push(JSON.parse(JSON.stringify(posts)));
      if (newStack.length > 20) newStack.shift(); // Limit history
      return newStack;
    });
    setHistoryPointer(prev => Math.min(prev + 1, 19));
  }, [posts, historyPointer]);

  // Capture initial state for history
  useEffect(() => {
     if(historyStack.length === 0) {
         setHistoryStack([JSON.parse(JSON.stringify(initialPosts))]);
         setHistoryPointer(0);
     }
  }, []);


  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
  };

  // --- Load Data on Mount ---
  useEffect(() => {
    const initData = async () => {
        // 1. Load Campaigns from DB
        const dbCampaigns = await getAllCampaigns();
        setCampaigns(dbCampaigns);

        // 2. Load most recent campaign if available
        if (dbCampaigns.length > 0) {
            loadCampaign(dbCampaigns[0]);
        }

        // 3. Load library from local storage (fallback)
        const savedLibrary = localStorage.getItem('mind2matter_library');
        if (savedLibrary) {
            try {
                setPromptLibrary(JSON.parse(savedLibrary));
            } catch (e) { console.error("Library parse error", e); }
        }
    };
    initData();
  }, []);

  // --- Auto-Save Logic ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveCurrentCampaign = useCallback(async (silent = true) => {
     if (!idea.trim()) return;

     const campaignData: Campaign = {
         id: activeCampaignId,
         name: idea.substring(0, 40) + (idea.length > 40 ? "..." : ""),
         createdAt: new Date().toISOString(), 
         updatedAt: new Date().toISOString(),
         data: {
             idea,
             tone,
             imageStyle,
             brandVoice,
             posts: await Promise.all(posts.map(async p => {
                const pClone = JSON.parse(JSON.stringify(p));
                for(const vKey of ['A', 'B']) {
                    // @ts-ignore
                    if(pClone.variants[vKey].videoUrl?.startsWith('blob:')) {
                        // @ts-ignore
                        pClone.variants[vKey].videoUrl = await blobUrlToBase64(pClone.variants[vKey].videoUrl);
                    }
                }
                return pClone;
             })),
             selectedPlatforms,
             imageResolution
         }
     };

     try {
         await saveCampaignToIndexedDB(campaignData);
         setCampaigns(prev => {
             const exists = prev.find(c => c.id === activeCampaignId);
             if (exists) {
                 return prev.map(c => c.id === activeCampaignId ? campaignData : c).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
             }
             return [campaignData, ...prev];
         });
         if (!silent) showToast("Campaign Saved Locally", "success");
     } catch (e) {
         console.error("Auto-save failed", e);
         if (!silent) showToast("Save Failed", "error");
     }
  }, [idea, tone, imageStyle, brandVoice, posts, selectedPlatforms, imageResolution, activeCampaignId]);

  // Trigger Auto-Save on Change
  useEffect(() => {
      // Don't auto-save if generating, to prevent saving intermediate/loading states
      if (!idea.trim() || isGenerating) return;
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
          saveCurrentCampaign(true);
      }, 2000); 

      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
  }, [idea, tone, imageStyle, brandVoice, posts, selectedPlatforms, imageResolution, saveCurrentCampaign, isGenerating]);


  // --- Undo / Redo Logic ---
  const handleUndo = () => {
      if (historyPointer > 0) {
          isUndoRedoAction.current = true;
          const prevPosts = historyStack[historyPointer - 1];
          setPosts(prevPosts);
          setHistoryPointer(historyPointer - 1);
          showToast("Undo", "info");
          setTimeout(() => isUndoRedoAction.current = false, 100);
      }
  };

  const handleRedo = () => {
      if (historyPointer < historyStack.length - 1) {
          isUndoRedoAction.current = true;
          const nextPosts = historyStack[historyPointer + 1];
          setPosts(nextPosts);
          setHistoryPointer(historyPointer + 1);
          showToast("Redo", "info");
          setTimeout(() => isUndoRedoAction.current = false, 100);
      }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              saveCurrentCampaign(false);
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
              e.preventDefault();
              if (e.shiftKey) {
                  handleExportCSV();
              } else {
                  handleDownloadCampaign();
              }
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentCampaign, historyPointer, historyStack]);


  const loadCampaign = (campaign: Campaign) => {
    setActiveCampaignId(campaign.id);
    setIdea(campaign.data.idea);
    setTone(campaign.data.tone);
    setImageStyle(campaign.data.imageStyle);
    setBrandVoice(campaign.data.brandVoice);
    setImageResolution(campaign.data.imageResolution || "1K");
    
    const sanitizedPosts = campaign.data.posts.map(p => ({
        ...p,
        variants: {
            A: { ...p.variants.A, imageHistory: p.variants.A.imageHistory || (p.variants.A.imageUrl ? [p.variants.A.imageUrl] : []) },
            B: { ...p.variants.B, imageHistory: p.variants.B.imageHistory || (p.variants.B.imageUrl ? [p.variants.B.imageUrl] : []) },
        }
    }));
    
    setPosts(sanitizedPosts);
    // Reset History on Load
    setHistoryStack([JSON.parse(JSON.stringify(sanitizedPosts))]);
    setHistoryPointer(0);
    
    setSelectedPlatforms(campaign.data.selectedPlatforms);
    setIsCampaignManagerOpen(false);
    showToast("Campaign Loaded", "info");
  };

  const handleDeleteCampaign = async (id: string) => {
      if (!window.confirm("Delete this campaign?")) return;
      await deleteCampaignFromDB(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (activeCampaignId === id) {
          setIdea("");
          setPosts(initialPosts);
          setActiveCampaignId(Date.now().toString());
      }
      showToast("Campaign Deleted", "info");
  };

  // --- Handlers ---
  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!idea.trim() || selectedPlatforms.length === 0) return;
    
    saveHistorySnapshot(); // Snapshot BEFORE generation starts (captures user inputs)

    const isHighRes = imageResolution === '2K' || imageResolution === '4K';
    if (isHighRes && (window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
       try { await (window as any).aistudio.openSelectKey(); } 
       catch (e) { return; }
    }

    setIsGenerating(true);
    
    // 1. Initialize loading state
    setPosts((prev) => prev.map((p) => selectedPlatforms.includes(p.platform) ? {
        ...p,
        variants: {
            A: { ...p.variants.A, content: null, imageUrl: null, analytics: { likes: 0, shares: 0, comments: 0, reach: 0 } },
            B: { ...p.variants.B, content: null, imageUrl: null, analytics: { likes: 0, shares: 0, comments: 0, reach: 0 } }
        },
        isLoading: true, 
        error: null 
    } : p));

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (!selectedPlatforms.includes(post.platform)) continue;

      try {
        const generatedData = await generatePostContent(post.platform, idea, tone, brandVoice, imageStyle);
        
        // 2. Immutable Update: Text & Analytics
        setPosts((current) => current.map((p, idx) => {
            if (idx !== i) return p;
            return {
                ...p,
                variants: {
                    A: { 
                        ...p.variants.A, 
                        content: generatedData.A.text,
                        imagePrompt: generatedData.A.imagePrompt,
                        analytics: generatedData.A.analytics,
                        rationale: generatedData.A.rationale
                    },
                    B: { 
                        ...p.variants.B, 
                        content: generatedData.B.text,
                        imagePrompt: generatedData.B.imagePrompt,
                        analytics: generatedData.B.analytics,
                        rationale: generatedData.B.rationale
                    }
                }
            };
        }));

        const genImg = async (prompt: string, variant: 'A'|'B') => {
             try {
                const url = await generateImage(prompt, post.imageAspectRatio, imageResolution);
                
                // 3. Immutable Update: Image
                setPosts(curr => curr.map((p, idx) => {
                    if (idx !== i) return p;
                    return {
                        ...p,
                        variants: {
                            ...p.variants,
                            [variant]: {
                                ...p.variants[variant],
                                imageUrl: url,
                                imageHistory: [url, ...p.variants[variant].imageHistory]
                            }
                        }
                    };
                }));
             } catch(e) { 
                 console.warn(`Img gen failed for ${post.platform} ${variant}`, e); 
             }
        }

        // Parallel image generation
        await Promise.all([
            genImg(generatedData.A.imagePrompt, 'A'),
            genImg(generatedData.B.imagePrompt, 'B')
        ]);

        // 4. Immutable Update: Mark Done
        setPosts((curr) => curr.map((p, idx) => {
            if (idx !== i) return p;
            return { ...p, isLoading: false };
        }));

      } catch (error) {
        setPosts((curr) => curr.map((p, idx) => {
            if (idx !== i) return p;
            return { ...p, isLoading: false, error: "Generation Failed" };
        }));
      }
    }
    
    setIsGenerating(false);
  };

  const handleDownloadCampaign = async () => {
      try {
        const currentCampaign: Campaign = {
            id: activeCampaignId,
            name: idea || "Untitled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: { idea, tone, imageStyle, brandVoice, posts, selectedPlatforms, imageResolution }
        };
        await exportCampaignToJSON(currentCampaign);
        showToast("Exported JSON to Downloads", "success");
      } catch (e) {
          showToast("Export Failed", "error");
      }
  };

  const handleExportCSV = () => {
      try {
        const currentCampaign: Campaign = {
            id: activeCampaignId,
            name: idea || "Untitled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: { idea, tone, imageStyle, brandVoice, posts, selectedPlatforms, imageResolution }
        };
        exportCampaignToCSV(currentCampaign);
        showToast("Exported CSV to Downloads", "success");
      } catch (e) {
          showToast("CSV Export Failed", "error");
      }
  };

  const handleCopyAll = () => {
    const allContent = posts
      .filter(p => selectedPlatforms.includes(p.platform))
      .map(p => {
        const variant = p.variants[p.selectedVariantId];
        if (!variant.content) return null;
        return `[${p.platform}]\n${variant.content}\n`;
      })
      .filter(Boolean)
      .join('\n-------------------\n\n');

    if (allContent) {
      navigator.clipboard.writeText(allContent);
      showToast("All Captions Copied!", "success");
    }
  };

  // State updates for platform card interactions
  const updatePost = (index: number, updater: (p: GeneratedPost) => GeneratedPost) => {
      setPosts(prev => {
          const newPosts = [...prev];
          newPosts[index] = updater(newPosts[index]);
          return newPosts;
      });
  };

  const handleVariantChange = (idx: number, v: 'A'|'B') => updatePost(idx, p => ({ ...p, selectedVariantId: v }));
  
  const handleContentEdit = (idx: number, c: string) => {
      saveHistorySnapshot(); // Save before edit
      updatePost(idx, p => ({ ...p, variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], content: c } } }));
  };
  
  const handleSchedule = (idx: number, d: string) => {
      saveHistorySnapshot();
      updatePost(idx, p => ({ ...p, scheduledDate: d, status: 'scheduled' }));
  };

  const handleResolutionChange = (idx: number, res: ImageResolution) => setImageResolution(res); 
  
  const handleAspectRatioChange = async (idx: number, ratio: any) => {
      updatePost(idx, p => ({ ...p, imageAspectRatio: ratio, isImageRegenerating: true }));
      const post = posts[idx];
      const variant = post.variants[post.selectedVariantId];
      if (!variant.imagePrompt) return;
      
      try {
          const url = await generateImage(`${variant.imagePrompt}. Style: ${imageStyle}`, ratio, imageResolution);
          updatePost(idx, p => ({
              ...p,
              isImageRegenerating: false,
              variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], imageUrl: url, imageHistory: [url, ...p.variants[p.selectedVariantId].imageHistory] } }
          }));
      } catch (e) {
          updatePost(idx, p => ({ ...p, isImageRegenerating: false }));
          showToast("Resizing Failed", "error");
      }
  };

  const handleRegenerateImage = async (idx: number) => {
      const post = posts[idx];
      const variant = post.variants[post.selectedVariantId];
      if(!variant.imagePrompt) return;
      
      try {
          const url = await generateImage(`${variant.imagePrompt}. Style: ${imageStyle}`, post.imageAspectRatio, imageResolution);
          saveHistorySnapshot();
          updatePost(idx, p => ({
              ...p,
              variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], imageUrl: url, imageHistory: [url, ...p.variants[p.selectedVariantId].imageHistory] } }
          }));
      } catch (e) { showToast("Image Gen Failed", "error"); }
  };

  const handleEditImage = async (idx: number, prompt: string, mask?: string | null, ref?: string | null) => {
      const post = posts[idx];
      const variant = post.variants[post.selectedVariantId];
      if(!variant.imageUrl) return;

      try {
          const url = await editImage(variant.imageUrl, prompt, mask, ref, imageResolution, post.imageAspectRatio);
          saveHistorySnapshot();
          updatePost(idx, p => ({
              ...p,
              variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], imageUrl: url, imageHistory: [url, ...p.variants[p.selectedVariantId].imageHistory] } }
          }));
      } catch (e) { showToast("Edit Failed", "error"); }
  };

  const handleGenerateVideo = async (idx: number) => {
      updatePost(idx, p => ({ ...p, variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], isVideoLoading: true } } }));
      const post = posts[idx];
      const variant = post.variants[post.selectedVariantId];
      
      if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
         try { await (window as any).aistudio.openSelectKey(); } 
         catch (e) { 
             updatePost(idx, p => ({ ...p, variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], isVideoLoading: false } } }));
             return; 
         }
      }

      try {
          // Pass style and resolution to generateVideo
          const url = await generateVideo(
              variant.imagePrompt || idea, 
              variant.imageUrl, 
              post.imageAspectRatio,
              imageStyle, 
              imageResolution
          );
          
          saveHistorySnapshot();
          updatePost(idx, p => ({ 
              ...p, 
              variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], videoUrl: url, isVideoLoading: false } } 
          }));
      } catch (e) {
          console.error(e);
          updatePost(idx, p => ({ ...p, variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], isVideoLoading: false } } }));
          showToast("Video Gen Failed", "error");
      }
  };

  const handleImageRestore = (idx: number, url: string) => {
      saveHistorySnapshot();
      updatePost(idx, p => ({ ...p, variants: { ...p.variants, [p.selectedVariantId]: { ...p.variants[p.selectedVariantId], imageUrl: url } } }));
  };

  // Prompt Library Handlers
  const handleSaveToLibrary = () => {
      if(!idea.trim()) return;
      const title = window.prompt("Template Name:", idea.substring(0,30));
      if(!title) return;
      
      const tpl: PromptTemplate = { id: Date.now().toString(), title, idea, tone, imageStyle, brandVoice, createdAt: new Date().toISOString() };
      setPromptLibrary(prev => [tpl, ...prev]);
      localStorage.setItem('mind2matter_library', JSON.stringify([tpl, ...promptLibrary]));
      showToast("Template Saved", "success");
  };

  const handleLoadTemplate = (t: PromptTemplate) => {
      if(idea.trim() && !window.confirm("Overwrite current idea?")) return;
      setIdea(t.idea); setTone(t.tone); setImageStyle(t.imageStyle); setBrandVoice(t.brandVoice);
      setIsLibraryOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
      if(!window.confirm("Delete template?")) return;
      const newLib = promptLibrary.filter(t => t.id !== id);
      setPromptLibrary(newLib);
      localStorage.setItem('mind2matter_library', JSON.stringify(newLib));
  };

  const chatActions = {
    setIdea, setTone, setImageStyle, togglePlatform,
    generateContent: async () => { await handleGenerate(); },
    editPostContent: (p: Platform, c: string) => { const idx = posts.findIndex(x => x.platform === p); if(idx >= 0) handleContentEdit(idx, c); },
    generateImage: async (p: Platform, txt: string) => { /* Simplification for chat */ },
    editImage: async (p: Platform, txt: string) => { const idx = posts.findIndex(x => x.platform === p); if(idx >= 0) await handleEditImage(idx, txt); },
    generateVideo: async (p: Platform) => { const idx = posts.findIndex(x => x.platform === p); if(idx >= 0) await handleGenerateVideo(idx); },
    saveCampaign: () => saveCurrentCampaign(false),
    loadCampaign: (id: string) => { const c = campaigns.find(x => x.id === id); if(c) loadCampaign(c); }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Mind <span className="text-indigo-600">2 Matter</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
                 <span>Ctrl+S: Save</span>
                 <span className="mx-1">•</span>
                 <span>Ctrl+Z: Undo</span>
                 <span className="mx-1">•</span>
                 <span>Ctrl+E: Export</span>
             </div>
             <button onClick={() => setIsLibraryOpen(true)} className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Library
             </button>
             <button onClick={() => setIsCampaignManagerOpen(true)} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
               Campaigns
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200/60 p-8 max-w-5xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="space-y-8 relative z-10">
            <div className="text-center relative mb-4">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Post Workshop</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Turn your ideas into engaging social content</p>
            </div>

            <div className="space-y-3">
              <label htmlFor="idea" className="block text-sm font-bold text-slate-700 uppercase tracking-wide flex justify-between">
                <span>What do you want to post about?</span>
                {idea.length > 10 && (
                    <button onClick={handleSaveToLibrary} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        Save as Template
                    </button>
                )}
              </label>
              <div className="relative">
                  <textarea
                    id="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    maxLength={3000}
                    placeholder="e.g. We just launched our new AI-powered analytics dashboard..."
                    className="w-full h-36 p-4 pb-10 rounded-2xl border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none text-base leading-relaxed shadow-inner"
                  />
                  <div className="absolute bottom-3 right-3 text-xs font-medium pointer-events-none flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-100/50">
                    <span className={`${idea.length > 2800 ? 'text-amber-600' : 'text-slate-400'}`}>{idea.length}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-300">3000</span>
                  </div>
              </div>
            </div>

            {/* Settings Toggles */}
            <div className="space-y-6">
                {/* Tone & Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100 overflow-hidden">
                        <button onClick={() => setShowTone(!showTone)} className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-colors">
                           <span className="flex items-center gap-2"><div className="p-1 bg-indigo-100 rounded text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>Tone of Voice</span>
                           <svg className={`w-4 h-4 transition-transform duration-300 ${showTone ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showTone && (
                           <div className="px-4 pb-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                               <div className="flex flex-wrap gap-2">
                                 {Object.values(Tone).map((t) => (
                                   <button key={t} onClick={() => setTone(t)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 border ${tone === t ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{t}</button>
                                 ))}
                               </div>
                           </div>
                        )}
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100 overflow-hidden">
                        <button onClick={() => setShowStyle(!showStyle)} className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-colors">
                           <span className="flex items-center gap-2"><div className="p-1 bg-indigo-100 rounded text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>Visual Style</span>
                           <svg className={`w-4 h-4 transition-transform duration-300 ${showStyle ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showStyle && (
                           <div className="px-4 pb-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                               <div className="relative">
                                   <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value as ImageStyle)} className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                                     {Object.values(ImageStyle).map((style) => <option key={style} value={style}>{style}</option>)}
                                   </select>
                               </div>
                           </div>
                        )}
                    </div>
                </div>
                {/* Platforms */}
                <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100 overflow-hidden">
                     <button onClick={() => setShowPlatforms(!showPlatforms)} className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-colors">
                        <span className="flex items-center gap-2"><div className="p-1 bg-indigo-100 rounded text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></div>Target Platforms</span>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${showPlatforms ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </button>
                     {showPlatforms && (
                        <div className="px-4 pb-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {Object.values(Platform).map((p) => (
                                <button key={p} onClick={() => togglePlatform(p)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 group ${selectedPlatforms.includes(p) ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-400"}`}>
                                  <div className={`w-6 h-6 ${selectedPlatforms.includes(p) ? 'scale-110' : 'grayscale opacity-60'}`}>{PlatformIcons[p]}</div>
                                  <span className="text-xs font-bold">{p}</span>
                                </button>
                              ))}
                           </div>
                        </div>
                     )}
                </div>
                {/* Brand Voice */}
                <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100 overflow-hidden">
                    <button onClick={() => setShowBrandVoice(!showBrandVoice)} className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-colors">
                        <span className="flex items-center gap-2"><div className="p-1 bg-indigo-100 rounded text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>Customize Brand Voice <span className="text-slate-400 font-normal text-xs">(Optional)</span></span>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${showBrandVoice ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showBrandVoice && (
                        <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                               <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Writing Style</label>
                                 <input type="text" placeholder="e.g. Short, Punchy" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white shadow-sm" value={brandVoice.style} onChange={(e) => setBrandVoice({...brandVoice, style: e.target.value})} />
                               </div>
                               <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Keywords</label>
                                 <input type="text" placeholder="e.g. Sustainable" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white shadow-sm" value={brandVoice.keywords} onChange={(e) => setBrandVoice({...brandVoice, keywords: e.target.value})} />
                               </div>
                               <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Terminology</label>
                                 <input type="text" placeholder="e.g. Use 'Guests' not 'Customers'" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white shadow-sm" value={brandVoice.terminology} onChange={(e) => setBrandVoice({...brandVoice, terminology: e.target.value})} />
                               </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-2">
                <button onClick={handleGenerate} disabled={isGenerating || !idea.trim() || selectedPlatforms.length === 0} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.99] ${isGenerating || !idea.trim() || selectedPlatforms.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-indigo-200 ring-1 ring-white/20"}`}>
                {isGenerating ? (
                    <><svg className="animate-spin h-6 w-6 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="tracking-wide">Crafting Your Campaign...</span></>
                ) : (
                    <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><span className="tracking-wide">Generate Campaign Assets</span></>
                )}
                </button>
            </div>
          </div>
        </section>

        {/* Generated Content Section */}
        {posts.some(p => (p.isLoading || p.variants.A.content) && selectedPlatforms.includes(p.platform)) && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">Generated Content</h2>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Auto-Saving</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="flex gap-1 mr-2">
                        <button onClick={handleUndo} disabled={historyPointer <= 0} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-indigo-600 disabled:opacity-50 transition-all" title="Undo (Ctrl+Z)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={handleRedo} disabled={historyPointer >= historyStack.length - 1} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-indigo-600 disabled:opacity-50 transition-all" title="Redo (Ctrl+Y)">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                   </div>
                   <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       CSV
                   </button>
                   <button onClick={handleDownloadCampaign} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      JSON
                   </button>
                   <button onClick={handleCopyAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                       Copy All
                   </button>
               </div>
            </div>
            
            <div className="flex flex-col gap-6 w-full">
              {posts.map((post, index) => {
                if (!selectedPlatforms.includes(post.platform)) return null;
                return (
                  <PlatformCard 
                    key={post.platform} 
                    post={post} 
                    imageStyle={imageStyle}
                    imageResolution={imageResolution}
                    onVariantChange={(v) => handleVariantChange(index, v)}
                    onContentEdit={(content) => handleContentEdit(index, content)}
                    onGenerateVideo={() => handleGenerateVideo(index)}
                    onAspectRatioChange={(ratio) => handleAspectRatioChange(index, ratio)}
                    onResolutionChange={(res) => handleResolutionChange(index, res)}
                    onRegenerateImage={() => handleRegenerateImage(index)}
                    onImageEdit={async (prompt, mask, ref) => handleEditImage(index, prompt, mask, ref)}
                    onImageRestore={(url) => handleImageRestore(index, url)}
                    onSchedule={(date) => handleSchedule(index, date)}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
      
      <CampaignSidebar 
        isOpen={isCampaignManagerOpen}
        onClose={() => setIsCampaignManagerOpen(false)}
        campaigns={campaigns}
        onLoad={loadCampaign}
        onDelete={handleDeleteCampaign}
      />

      <PromptLibrarySidebar 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        templates={promptLibrary}
        onLoad={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
      />

      <ChatWidget 
        appState={{ idea, tone, imageStyle, brandVoice, posts, selectedPlatforms }}
        actions={chatActions}
      />
    </div>
  );
};

export default App;
