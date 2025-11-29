// Storage Types for Local Folder Storage System

import type {
  Platform,
  Tone,
  ImageStyle,
  ImageResolution,
  AspectRatio,
  BrandVoice,
  AnalyticsMetrics,
  PostStatus,
} from './postGenerator';

import type {
  ImageModel,
  ImageResolutionV3,
  AspectRatioV3,
  VideoSettings,
} from './imageEditor';

// ============================================
// Stored Post Types
// ============================================

export interface StoredPostVariant {
  id: 'A' | 'B';
  content: string | null;
  imagePrompt: string;
  imagePath: string | null; // Relative path in storage folder
  imageHistoryPaths: string[]; // Paths to history images
  videoPath: string | null;
  analytics: AnalyticsMetrics;
  rationale?: string;
}

export interface StoredPost {
  id: string;
  createdAt: string; // ISO date
  updatedAt: string;
  platform: Platform;
  status: PostStatus;
  scheduledDate: string | null;
  publishedDate: string | null;

  // Generator inputs
  idea: string;
  tone: Tone;
  imageStyle: ImageStyle;
  brandVoice: BrandVoice;

  // Variants
  variants: {
    A: StoredPostVariant;
    B: StoredPostVariant;
  };
  selectedVariantId: 'A' | 'B';

  // Settings
  imageAspectRatio: AspectRatio;
  imageResolution: ImageResolution;

  // Organization
  tags: string[];
}

// ============================================
// Stored Project Types (Image Editor)
// ============================================

export interface StoredHistoryEntry {
  id: string;
  imagePath: string;
  timestamp: number;
  action: string;
  prompt?: string;
}

export interface StoredProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Image state (paths relative to project folder)
  currentImagePath: string | null;
  originalImagePath: string | null;
  maskImagePath: string | null;

  // Model settings
  model: ImageModel;
  resolution: ImageResolutionV3;
  aspectRatio: AspectRatioV3;

  // Reference images
  referenceImagePaths: string[];

  // History
  history: StoredHistoryEntry[];

  // Last prompt
  lastPrompt: string;

  // Video
  videoPath: string | null;
  videoSettings: VideoSettings;

  // Organization
  tags: string[];
}

// ============================================
// Index Types (for fast listing)
// ============================================

export interface PostSummary {
  id: string;
  platform: Platform;
  idea: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  thumbnailPath: string | null;
  tags: string[];
}

export interface PostIndex {
  version: number;
  lastUpdated: string;
  posts: PostSummary[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnailPath: string | null;
  historyCount: number;
  tags: string[];
}

export interface ProjectIndex {
  version: number;
  lastUpdated: string;
  projects: ProjectSummary[];
}

// ============================================
// Workspace Types (from domain model)
// ============================================

// Re-export domain types for storage
export type { Project, Idea, Experiment, Member, ProjectStage, IdeaStage, ExperimentStatus, MemberRole } from '../domain/model';

export interface WorkspaceIndex {
  version: number;
  lastUpdated: string;
  projects: import('../domain/model').Project[];
  ideas: import('../domain/model').Idea[];
  experiments: import('../domain/model').Experiment[];
  members: import('../domain/model').Member[];
}

export interface WorkspaceFilter {
  projectId?: string;
  searchQuery?: string;
}

// ============================================
// Settings Types
// ============================================

export interface SavedBrandVoice extends BrandVoice {
  id: string;
  name: string;
  createdAt: string;
}

export interface AppSettings {
  version: number;

  // General
  theme: 'light' | 'dark' | 'system';
  language: string;

  // Default values for PostGenerator
  defaultTone: Tone;
  defaultImageStyle: ImageStyle;
  defaultPlatforms: Platform[];

  // Default values for ImageEditor
  defaultModel: ImageModel;
  defaultResolution: ImageResolutionV3;
  defaultAspectRatio: AspectRatioV3;

