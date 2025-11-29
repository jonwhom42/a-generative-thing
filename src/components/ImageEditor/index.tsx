import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Alert, Snackbar, IconButton, Tooltip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { MdSave, MdCheck } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import type {
  ImageEditorState,
  EditorTool,
  ImageModel,
  ImageResolutionV3,
  AspectRatioV3,
  ReferenceImage,
  HistoryEntry,
} from '../../types/imageEditor';
import { DEFAULT_EDITOR_STATE } from '../../types/imageEditor';
import { generateImageV3, editImageV3, generateVideoV31, extendVideoV31 } from '../../services/gemini';
import { ToolsSidebar } from './ToolsSidebar';
import { EditorCanvas } from './EditorCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { PromptBar } from './PromptBar';
import { VideoTimeline } from './VideoTimeline';
import { useStorage } from '../../context/StorageContext';
import type { StoredProject, StoredHistoryEntry } from '../../types/storage';
import { generateProjectId } from '../../types/storage';

export const ImageEditor = () => {
  const [searchParams] = useSearchParams();
  const { status, saveProject, getProject, loadImage, loadVideo } = useStorage();
  const isStorageConnected = status === 'connected';

  const [state, setState] = useState<ImageEditorState>(DEFAULT_EDITOR_STATE);
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const canvasRef = useRef<{ getMaskDataUrl: () => string | null; clearMask: () => void } | null>(null);

  // Project save state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load project from storage if URL has ?load=id
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId && isStorageConnected) {
      loadProjectFromStorage(loadId);
    }
  }, [searchParams, isStorageConnected]);

  const loadProjectFromStorage = async (id: string) => {
    try {
      const storedProject = await getProject(id);
      if (!storedProject) {
        showSnackbar('Project not found', 'error');
        return;
      }

      // Full path prefix for this project's files
      const projectPath = `projects/${storedProject.id}`;

      // Load images
      let currentImage: string | null = null;
      let originalImage: string | null = null;
      let maskImage: string | null = null;
      let videoUrl: string | null = null;

      if (storedProject.currentImagePath) {
        currentImage = await loadImage(`${projectPath}/${storedProject.currentImagePath}`);
      }
      if (storedProject.originalImagePath) {
        originalImage = await loadImage(`${projectPath}/${storedProject.originalImagePath}`);
      }
      if (storedProject.maskImagePath) {
        maskImage = await loadImage(`${projectPath}/${storedProject.maskImagePath}`);
      }
      if (storedProject.videoPath) {
        videoUrl = await loadVideo(`${projectPath}/${storedProject.videoPath}`);
      }

      // Load reference images
      const referenceImages: ReferenceImage[] = [];
      for (let i = 0; i < storedProject.referenceImagePaths.length; i++) {
        const img = await loadImage(`${projectPath}/${storedProject.referenceImagePaths[i]}`);
        if (img) {
          referenceImages.push({
            id: `ref-${i}`,
            url: img,
            thumbnail: img,
          });
        }
      }

      // Load history
      const history: HistoryEntry[] = [];
      for (const entry of storedProject.history) {
        const img = await loadImage(`${projectPath}/${entry.imagePath}`);
        if (img) {
          history.push({
            id: entry.id,
            imageUrl: img,
            timestamp: entry.timestamp,
            action: entry.action,
          });
        }
      }

      // Update state
      setState((prev) => ({
        ...prev,
        currentImage,
        originalImage,
        maskImage,
        model: storedProject.model,
        resolution: storedProject.resolution,
        aspectRatio: storedProject.aspectRatio,
        referenceImages,
        history,
        historyIndex: history.length - 1,
        prompt: storedProject.lastPrompt,
        video: storedProject.videoSettings,
        generatedVideo: videoUrl
          ? {
              id: Date.now().toString(),
              url: videoUrl,
              duration: 8,
              operationName: '',
              totalDuration: 8,
            }
          : null,
      }));

      setProjectId(storedProject.id);
      setProjectName(storedProject.name);
      setIsSaved(true);

      showSnackbar('Project loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to load project:', error);
      showSnackbar('Failed to load project', 'error');
    }
  };

  const handleSaveProject = useCallback(async () => {
    if (!isStorageConnected) {
      showSnackbar('Storage not connected', 'error');
      return;
    }

    // Show save dialog if no project name yet
    if (!projectId) {
      setShowSaveDialog(true);
      return;
    }

    await saveProjectToStorage();
  }, [isStorageConnected, projectId]);

  const saveProjectToStorage = async () => {
    setIsSaving(true);
    setShowSaveDialog(false);

    try {
      const id = projectId || generateProjectId();

      // Build StoredProject
      const storedProject: StoredProject = {
        id,
        name: projectName,
        createdAt: projectId ? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentImagePath: state.currentImage ? 'current.png' : null,
        originalImagePath: state.originalImage ? 'original.png' : null,
        maskImagePath: state.maskImage ? 'mask.png' : null,
        model: state.model,
        resolution: state.resolution,
        aspectRatio: state.aspectRatio,
        referenceImagePaths: state.referenceImages.map((_, idx) => `references/ref_${idx}.png`),
        history: state.history.map((entry, idx): StoredHistoryEntry => ({
          id: entry.id,
          imagePath: `history/history_${idx}.png`,
          timestamp: entry.timestamp,
          action: entry.action,
          prompt: entry.action === 'Generate' || entry.action === 'Edit' ? state.prompt : undefined,
        })),
        lastPrompt: state.prompt,
        videoPath: state.generatedVideo?.url ? 'video.mp4' : null,
        videoSettings: state.video,
        tags: [],
      };

      // Collect files to save
      const files = new Map<string, string>();
      if (state.currentImage) {
        files.set('current.png', state.currentImage);
      }
      if (state.originalImage) {
        files.set('original.png', state.originalImage);
      }
      if (state.maskImage) {
        files.set('mask.png', state.maskImage);
      }
      state.referenceImages.forEach((ref, idx) => {
        files.set(`references/ref_${idx}.png`, ref.url);
      });
      state.history.forEach((entry, idx) => {
        files.set(`history/history_${idx}.png`, entry.imageUrl);
      });
      if (state.generatedVideo?.url) {
        files.set('video.mp4', state.generatedVideo.url);
      }

      await saveProject(storedProject, files);

      setProjectId(id);
      setIsSaved(true);
      setIsSaving(false);

      showSnackbar('Project saved!', 'success');
    } catch (error) {
      console.error('Failed to save project:', error);
      setIsSaving(false);
      showSnackbar('Failed to save project', 'error');
    }
  };

  // Mark as unsaved when state changes
  const markUnsaved = useCallback(() => {
    if (projectId) {
      setIsSaved(false);
    }
  }, [projectId]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const addToHistory = useCallback((imageUrl: string, action: string) => {
    setState((prev) => {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        imageUrl,
        timestamp: Date.now(),
        action,
      };
      const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), newEntry];
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
    markUnsaved();
  }, [markUnsaved]);

  const handleUndo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          historyIndex: newIndex,
          currentImage: prev.history[newIndex].imageUrl,
        };
      }
      return prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          historyIndex: newIndex,
          currentImage: prev.history[newIndex].imageUrl,
        };
      }
      return prev;
    });
  }, []);

  const handleToolChange = useCallback((tool: EditorTool) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  const handleModelChange = useCallback((model: ImageModel) => {
    setState((prev) => ({
      ...prev,
      model,
      resolution: model === 'flash' ? '1K' : prev.resolution,
      referenceImages: model === 'flash' ? prev.referenceImages.slice(0, 1) : prev.referenceImages,
    }));
  }, []);

  const handleResolutionChange = useCallback((resolution: ImageResolutionV3) => {
    setState((prev) => ({ ...prev, resolution }));
  }, []);

  const handleAspectRatioChange = useCallback((aspectRatio: AspectRatioV3) => {
    setState((prev) => ({ ...prev, aspectRatio }));
  }, []);

  const handleBrushSizeChange = useCallback((size: number) => {
    setState((prev) => ({ ...prev, brush: { ...prev.brush, size } }));
  }, []);

  const handleBrushOpacityChange = useCallback((opacity: number) => {
    setState((prev) => ({ ...prev, brush: { ...prev.brush, opacity } }));
  }, []);

  const handlePromptChange = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, prompt }));
  }, []);

  const handleAddReferenceImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newRef: ReferenceImage = {
        id: Date.now().toString(),
        url,
        thumbnail: url,
      };
      setState((prev) => {
        const maxRefs = prev.model === 'pro' ? 14 : 1;
        if (prev.referenceImages.length >= maxRefs) {
          showSnackbar(`Maximum ${maxRefs} reference image(s) for ${prev.model} model`, 'error');
          return prev;
        }
        return { ...prev, referenceImages: [...prev.referenceImages, newRef] };
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveReferenceImage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((ref) => ref.id !== id),
    }));
  }, []);

  const handleUploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setState((prev) => ({
        ...prev,
        currentImage: url,
        originalImage: url,
      }));
      addToHistory(url, 'Upload');
    };
    reader.readAsDataURL(file);
  }, [addToHistory]);

  const handleGenerateImage = useCallback(async () => {
    if (!state.prompt.trim()) {
      showSnackbar('Please enter a prompt', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isGeneratingImage: true, error: null }));

    try {
      const referenceUrls = state.referenceImages.map((ref) => ref.url);
      const imageUrl = await generateImageV3(state.prompt, {
        model: state.model,
        aspectRatio: state.aspectRatio,
        resolution: state.resolution,
        referenceImages: referenceUrls.length > 0 ? referenceUrls : undefined,
      });

      setState((prev) => ({
        ...prev,
        currentImage: imageUrl,
        originalImage: imageUrl,
        isGeneratingImage: false,
      }));
      addToHistory(imageUrl, 'Generate');
      showSnackbar('Image generated successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      setState((prev) => ({ ...prev, isGeneratingImage: false, error: message }));
      showSnackbar(message, 'error');
    }
  }, [state.prompt, state.model, state.aspectRatio, state.resolution, state.referenceImages, addToHistory]);

  const handleEditImage = useCallback(async () => {
    if (!state.currentImage) {
      showSnackbar('Please upload or generate an image first', 'error');
      return;
    }
    if (!state.prompt.trim()) {
      showSnackbar('Please enter an edit prompt', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isEditingImage: true, error: null }));

    try {
      const maskDataUrl = canvasRef.current?.getMaskDataUrl() || null;
      const referenceUrls = state.referenceImages.map((ref) => ref.url);

      const editedImageUrl = await editImageV3(state.currentImage, state.prompt, {
        model: state.model,
        mask: maskDataUrl,
        referenceImages: referenceUrls.length > 0 ? referenceUrls : undefined,
        resolution: state.resolution,
      });

      setState((prev) => ({
        ...prev,
        currentImage: editedImageUrl,
        isEditingImage: false,
      }));
      canvasRef.current?.clearMask();
      addToHistory(editedImageUrl, 'Edit');
      showSnackbar('Image edited successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to edit image';
      setState((prev) => ({ ...prev, isEditingImage: false, error: message }));
      showSnackbar(message, 'error');
    }
  }, [state.currentImage, state.prompt, state.model, state.referenceImages, state.resolution, addToHistory]);

  const handleVideoSettingsChange = useCallback((settings: Partial<typeof state.video>) => {
    setState((prev) => ({ ...prev, video: { ...prev.video, ...settings } }));
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!state.prompt.trim()) {
      showSnackbar('Please enter a prompt for video generation', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isGeneratingVideo: true, error: null }));

    try {
      const result = await generateVideoV31(state.prompt, {
        aspectRatio: state.aspectRatio === '9:16' ? '9:16' : '16:9',
        resolution: state.video.resolution,
        duration: state.video.duration,
        firstFrame: state.video.firstFrame || state.currentImage || undefined,
        lastFrame: state.video.lastFrame || undefined,
        referenceImages: state.video.referenceImages.length > 0 ? state.video.referenceImages : undefined,
        fast: state.video.fast,
      });

      setState((prev) => ({
        ...prev,
        isGeneratingVideo: false,
        generatedVideo: {
          id: Date.now().toString(),
          url: result.videoUrl,
          duration: parseInt(state.video.duration),
          operationName: result.operationName,
          totalDuration: parseInt(state.video.duration),
        },
      }));
      showSnackbar('Video generated successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate video';
      setState((prev) => ({ ...prev, isGeneratingVideo: false, error: message }));
      showSnackbar(message, 'error');
    }
  }, [state.prompt, state.aspectRatio, state.video, state.currentImage]);

  const handleExtendVideo = useCallback(async () => {
    if (!state.generatedVideo) {
      showSnackbar('No video to extend', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isExtendingVideo: true, error: null }));

    try {
      const result = await extendVideoV31(state.generatedVideo.operationName, state.prompt || 'Continue the video', {
        aspectRatio: state.aspectRatio === '9:16' ? '9:16' : '16:9',
        extensionSeconds: 7,
        fast: state.video.fast,
      });

      setState((prev) => ({
        ...prev,
        isExtendingVideo: false,
        generatedVideo: prev.generatedVideo
          ? {
              ...prev.generatedVideo,
              url: result.videoUrl,
              operationName: result.operationName,
              totalDuration: prev.generatedVideo.totalDuration + 7,
            }
          : null,
      }));
      showSnackbar('Video extended successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extend video';
      setState((prev) => ({ ...prev, isExtendingVideo: false, error: message }));
      showSnackbar(message, 'error');
    }
  }, [state.generatedVideo, state.prompt, state.aspectRatio, state.video.fast]);

  const handleSetFirstFrame = useCallback(() => {
    if (state.currentImage) {
      setState((prev) => ({
        ...prev,
        video: { ...prev.video, firstFrame: state.currentImage },
      }));
      showSnackbar('Current image set as first frame', 'success');
    }
  }, [state.currentImage]);

  const handleSetLastFrame = useCallback(() => {
    if (state.currentImage) {
      setState((prev) => ({
        ...prev,
        video: { ...prev.video, lastFrame: state.currentImage },
      }));
      showSnackbar('Current image set as last frame', 'success');
    }
  }, [state.currentImage]);

  const handleClearCanvas = useCallback(() => {
    canvasRef.current?.clearMask();
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const isLoading = state.isGeneratingImage || state.isEditingImage || state.isGeneratingVideo || state.isExtendingVideo;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Save Button - Top Right */}
      {isStorageConnected && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            right: 320,
            zIndex: 100,
          }}
        >
          <Tooltip title={isSaved ? 'Saved' : 'Save project'}>
            <IconButton
              onClick={handleSaveProject}
              disabled={isSaving}
              sx={{
                bgcolor: 'white',
                boxShadow: 2,
                color: isSaved ? 'success.main' : 'text.secondary',
                '&:hover': {
                  bgcolor: 'grey.100',
                  color: isSaved ? 'success.dark' : 'primary.main',
                },
              }}
            >
              {isSaving ? (
                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 16, height: 16, border: 2, borderColor: 'primary.main', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                </Box>
              ) : isSaved ? (
                <MdCheck size={24} />
              ) : (
                <MdSave size={24} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Main Editor Area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Tools */}
        <ToolsSidebar
          activeTool={state.activeTool}
          onToolChange={handleToolChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onClearCanvas={handleClearCanvas}
          mode={mode}
          onModeChange={setMode}
        />

        {/* Center - Canvas */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <EditorCanvas
            ref={canvasRef}
            currentImage={state.currentImage}
            activeTool={state.activeTool}
            brushSize={state.brush.size}
            brushColor={state.brush.color}
            brushOpacity={state.brush.opacity}
            onUploadImage={handleUploadImage}
            isLoading={isLoading}
          />

          {/* Video Timeline - only in video mode */}
          {mode === 'video' && (
            <VideoTimeline
              video={state.generatedVideo}
              isGenerating={state.isGeneratingVideo}
              isExtending={state.isExtendingVideo}
              onExtend={handleExtendVideo}
              firstFrame={state.video.firstFrame}
              lastFrame={state.video.lastFrame}
            />
          )}
        </Box>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel
          mode={mode}
          model={state.model}
          resolution={state.resolution}
          aspectRatio={state.aspectRatio}
          brushSize={state.brush.size}
          brushOpacity={state.brush.opacity}
          referenceImages={state.referenceImages}
          videoSettings={state.video}
          onModelChange={handleModelChange}
          onResolutionChange={handleResolutionChange}
          onAspectRatioChange={handleAspectRatioChange}
          onBrushSizeChange={handleBrushSizeChange}
          onBrushOpacityChange={handleBrushOpacityChange}
          onAddReferenceImage={handleAddReferenceImage}
          onRemoveReferenceImage={handleRemoveReferenceImage}
          onVideoSettingsChange={handleVideoSettingsChange}
          onSetFirstFrame={handleSetFirstFrame}
          onSetLastFrame={handleSetLastFrame}
          hasCurrentImage={!!state.currentImage}
        />
      </Box>

      {/* Bottom - Prompt Bar */}
      <PromptBar
        prompt={state.prompt}
        onPromptChange={handlePromptChange}
        onGenerate={mode === 'image' ? handleGenerateImage : handleGenerateVideo}
        onEdit={handleEditImage}
        isLoading={isLoading}
        hasImage={!!state.currentImage}
        mode={mode}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Save Project Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button
            onClick={saveProjectToStorage}
            variant="contained"
            disabled={!projectName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageEditor;
