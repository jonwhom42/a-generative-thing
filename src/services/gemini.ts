import { GoogleGenAI, Type } from '@google/genai';
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

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'your_api_key_here') {
    throw new Error('Please set your VITE_GEMINI_API_KEY in .env.local');
  }
  return key;
};

const getPlatformInstructions = (platform: Platform): string => {
  switch (platform) {
    case Platform.LINKEDIN:
      return 'Write a long-form, professional, and engaging post suitable for LinkedIn. Use appropriate formatting and professional hashtags.';
    case Platform.TWITTER:
      return 'Write a short, punchy, and viral tweet (under 280 characters). Use trending hashtags and concise language.';
    case Platform.INSTAGRAM:
      return 'Write an engaging, visual-focused caption. Include a hook, value proposition, and a block of relevant, high-reach hashtags at the end.';
    case Platform.TIKTOK:
      return 'Write a catchy, viral-ready caption for a TikTok video. Include trending hashtags. Also, briefly describe the video concept or visual hook within the text.';
    case Platform.FACEBOOK:
      return 'Write an engaging, community-focused post for Facebook. Use a conversational tone that encourages likes, comments, and shares. Keep it relatable.';
    default:
      return '';
  }
};

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

const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  let lastError: Error | unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { status?: number; code?: number; message?: string };
      const isRateLimit =
        err?.status === 429 ||
        err?.code === 429 ||
        (err?.message && err.message.includes('429')) ||
        (err?.message && err.message.includes('quota'));

      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const generatePostContent = async (
  platform: Platform,
  idea: string,
  tone: Tone,
  brandVoice: BrandVoice,
  imageStyle?: ImageStyle
): Promise<GeneratedVariants> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const model = 'gemini-2.5-flash';

  let voiceInstructions = '';
  if (brandVoice.style || brandVoice.keywords || brandVoice.terminology) {
    voiceInstructions = `
    BRAND VOICE SETTINGS:
    - Style/Tone Examples: ${brandVoice.style || 'N/A'}
    - Keywords to Include: ${brandVoice.keywords || 'N/A'}
    - Preferred Terminology: ${brandVoice.terminology || 'N/A'}

    CRITICAL: You MUST adapt the content to strictly match this brand voice.`;
  }

  let imageStyleInstruction = '';
  if (imageStyle) {
    imageStyleInstruction = `The image description MUST reflect a "${imageStyle}" style. Describe the visual elements to match this aesthetic.`;
  }

  const systemInstruction = `You are an expert social media manager and analytics predictor.
  Your goal is to create content for ${platform} based on a user's idea.
  The general tone must be ${tone}.
  ${voiceInstructions}

  You must generate TWO distinct variations (Option A and Option B) for A/B testing.
  - Option A: Focus on the primary benefit or a direct approach.
  - Option B: Try a different angle, hook, or emotional appeal.

  For each variation:
  1. Provide a detailed, creative, and high-quality physical description for an image. ${imageStyleInstruction}
  2. PREDICT the engagement metrics (Likes, Shares, Comments, Reach) that this specific post text is likely to generate based on current platform trends.
  3. Provide a brief 'rationale' (1-2 sentences) explaining WHY this variation is predicted to perform this way.
  `;

  const prompt = `Topic: ${idea}\n\n${getPlatformInstructions(platform)}`;

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optionA: {
                type: Type.OBJECT,
                properties: {
                  postContent: { type: Type.STRING },
                  imageDescription: { type: Type.STRING },
                  rationale: {
                    type: Type.STRING,
                    description: 'Why this variant will perform well',
                  },
                  estimatedEngagement: {
                    type: Type.OBJECT,
                    properties: {
                      likes: { type: Type.INTEGER },
                      shares: { type: Type.INTEGER },
                      comments: { type: Type.INTEGER },
                      reach: { type: Type.INTEGER },
                    },
                    required: ['likes', 'shares', 'comments', 'reach'],
                  },
                },
                required: [
                  'postContent',
                  'imageDescription',
                  'estimatedEngagement',
                  'rationale',
                ],
              },
              optionB: {
                type: Type.OBJECT,
                properties: {
                  postContent: { type: Type.STRING },
                  imageDescription: { type: Type.STRING },
                  rationale: {
                    type: Type.STRING,
                    description: 'Why this variant will perform well',
                  },
                  estimatedEngagement: {
                    type: Type.OBJECT,
                    properties: {
                      likes: { type: Type.INTEGER },
                      shares: { type: Type.INTEGER },
                      comments: { type: Type.INTEGER },
                      reach: { type: Type.INTEGER },
                    },
                    required: ['likes', 'shares', 'comments', 'reach'],
                  },
                },
                required: [
                  'postContent',
                  'imageDescription',
                  'estimatedEngagement',
                  'rationale',
                ],
              },
            },
            required: ['optionA', 'optionB'],
          },
        },
      });
    });

    const json = JSON.parse(response.text || '{}');
    const defaultAnalytics = { likes: 0, shares: 0, comments: 0, reach: 0 };

    return {
      A: {
        text: json.optionA?.postContent || 'Failed to generate text for A.',
        imagePrompt:
          json.optionA?.imageDescription ||
          `A creative image representing ${idea}`,
        analytics: json.optionA?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionA?.rationale || 'Analysis not available.',
      },
      B: {
        text: json.optionB?.postContent || 'Failed to generate text for B.',
        imagePrompt:
          json.optionB?.imageDescription ||
          `A creative image representing ${idea}`,
        analytics: json.optionB?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionB?.rationale || 'Analysis not available.',
      },
    };
  } catch (error) {
    console.error(`Error generating text for ${platform}:`, error);
    throw new Error('Failed to generate post content.');
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  _resolution: ImageResolution = '1K'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Use gemini-2.0-flash-exp for image generation
  const model = 'gemini-2.0-flash-exp';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Generate an image: ${prompt}. Aspect ratio should be ${aspectRatio}.` }],
      },
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    // Find image in response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const partData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (partData.inlineData?.data) {
        const mimeType = partData.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${partData.inlineData.data}`;
      }
    }
    throw new Error('No image bytes returned');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const editImage = async (
  baseImageBase64: string,
  editPrompt: string,
  maskImageBase64?: string | null,
  referenceImageBase64?: string | null,
  _resolution: ImageResolution = '1K',
  _aspectRatio: AspectRatio = '1:1'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Use gemini-2.0-flash-exp for image editing (same as generation)
  const model = 'gemini-2.0-flash-exp';

  const parseBase64 = (str: string) => {
    const match = str.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error('Invalid image data format');
    return { mimeType: match[1], data: match[2] };
  };

  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

  // Add base image first
  const baseImg = parseBase64(baseImageBase64);
  parts.push({
    inlineData: { mimeType: baseImg.mimeType, data: baseImg.data },
  });

  // Add reference image if provided
  if (referenceImageBase64) {
    const refImg = parseBase64(referenceImageBase64);
    parts.push({
      inlineData: { mimeType: refImg.mimeType, data: refImg.data },
    });
  }

  // Add mask image if provided
  if (maskImageBase64) {
    const maskImg = parseBase64(maskImageBase64);
    parts.push({
      inlineData: { mimeType: maskImg.mimeType, data: maskImg.data },
    });
  }

  // Build edit prompt with context
  let finalPrompt = `Edit this image: ${editPrompt}`;
  if (maskImageBase64) {
    finalPrompt = `${finalPrompt}. A mask image is provided - only edit the white/highlighted areas of the mask, keeping the rest unchanged.`;
  }
  if (referenceImageBase64) {
    finalPrompt = `${finalPrompt}. Use the additional reference image for style or structural guidance.`;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts as any,
      },
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    // Find image in response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const partData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (partData.inlineData?.data) {
        const mimeType = partData.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${partData.inlineData.data}`;
      }
    }
    throw new Error('No edited image returned from the model');
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  imageUrl: string | null,
  aspectRatio: AspectRatio,
  style?: ImageStyle,
  resolution: ImageResolution = '1K'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  let veoAspectRatio = '16:9';
  if (aspectRatio === '3:4' || aspectRatio === '9:16') {
    veoAspectRatio = '9:16';
  }

  const fullPrompt = style ? `${prompt}. Visual Style: ${style}.` : prompt;
  // Resolution parameter reserved for future use
  void resolution;

  let imageInput = undefined;
  if (imageUrl) {
    const match = imageUrl.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      imageInput = {
        imageBytes: match[2],
        mimeType: match[1],
      };
    }
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: fullPrompt,
      image: imageInput,
      config: {
        numberOfVideos: 1,
        aspectRatio: veoAspectRatio as '16:9' | '9:16',
      },
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generation failed: No download URI');
    }

    const videoRes = await fetch(
      `${downloadLink}&key=${getApiKey()}`
    );
    if (!videoRes.ok) {
      const errorText = await videoRes.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to download video: ${videoRes.status} ${videoRes.statusText} - ${errorText}`
      );
    }

    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
};

