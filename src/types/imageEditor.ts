// Image Editor Types

export type ImageModel = 'pro' | 'flash';

export type ImageResolutionV3 = '1K' | '2K' | '4K';

export type VideoResolution = '720p' | '1080p';

export type VideoDuration = '4' | '6' | '8';

export type AspectRatioV3 =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9';

export type EditorTool = 'select' | 'brush' | 'eraser' | 'text';

export interface BrushSettings {
  size: number;
  color: string;
  opacity: number;
}

export interface ReferenceImage {
  id: string;
  url: string;
  thumbnail: string;
}

export interface HistoryEntry {
  id: string;
  imageUrl: string;
  timestamp: number;
  action: string;
}

export interface VideoSettings {
  duration: VideoDuration;
  resolution: VideoResolution;
  includeAudio: boolean;
  firstFrame: string | null;
  lastFrame: string | null;
  referenceImages: string[];
  fast: boolean;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  duration: number;
  operationName: string; // For extension
  totalDuration: number;
}

export interface ImageEditorState {
  // Image state
  currentImage: string | null;
  originalImage: string | null;
  maskImage: string | null;

  // Model settings
  model: ImageModel;
  resolution: ImageResolutionV3;
  aspectRatio: AspectRatioV3;

  // Reference images (up to 14 for pro, 1 for flash)
  referenceImages: ReferenceImage[];

  // Tool settings
  activeTool: EditorTool;
  brush: BrushSettings;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Prompt
  prompt: string;

  // Video
  video: VideoSettings;
  generatedVideo: GeneratedVideo | null;

  // Loading states
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  isGeneratingVideo: boolean;
  isExtendingVideo: boolean;

  // Errors
  error: string | null;
}

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  size: 20,
  color: '#FF0000',
  opacity: 0.6,
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  duration: '8',
  resolution: '1080p',
  includeAudio: true,
  firstFrame: null,
  lastFrame: null,
  referenceImages: [],
  fast: false,
};

export const DEFAULT_EDITOR_STATE: ImageEditorState = {
  currentImage: null,
  originalImage: null,
  maskImage: null,
  model: 'pro',
  resolution: '4K',
  aspectRatio: '16:9',
  referenceImages: [],
  activeTool: 'brush',
  brush: DEFAULT_BRUSH_SETTINGS,
  history: [],
  historyIndex: -1,
  prompt: '',
  video: DEFAULT_VIDEO_SETTINGS,
  generatedVideo: null,
  isGeneratingImage: false,
  isEditingImage: false,
  isGeneratingVideo: false,
  isExtendingVideo: false,
  error: null,
};

// Config for model capabilities
export const MODEL_CONFIG = {
  pro: {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    maxResolution: '4K' as ImageResolutionV3,
    maxReferenceImages: 14,
    description: 'High quality, up to 4K, 14 reference images',
  },
  flash: {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    maxResolution: '1K' as ImageResolutionV3,
    maxReferenceImages: 1,
    description: 'Fast iterations, 1K output',
  },
} as const;

export const VIDEO_CONFIG = {
  standard: {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1',
    description: 'High quality with audio',
  },
  fast: {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    description: 'Quick previews',
  },
} as const;

export const ASPECT_RATIO_OPTIONS: { value: AspectRatioV3; label: string }[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '3:2', label: 'Photo (3:2)' },
  { value: '2:3', label: 'Portrait Photo (2:3)' },
  { value: '4:5', label: 'Instagram (4:5)' },
  { value: '5:4', label: 'Wide (5:4)' },
  { value: '21:9', label: 'Ultrawide (21:9)' },
];

export const RESOLUTION_OPTIONS: { value: ImageResolutionV3; label: string }[] = [
  { value: '1K', label: '1K (1024px)' },
  { value: '2K', label: '2K (2048px)' },
  { value: '4K', label: '4K (4096px)' },
];

export const VIDEO_DURATION_OPTIONS: { value: VideoDuration; label: string }[] = [
  { value: '4', label: '4 seconds' },
  { value: '6', label: '6 seconds' },
  { value: '8', label: '8 seconds' },
];

export const VIDEO_RESOLUTION_OPTIONS: { value: VideoResolution; label: string }[] = [
  { value: '720p', label: '720p HD' },
  { value: '1080p', label: '1080p Full HD' },
];