  // Brand voices
  brandVoices: SavedBrandVoice[];
  activeBrandVoiceId: string | null;

  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveIntervalSeconds: number;
}

// ============================================
// Storage Stats
// ============================================

export interface StorageStats {
  totalPosts: number;
  totalProjects: number;
  totalImages: number;
  totalVideos: number;
  estimatedSizeBytes: number;
  oldestContent: string | null;
  newestContent: string | null;
}

// ============================================
// Filter Types
// ============================================

export interface PostFilter {
  platform?: Platform;
  status?: PostStatus;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface ProjectFilter {
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

// ============================================
// Storage State & Context
// ============================================

export type StorageConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface StorageState {
  status: StorageConnectionStatus;
  folderName: string | null;
  error: string | null;
  isSupported: boolean;
  stats: StorageStats | null;
}

export interface StorageContextValue extends StorageState {
  // Connection
  selectFolder: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
  disconnect: () => void;

  // Posts (social media posts)
  savePost: (post: StoredPost, images: Map<string, string>) => Promise<void>;
  getPost: (id: string) => Promise<StoredPost | null>;
  listPosts: (filter?: PostFilter) => Promise<PostSummary[]>;
  deletePost: (id: string) => Promise<void>;

  // Projects (ImageEditor projects)
  saveProject: (project: StoredProject, files: Map<string, string>) => Promise<void>;
  getProject: (id: string) => Promise<StoredProject | null>;
  listProjects: (filter?: ProjectFilter) => Promise<ProjectSummary[]>;
  deleteProject: (id: string) => Promise<void>;

  // Workspace Projects (domain model)
  saveWorkspaceProject: (project: import('../domain/model').Project) => Promise<void>;
  getWorkspaceProject: (id: string) => Promise<import('../domain/model').Project | null>;
  listWorkspaceProjects: () => Promise<import('../domain/model').Project[]>;
  deleteWorkspaceProject: (id: string) => Promise<void>;

  // Ideas (domain model)
  saveIdea: (idea: import('../domain/model').Idea) => Promise<void>;
  getIdea: (id: string) => Promise<import('../domain/model').Idea | null>;
  listIdeas: (projectId?: string) => Promise<import('../domain/model').Idea[]>;
  deleteIdea: (id: string) => Promise<void>;

  // Experiments (domain model)
  saveExperiment: (experiment: import('../domain/model').Experiment) => Promise<void>;
  getExperiment: (id: string) => Promise<import('../domain/model').Experiment | null>;
  listExperiments: (ideaId?: string) => Promise<import('../domain/model').Experiment[]>;
  deleteExperiment: (id: string) => Promise<void>;

  // Settings
  saveSettings: (settings: AppSettings) => Promise<void>;
  getSettings: () => Promise<AppSettings | null>;

  // Files
  loadImage: (path: string) => Promise<string | null>;
  loadVideo: (path: string) => Promise<string | null>;

  // Stats
  refreshStats: () => Promise<void>;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: 1,
  theme: 'system',
  language: 'en',
  defaultTone: 'Professional',
  defaultImageStyle: 'Photorealistic',
  defaultPlatforms: ['LinkedIn'],
  defaultModel: 'pro',
  defaultResolution: '4K',
  defaultAspectRatio: '16:9',
  brandVoices: [],
  activeBrandVoiceId: null,
  autoSaveEnabled: true,
  autoSaveIntervalSeconds: 30,
};

export const DEFAULT_STORAGE_STATE: StorageState = {
  status: 'disconnected',
  folderName: null,
  error: null,
  isSupported: false,
  stats: null,
};

// ============================================
// Utility Functions
// ============================================

export const generatePostId = (): string => {
  return `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

export const generateProjectId = (): string => {
  return `proj-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

// ============================================
// Browser Compatibility
// ============================================

export interface BrowserInfo {
  supported: boolean;
  browser: string;
  message: string;
}

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export const getBrowserInfo = (): BrowserInfo => {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    return {
      supported: true,
      browser: 'Chrome',
      message: 'Your browser fully supports local folder storage.',
    };
  }

  if (ua.includes('Edg')) {
    return {
      supported: true,
      browser: 'Edge',
      message: 'Your browser fully supports local folder storage.',
    };
  }

  if (ua.includes('OPR') || ua.includes('Opera')) {
    return {
      supported: true,
      browser: 'Opera',
      message: 'Your browser fully supports local folder storage.',
    };
  }

  if (ua.includes('Firefox')) {
    return {
      supported: false,
      browser: 'Firefox',
      message:
        'Local folder storage is not supported in Firefox. You can still use the app with manual downloads, or switch to Chrome/Edge for full storage support.',
    };
  }

  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return {
      supported: false,
      browser: 'Safari',
      message:
        'Local folder storage is not supported in Safari. You can still use the app with manual downloads, or switch to Chrome/Edge for full storage support.',
    };
  }

  return {
    supported: false,
    browser: 'Unknown',
    message:
      'Your browser may not support local folder storage. Chrome or Edge is recommended for full functionality.',
  };
};