// ============================================================================
// V3 API Functions for Image Editor Tool
// ============================================================================

import type {
  ImageModel,
  ImageResolutionV3,
  AspectRatioV3,
  VideoDuration,
  VideoResolution,
} from '../types/imageEditor';
import { MODEL_CONFIG, VIDEO_CONFIG } from '../types/imageEditor';

const parseBase64Image = (str: string) => {
  const match = str.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data format');
  return { mimeType: match[1], data: match[2] };
};

/**
 * Generate image using Gemini 3 Pro Image or Gemini 2.5 Flash Image
 * Pro: Up to 4K, 14 reference images
 * Flash: 1K, fast iterations
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
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelId = MODEL_CONFIG[config.model].id;
  const maxRefs = MODEL_CONFIG[config.model].maxReferenceImages;

  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

  // Add reference images (limited by model)
  const refs = (config.referenceImages || []).slice(0, maxRefs);
  for (const refImage of refs) {
    const parsed = parseBase64Image(refImage);
    parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
  }

  // Build prompt with context
  let fullPrompt = `Generate an image: ${prompt}`;
  if (refs.length > 0) {
    fullPrompt += `. Use the ${refs.length} reference image(s) provided for style and content guidance.`;
  }
  parts.push({ text: fullPrompt });

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: modelId,
        contents: { parts: parts as any },
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          // Note: aspectRatio and imageSize may need to be in a different config structure
          // depending on the actual API. Adjust as needed.
        } as any,
      });
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const partData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (partData.inlineData?.data) {
        const mimeType = partData.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${partData.inlineData.data}`;
      }
    }
    throw new Error('No image returned from model');
  } catch (error) {
    console.error('Error generating image V3:', error);
    throw error;
  }
};

/**
 * Edit image using Gemini 3 Pro Image or Gemini 2.5 Flash Image
 * Supports mask-based editing and reference images
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
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelId = MODEL_CONFIG[config.model].id;
  const maxRefs = MODEL_CONFIG[config.model].maxReferenceImages;

  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

  // Add base image
  const baseImg = parseBase64Image(baseImage);
  parts.push({ inlineData: { mimeType: baseImg.mimeType, data: baseImg.data } });

  // Add reference images
  const refs = (config.referenceImages || []).slice(0, maxRefs);
  for (const refImage of refs) {
    const parsed = parseBase64Image(refImage);
    parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
  }

  // Add mask if provided
  if (config.mask) {
    const maskImg = parseBase64Image(config.mask);
    parts.push({ inlineData: { mimeType: maskImg.mimeType, data: maskImg.data } });
  }

  // Build edit prompt
  let fullPrompt = `Edit this image: ${prompt}`;
  if (config.mask) {
    fullPrompt += `. A mask image is provided - only edit the white/highlighted areas of the mask, keeping the rest unchanged.`;
  }
  if (refs.length > 0) {
    fullPrompt += `. Use the ${refs.length} reference image(s) for style or structural guidance.`;
  }
  parts.push({ text: fullPrompt });

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: modelId,
        contents: { parts: parts as any },
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as any,
      });
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const partData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (partData.inlineData?.data) {
        const mimeType = partData.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${partData.inlineData.data}`;
      }
    }
    throw new Error('No edited image returned from model');
  } catch (error) {
    console.error('Error editing image V3:', error);
    throw error;
  }
};

/**
 * Generate video using Veo 3.1
 * Supports first/last frame, reference images, and native audio
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
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelId = config.fast ? VIDEO_CONFIG.fast.id : VIDEO_CONFIG.standard.id;

  // Prepare image input (first frame)
  let imageInput = undefined;
  if (config.firstFrame) {
    const match = config.firstFrame.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      imageInput = {
        imageBytes: match[2],
        mimeType: match[1],
      };
    }
  }

  // Prepare last frame if provided (for future API support)
  let _lastFrameInput = undefined;
  if (config.lastFrame) {
    const match = config.lastFrame.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      _lastFrameInput = {
        imageBytes: match[2],
        mimeType: match[1],
      };
    }
  }

  // Prepare reference images (up to 3 for Veo 3.1, for future API support)
  const _referenceInputs = (config.referenceImages || []).slice(0, 3).map((ref) => {
    const match = ref.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      return { imageBytes: match[2], mimeType: match[1] };
    }
    return null;
  }).filter(Boolean);

  // These variables are prepared for future Veo API enhancements
  void _lastFrameInput;
  void _referenceInputs;

  try {
    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt,
      image: imageInput,
      config: {
        numberOfVideos: 1,
        aspectRatio: config.aspectRatio,
        durationSeconds: config.duration,
        // Note: lastFrame and referenceImages may need specific API handling
        // Adjust based on actual Veo 3.1 API structure
      } as any,
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const operationName = operation.name || '';

    if (!downloadLink) {
      throw new Error('Video generation failed: No download URI');
    }

    // Download video
    const videoRes = await fetch(`${downloadLink}&key=${getApiKey()}`);
    if (!videoRes.ok) {
      const errorText = await videoRes.text().catch(() => 'Unknown error');
      throw new Error(`Failed to download video: ${videoRes.status} - ${errorText}`);
    }

    const blob = await videoRes.blob();
    const videoUrl = URL.createObjectURL(blob);

    return {
      videoUrl,
      operationName,
      audioIncluded: !config.fast, // Veo 3.1 standard includes audio
    };
  } catch (error) {
    console.error('Error generating video V31:', error);
    throw error;
  }
};

/**
 * Extend a previously generated video by up to 7 seconds
 * Can be called up to 20 times for a total of 148 seconds
 */
