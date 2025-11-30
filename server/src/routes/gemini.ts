/**
 * Gemini API Proxy Routes
 *
 * All endpoints require Clerk authentication.
 * The Gemini API key is stored server-side only.
 *
 * Endpoints:
 * - POST /api/gemini/generate-post-content
 * - POST /api/gemini/generate-image
 * - POST /api/gemini/edit-image
 * - POST /api/gemini/generate-video
 * - POST /api/gemini/generate-image-v3
 * - POST /api/gemini/edit-image-v3
 * - POST /api/gemini/generate-video-v31
 * - POST /api/gemini/extend-video-v31
 */

import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { requireAuth } from '../middleware/auth';
import { rateLimitGemini } from '../middleware/rateLimit';

const router = Router();

// Apply authentication to all routes, then rate limiting
router.use(requireAuth);
router.use(rateLimitGemini);

// Initialize Gemini client with server-side key
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper for retry logic
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

// Helper to parse base64 image data
const parseBase64Image = (str: string) => {
  const match = str.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data format');
  return { mimeType: match[1], data: match[2] };
};

// Platform instructions helper
const getPlatformInstructions = (platform: string): string => {
  switch (platform) {
    case 'LinkedIn':
      return 'Write a long-form, professional, and engaging post suitable for LinkedIn. Use appropriate formatting and professional hashtags.';
    case 'Twitter':
      return 'Write a short, punchy, and viral tweet (under 280 characters). Use trending hashtags and concise language.';
    case 'Instagram':
      return 'Write an engaging, visual-focused caption. Include a hook, value proposition, and a block of relevant, high-reach hashtags at the end.';
    case 'TikTok':
      return 'Write a catchy, viral-ready caption for a TikTok video. Include trending hashtags. Also, briefly describe the video concept or visual hook within the text.';
    case 'Facebook':
      return 'Write an engaging, community-focused post for Facebook. Use a conversational tone that encourages likes, comments, and shares. Keep it relatable.';
    default:
      return '';
  }
};

// ============================================================================
// POST /api/gemini/generate-post-content
// Used by: PostGenerator
// ============================================================================
router.post('/generate-post-content', async (req: Request, res: Response) => {
  try {
    const { platform, idea, tone, brandVoice, imageStyle } = req.body;

    if (!platform || !idea || !tone) {
      res.status(400).json({ error: 'Missing required fields: platform, idea, tone' });
      return;
    }

    const ai = getGeminiClient();
    const model = 'gemini-2.5-flash';

    let voiceInstructions = '';
    if (brandVoice?.style || brandVoice?.keywords || brandVoice?.terminology) {
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
                  rationale: { type: Type.STRING },
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
                required: ['postContent', 'imageDescription', 'estimatedEngagement', 'rationale'],
              },
              optionB: {
                type: Type.OBJECT,
                properties: {
                  postContent: { type: Type.STRING },
                  imageDescription: { type: Type.STRING },
                  rationale: { type: Type.STRING },
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
                required: ['postContent', 'imageDescription', 'estimatedEngagement', 'rationale'],
              },
            },
            required: ['optionA', 'optionB'],
          },
        },
      });
    });

    const json = JSON.parse(response.text || '{}');
    const defaultAnalytics = { likes: 0, shares: 0, comments: 0, reach: 0 };

    res.json({
      A: {
        text: json.optionA?.postContent || 'Failed to generate text for A.',
        imagePrompt: json.optionA?.imageDescription || `A creative image representing ${idea}`,
        analytics: json.optionA?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionA?.rationale || 'Analysis not available.',
      },
      B: {
        text: json.optionB?.postContent || 'Failed to generate text for B.',
        imagePrompt: json.optionB?.imageDescription || `A creative image representing ${idea}`,
        analytics: json.optionB?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionB?.rationale || 'Analysis not available.',
      },
    });
  } catch (error) {
    console.error('Error generating post content:', error);
    res.status(500).json({ error: 'Failed to generate post content' });
  }
});

