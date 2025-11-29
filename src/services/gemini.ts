/**
 * Gemini API Service (Frontend Proxy Client)
 *
 * This module provides the same interface as before, but all calls
 * now go through the authenticated backend proxy at /api/gemini/*.
 *
 * SECURITY: No Gemini API key is present in this frontend code.
 * All API calls require a valid Clerk session token.
 *
 * Used by:
 * - PostGenerator: generatePostContent, generateImage, editImage, generateVideo
 * - ImageEditor: generateImageV3, editImageV3, generateVideoV31, extendVideoV31
 */

import {
  Platform,
  Tone,
  ImageStyle,
} from '../types/postGenerator';
import type {
  BrandVoice,
  AnalyticsMetrics,
  ImageResolution,
  AspectRatio,
} from '../types/postGenerator';
import type {
  ImageModel,
  ImageResolutionV3,
  AspectRatioV3,
  VideoDuration,
  VideoResolution,
} from '../types/imageEditor';

// ============================================================================
// Auth Token Management
// ============================================================================

// Session token getter - will be set by components that use Clerk's useAuth()
let getSessionToken: (() => Promise<string | null>) | null = null;

/**
 * Set the session token getter function
 * Call this from a component that has access to Clerk's useAuth()
 */
export const setSessionTokenGetter = (getter: () => Promise<string | null>) => {
  getSessionToken = getter;
};

/**
 * Get the current session token for API calls
 */
const getAuthToken = async (): Promise<string> => {
  if (!getSessionToken) {
    throw new Error('Session token getter not configured. Ensure you are logged in.');
  }
  const token = await getSessionToken();
  if (!token) {
    throw new Error('No session token available. Please sign in.');
  }
  return token;
};

// ============================================================================
// API Helper
// ============================================================================

interface ApiError {
  error: string;
  message?: string;
}

async function apiCall<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`/api/gemini${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Types (unchanged from original)
// ============================================================================

export interface GeneratedVariants {
  A: {
    text: string;
    imagePrompt: string;
    analytics: AnalyticsMetrics;
    rationale: string;
  };
  B: {
    text: string;
    imagePrompt: string;
    analytics: AnalyticsMetrics;
    rationale: string;
  };
}

// ============================================================================
// PostGenerator Functions
// ============================================================================

/**
 * Generate A/B post content variants for a given platform
 * Used by: PostGenerator
 */
export const generatePostContent = async (
  platform: Platform,
  idea: string,
  tone: Tone,
  brandVoice: BrandVoice,
  imageStyle?: ImageStyle
): Promise<GeneratedVariants> => {
  try {
    return await apiCall<GeneratedVariants>('/generate-post-content', {
      platform,
      idea,
      tone,
      brandVoice,
      imageStyle,
    });
  } catch (error) {
    console.error(`Error generating text for ${platform}:`, error);
    throw new Error('Failed to generate post content.');
  }
};

/**
 * Generate an image from a prompt
 * Used by: PostGenerator
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  _resolution: ImageResolution = '1K'
): Promise<string> => {
  try {
    const result = await apiCall<{ imageUrl: string }>('/generate-image', {
      prompt,
      aspectRatio,
    });
    return result.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

/**
 * Edit an image with optional mask and reference
 * Used by: PostGenerator
 */
export const editImage = async (
  baseImageBase64: string,
  editPrompt: string,
  maskImageBase64?: string | null,
  referenceImageBase64?: string | null,
  _resolution: ImageResolution = '1K',
  _aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  try {
    const result = await apiCall<{ imageUrl: string }>('/edit-image', {
      baseImageBase64,
      editPrompt,
      maskImageBase64,
      referenceImageBase64,
    });
    return result.imageUrl;
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};

/**
 * Generate a video from prompt and optional image
 * Used by: PostGenerator
 */
export const generateVideo = async (
  prompt: string,
  imageUrl: string | null,
  aspectRatio: AspectRatio,
  style?: ImageStyle,
  _resolution: ImageResolution = '1K'
): Promise<string> => {
  try {
    const result = await apiCall<{ videoUrl: string }>('/generate-video', {
      prompt,
      imageUrl,
      aspectRatio,
      style,
    });
    return result.videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
};

// ============================================================================
// ImageEditor V3 Functions
// ============================================================================

/**
 * Generate image using Gemini 3 Pro or Flash
 * Used by: ImageEditor
 */
export const generateImageV3 = async (
  prompt: string,
  config: {
    model: ImageModel;
    aspectRatio: AspectRatioV3;
    resolution: ImageResolutionV3;
    referenceImages?: string[];
  }
): Promise<string> => {
  try {
    const result = await apiCall<{ imageUrl: string }>('/generate-image-v3', {
      prompt,
      config,
    });
    return result.imageUrl;
  } catch (error) {
    console.error('Error generating image V3:', error);
    throw error;
  }
};

/**
 * Edit image using Gemini 3 Pro or Flash
 * Used by: ImageEditor
 */
export const editImageV3 = async (
  baseImage: string,
  prompt: string,
  config: {
    model: ImageModel;
    mask?: string | null;
    referenceImages?: string[];
    resolution?: ImageResolutionV3;
  }
): Promise<string> => {
  try {
    const result = await apiCall<{ imageUrl: string }>('/edit-image-v3', {
      baseImage,
      prompt,
      config,
    });
    return result.imageUrl;
  } catch (error) {
    console.error('Error editing image V3:', error);
    throw error;
  }
};

/**
 * Generate video using Veo 3.1
 * Used by: ImageEditor
 */
export const generateVideoV31 = async (
  prompt: string,
  config: {
    aspectRatio: '16:9' | '9:16';
    resolution: VideoResolution;
    duration: VideoDuration;
    firstFrame?: string | null;
    lastFrame?: string | null;
    referenceImages?: string[];
    fast?: boolean;
  }
): Promise<{ videoUrl: string; operationName: string; audioIncluded: boolean }> => {
  try {
    return await apiCall<{ videoUrl: string; operationName: string; audioIncluded: boolean }>(
      '/generate-video-v31',
      { prompt, config }
    );
  } catch (error) {
    console.error('Error generating video V31:', error);
    throw error;
  }
};

/**
 * Extend a video by up to 7 seconds
 * Used by: ImageEditor
 */
export const extendVideoV31 = async (
  operationName: string,
  prompt: string,
  config: {
    aspectRatio: '16:9' | '9:16';
    extensionSeconds: number;
    fast?: boolean;
  }
): Promise<{ videoUrl: string; operationName: string }> => {
  try {
    return await apiCall<{ videoUrl: string; operationName: string }>(
      '/extend-video-v31',
      { operationName, prompt, config }
    );
  } catch (error) {
    console.error('Error extending video V31:', error);
    throw error;
  }
};