export const extendVideoV31 = async (
  _operationName: string,
  prompt: string,
  config: {
    aspectRatio: '16:9' | '9:16';
    extensionSeconds: number; // 1-7 seconds
    fast?: boolean;
  }
): Promise<{ videoUrl: string; operationName: string }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelId = config.fast ? VIDEO_CONFIG.fast.id : VIDEO_CONFIG.standard.id;

  // Clamp extension to 1-7 seconds
  const extensionDuration = Math.min(7, Math.max(1, config.extensionSeconds));

  try {
    // Note: Video extension API may have a specific method
    // This is a placeholder based on expected API structure
    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt: `Continue this video: ${prompt}`,
      config: {
        numberOfVideos: 1,
        aspectRatio: config.aspectRatio,
        durationSeconds: String(extensionDuration) as VideoDuration,
        // extensionOf: operationName, // May need specific parameter for extension
      } as any,
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const newOperationName = operation.name || '';

    if (!downloadLink) {
      throw new Error('Video extension failed: No download URI');
    }

    const videoRes = await fetch(`${downloadLink}&key=${getApiKey()}`);
    if (!videoRes.ok) {
      throw new Error(`Failed to download extended video: ${videoRes.status}`);
    }

    const blob = await videoRes.blob();
    const videoUrl = URL.createObjectURL(blob);

    return { videoUrl, operationName: newOperationName };
  } catch (error) {
    console.error('Error extending video V31:', error);
    throw error;
  }
};