// ============================================================================
// POST /api/gemini/generate-image
// Used by: PostGenerator
// ============================================================================
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Missing required field: prompt' });
      return;
    }

    const ai = getGeminiClient();
    const model = 'gemini-2.0-flash-exp';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Generate an image: ${prompt}. Aspect ratio should be ${aspectRatio || '1:1'}.` }],
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
        res.json({ imageUrl: `data:${mimeType};base64,${partData.inlineData.data}` });
        return;
      }
    }

    res.status(500).json({ error: 'No image returned from model' });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// ============================================================================
// POST /api/gemini/edit-image
// Used by: PostGenerator
// ============================================================================
router.post('/edit-image', async (req: Request, res: Response) => {
  try {
    const { baseImageBase64, editPrompt, maskImageBase64, referenceImageBase64 } = req.body;

    if (!baseImageBase64 || !editPrompt) {
      res.status(400).json({ error: 'Missing required fields: baseImageBase64, editPrompt' });
      return;
    }

    const ai = getGeminiClient();
    const model = 'gemini-2.0-flash-exp';

    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];

    // Add base image first
    const baseImg = parseBase64Image(baseImageBase64);
    parts.push({ inlineData: { mimeType: baseImg.mimeType, data: baseImg.data } });

    // Add reference image if provided
    if (referenceImageBase64) {
      const refImg = parseBase64Image(referenceImageBase64);
      parts.push({ inlineData: { mimeType: refImg.mimeType, data: refImg.data } });
    }

    // Add mask image if provided
    if (maskImageBase64) {
      const maskImg = parseBase64Image(maskImageBase64);
      parts.push({ inlineData: { mimeType: maskImg.mimeType, data: maskImg.data } });
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

    const response = await ai.models.generateContent({
      model,
      contents: { parts } as any,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    // Find image in response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const partData = part as { inlineData?: { mimeType?: string; data?: string } };
      if (partData.inlineData?.data) {
        const mimeType = partData.inlineData.mimeType || 'image/png';
        res.json({ imageUrl: `data:${mimeType};base64,${partData.inlineData.data}` });
        return;
      }
    }

    res.status(500).json({ error: 'No edited image returned from model' });
  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ error: 'Failed to edit image' });
  }
});

// ============================================================================
// POST /api/gemini/generate-video
// Used by: PostGenerator
// ============================================================================
router.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, imageUrl, aspectRatio, style } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Missing required field: prompt' });
      return;
    }

    const ai = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY!;

    let veoAspectRatio = '16:9';
    if (aspectRatio === '3:4' || aspectRatio === '9:16') {
      veoAspectRatio = '9:16';
    }

    const fullPrompt = style ? `${prompt}. Visual Style: ${style}.` : prompt;

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

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: fullPrompt,
      image: imageInput,
      config: {
        numberOfVideos: 1,
        aspectRatio: veoAspectRatio as '16:9' | '9:16',
      },
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      res.status(500).json({ error: 'Video generation failed: No download URI' });
      return;
    }

    // Download video on server side (with API key)
    const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoRes.ok) {
      const errorText = await videoRes.text().catch(() => 'Unknown error');
      res.status(500).json({ error: `Failed to download video: ${videoRes.status} - ${errorText}` });
      return;
    }

    // Convert to base64 and send to client
    const arrayBuffer = await videoRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';

    res.json({ videoUrl: `data:${contentType};base64,${base64}` });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

// ============================================================================
// POST /api/gemini/generate-image-v3
// Used by: ImageEditor
// ============================================================================
router.post('/generate-image-v3', async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;

    if (!prompt || !config) {
      res.status(400).json({ error: 'Missing required fields: prompt, config' });
      return;
    }

    const ai = getGeminiClient();

    // Model config mapping
    const MODEL_CONFIG: Record<string, { id: string; maxReferenceImages: number }> = {
      pro: { id: 'gemini-3-pro-image-preview', maxReferenceImages: 14 },
      flash: { id: 'gemini-2.5-flash-image', maxReferenceImages: 1 },
    };

    const modelConfig = MODEL_CONFIG[config.model] || MODEL_CONFIG.pro;
    const modelId = modelConfig.id;
    const maxRefs = modelConfig.maxReferenceImages;

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

    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: modelId,
        contents: { parts } as any,
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
        res.json({ imageUrl: `data:${mimeType};base64,${partData.inlineData.data}` });
        return;
      }
    }

    res.status(500).json({ error: 'No image returned from model' });
  } catch (error) {
    console.error('Error generating image V3:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// ============================================================================
// POST /api/gemini/edit-image-v3
// Used by: ImageEditor
// ============================================================================
router.post('/edit-image-v3', async (req: Request, res: Response) => {
  try {
    const { baseImage, prompt, config } = req.body;

    if (!baseImage || !prompt || !config) {
      res.status(400).json({ error: 'Missing required fields: baseImage, prompt, config' });
      return;
    }

    const ai = getGeminiClient();

    const MODEL_CONFIG: Record<string, { id: string; maxReferenceImages: number }> = {
      pro: { id: 'gemini-3-pro-image-preview', maxReferenceImages: 14 },
      flash: { id: 'gemini-2.5-flash-image', maxReferenceImages: 1 },
    };

    const modelConfig = MODEL_CONFIG[config.model] || MODEL_CONFIG.pro;
    const modelId = modelConfig.id;
    const maxRefs = modelConfig.maxReferenceImages;

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

    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: modelId,
        contents: { parts } as any,
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
        res.json({ imageUrl: `data:${mimeType};base64,${partData.inlineData.data}` });
        return;
      }
    }

    res.status(500).json({ error: 'No edited image returned from model' });
  } catch (error) {
    console.error('Error editing image V3:', error);
    res.status(500).json({ error: 'Failed to edit image' });
  }
});

// ============================================================================
// POST /api/gemini/generate-video-v31
// Used by: ImageEditor
// ============================================================================
router.post('/generate-video-v31', async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;

    if (!prompt || !config) {
      res.status(400).json({ error: 'Missing required fields: prompt, config' });
      return;
    }

    const ai = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY!;

    const VIDEO_CONFIG: Record<string, { id: string }> = {
      standard: { id: 'veo-3.1-generate-preview' },
      fast: { id: 'veo-3.1-fast-generate-preview' },
    };

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

    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt,
      image: imageInput,
      config: {
        numberOfVideos: 1,
        aspectRatio: config.aspectRatio,
        durationSeconds: config.duration,
      } as Parameters<typeof ai.models.generateVideos>[0]['config'],
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const operationName = operation.name || '';

    if (!downloadLink) {
      res.status(500).json({ error: 'Video generation failed: No download URI' });
      return;
    }

    // Download video on server side
    const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoRes.ok) {
      const errorText = await videoRes.text().catch(() => 'Unknown error');
      res.status(500).json({ error: `Failed to download video: ${videoRes.status} - ${errorText}` });
      return;
    }

    // Convert to base64 and send to client
    const arrayBuffer = await videoRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';

    res.json({
      videoUrl: `data:${contentType};base64,${base64}`,
      operationName,
      audioIncluded: !config.fast,
    });
  } catch (error) {
    console.error('Error generating video V31:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

// ============================================================================
// POST /api/gemini/extend-video-v31
// Used by: ImageEditor
// ============================================================================
router.post('/extend-video-v31', async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;

    if (!prompt || !config) {
      res.status(400).json({ error: 'Missing required fields: prompt, config' });
      return;
    }

    const ai = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY!;

    const VIDEO_CONFIG: Record<string, { id: string }> = {
      standard: { id: 'veo-3.1-generate-preview' },
      fast: { id: 'veo-3.1-fast-generate-preview' },
    };

    const modelId = config.fast ? VIDEO_CONFIG.fast.id : VIDEO_CONFIG.standard.id;

    // Clamp extension to 1-7 seconds
    const extensionDuration = Math.min(7, Math.max(1, config.extensionSeconds || 4));

    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt: `Continue this video: ${prompt}`,
      config: {
        numberOfVideos: 1,
        aspectRatio: config.aspectRatio,
        durationSeconds: extensionDuration,
      } as Parameters<typeof ai.models.generateVideos>[0]['config'],
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const newOperationName = operation.name || '';

    if (!downloadLink) {
      res.status(500).json({ error: 'Video extension failed: No download URI' });
      return;
    }

    const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoRes.ok) {
      res.status(500).json({ error: `Failed to download extended video: ${videoRes.status}` });
      return;
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';

    res.json({
      videoUrl: `data:${contentType};base64,${base64}`,
      operationName: newOperationName,
    });
  } catch (error) {
    console.error('Error extending video V31:', error);
    res.status(500).json({ error: 'Failed to extend video' });
  }
});

// ============================================================================
// POST /api/gemini/chat
// Used by: ChatBot component
// Features: Function calling, Google Search grounding
// ============================================================================

// Define function declarations for app control
const chatFunctionDeclarations = [
  {
    name: 'createProject',
    description: 'Create a new project in the branding app',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the project' },
        description: { type: 'string', description: 'Description of the project' },
        stage: {
          type: 'string',
          enum: ['concept', 'development', 'testing', 'active', 'archived'],
          description: 'Current stage of the project',
        },
        targetAudience: { type: 'string', description: 'Target audience for the project' },
      },
      required: ['name'],
    },
  },
  {
    name: 'updateProject',
    description: 'Update an existing project',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the project to update' },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            stage: { type: 'string' },
            targetAudience: { type: 'string' },
          },
        },
      },
      required: ['id', 'updates'],
    },
  },
  {
    name: 'deleteProject',
    description: 'Delete a project',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the project to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'createIdea',
    description: 'Create a new idea within a project',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project to add the idea to' },
        title: { type: 'string', description: 'Title of the idea' },
        summary: { type: 'string', description: 'Summary of the idea' },
        stage: {
          type: 'string',
          enum: ['draft', 'reviewing', 'approved', 'rejected', 'implemented'],
          description: 'Current stage of the idea',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the idea',
        },
        problem: { type: 'string', description: 'Problem the idea addresses' },
        audience: { type: 'string', description: 'Target audience for the idea' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'updateIdea',
    description: 'Update an existing idea',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the idea to update' },
        updates: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            stage: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['id', 'updates'],
    },
  },
  {
    name: 'deleteIdea',
    description: 'Delete an idea',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the idea to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'createExperiment',
    description: 'Create a new experiment for an idea',
    parameters: {
      type: 'object',
      properties: {
        ideaId: { type: 'string', description: 'ID of the idea to create the experiment for' },
        name: { type: 'string', description: 'Name of the experiment' },
        hypothesis: { type: 'string', description: 'Hypothesis being tested' },
        method: { type: 'string', description: 'Method of the experiment' },
        channel: {
          type: 'string',
          enum: ['LinkedIn', 'Twitter', 'Instagram', 'TikTok', 'Facebook', 'Other'],
          description: 'Social media channel for the experiment',
        },
        status: {
          type: 'string',
          enum: ['draft', 'running', 'paused', 'completed', 'cancelled'],
          description: 'Status of the experiment',
        },
      },
      required: ['ideaId', 'name'],
    },
  },
  {
    name: 'updateExperiment',
    description: 'Update an existing experiment',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the experiment to update' },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string' },
            hypothesis: { type: 'string' },
            method: { type: 'string' },
            channel: { type: 'string' },
          },
        },
      },
      required: ['id', 'updates'],
    },
  },
];

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, appContext } = req.body;

    console.log('Chat endpoint called');

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing required field: messages (array)' });
      return;
    }

    const ai = getGeminiClient();
    const model = 'gemini-2.5-flash';

    // Build system instruction with app context
    const systemInstruction = `You are a helpful branding and marketing assistant integrated into a branding app. You have full access to the user's projects, ideas, and experiments.

CURRENT APP DATA:
${JSON.stringify(appContext || {}, null, 2)}

YOUR CAPABILITIES:
1. **Project Management**: Help users manage their projects
2. **Idea Management**: Help users brainstorm and organize ideas
3. **Experiment Management**: Help users plan A/B testing experiments
4. **Content Advice**: Provide guidance on branding, marketing, social media strategy

Be helpful, concise, and proactive in your responses.`;

    // Convert messages to Gemini format - ensure proper structure
    const geminiContents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    console.log('Calling Gemini API...');

    // Simple chat request without function calling first
    const response = await ai.models.generateContent({
      model,
      contents: geminiContents,
      config: {
        systemInstruction,
      },
    });

    console.log('Gemini response received');

    // Extract text from response
    const responseText = response.text || '';

    console.log('Response text length:', responseText.length);

    res.json({
      response: responseText || 'I apologize, but I could not generate a response.',
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to process chat request: ${errorMessage}` });
  }
});

export { router as geminiRouter };
