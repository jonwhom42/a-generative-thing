
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, Tone, BrandVoice, PostVariant, ImageStyle, AnalyticsMetrics, ImageResolution } from "../types";

// Helper to get specific instructions per platform
const getPlatformInstructions = (platform: Platform): string => {
  switch (platform) {
    case Platform.LINKEDIN:
      return "Write a long-form, professional, and engaging post suitable for LinkedIn. Use appropriate formatting and professional hashtags.";
    case Platform.TWITTER:
      return "Write a short, punchy, and viral tweet (under 280 characters). Use trending hashtags and concise language.";
    case Platform.INSTAGRAM:
      return "Write an engaging, visual-focused caption. Include a hook, value proposition, and a block of relevant, high-reach hashtags at the end.";
    case Platform.TIKTOK:
      return "Write a catchy, viral-ready caption for a TikTok video. Include trending hashtags. Also, briefly describe the video concept or visual hook within the text.";
    case Platform.FACEBOOK:
      return "Write an engaging, community-focused post for Facebook. Use a conversational tone that encourages likes, comments, and shares. Keep it relatable.";
    default:
      return "";
  }
};

interface GeneratedVariants {
  A: { text: string; imagePrompt: string; analytics: AnalyticsMetrics; rationale: string };
  B: { text: string; imagePrompt: string; analytics: AnalyticsMetrics; rationale: string };
}

// Helper for retrying operations with exponential backoff
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 2000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // Check for rate limit errors (429 or RESOURCE_EXHAUSTED)
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.status === "RESOURCE_EXHAUSTED" ||
        (error?.message && error.message.includes("429")) ||
        (error?.message && error.message.includes("quota"));

      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s
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
  // Initialize locally to ensure latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview"; // Using Pro for complex reasoning

  let voiceInstructions = "";
  if (brandVoice.style || brandVoice.keywords || brandVoice.terminology) {
    voiceInstructions = `
    BRAND VOICE SETTINGS:
    - Style/Tone Examples: ${brandVoice.style || "N/A"}
    - Keywords to Include: ${brandVoice.keywords || "N/A"}
    - Preferred Terminology: ${brandVoice.terminology || "N/A"}
    
    CRITICAL: You MUST adapt the content to strictly match this brand voice.`;
  }

  let imageStyleInstruction = "";
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
  3. Provide a brief 'rationale' (1-2 sentences) explaining WHY this variation is predicted to perform this way (e.g., "High emotional hook," "Use of listicle format," etc.).
  `;

  const prompt = `Topic: ${idea}\n\n${getPlatformInstructions(platform)}`;

  try {
    // Wrap generation in retry logic
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 32768 }, // Thinking mode enabled with max budget
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optionA: {
                type: Type.OBJECT,
                properties: {
                  postContent: { type: Type.STRING },
                  imageDescription: { type: Type.STRING },
                  rationale: { type: Type.STRING, description: "Why this variant will perform well" },
                  estimatedEngagement: {
                    type: Type.OBJECT,
                    properties: {
                      likes: { type: Type.INTEGER },
                      shares: { type: Type.INTEGER },
                      comments: { type: Type.INTEGER },
                      reach: { type: Type.INTEGER },
                    },
                    required: ["likes", "shares", "comments", "reach"]
                  }
                },
                required: ["postContent", "imageDescription", "estimatedEngagement", "rationale"],
              },
              optionB: {
                type: Type.OBJECT,
                properties: {
                  postContent: { type: Type.STRING },
                  imageDescription: { type: Type.STRING },
                  rationale: { type: Type.STRING, description: "Why this variant will perform well" },
                  estimatedEngagement: {
                    type: Type.OBJECT,
                    properties: {
                      likes: { type: Type.INTEGER },
                      shares: { type: Type.INTEGER },
                      comments: { type: Type.INTEGER },
                      reach: { type: Type.INTEGER },
                    },
                    required: ["likes", "shares", "comments", "reach"]
                  }
                },
                required: ["postContent", "imageDescription", "estimatedEngagement", "rationale"],
              },
            },
            required: ["optionA", "optionB"],
          },
        },
      });
    });

    const json = JSON.parse(response.text || "{}");
    
    // Fallback metrics if parsing fails
    const defaultAnalytics = { likes: 0, shares: 0, comments: 0, reach: 0 };

    return {
      A: {
        text: json.optionA?.postContent || "Failed to generate text for A.",
        imagePrompt: json.optionA?.imageDescription || `A creative image representing ${idea}`,
        analytics: json.optionA?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionA?.rationale || "Analysis not available."
      },
      B: {
        text: json.optionB?.postContent || "Failed to generate text for B.",
        imagePrompt: json.optionB?.imageDescription || `A creative image representing ${idea}`,
        analytics: json.optionB?.estimatedEngagement || defaultAnalytics,
        rationale: json.optionB?.rationale || "Analysis not available."
      }
    };
  } catch (error) {
    console.error(`Error generating text for ${platform}:`, error);
    throw new Error("Failed to generate post content.");
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: "16:9" | "3:4" | "1:1" | "4:3" | "9:16",
  resolution: ImageResolution = "1K"
): Promise<string> => {
  // Initialize locally to ensure latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use Flash for 1K (default) to ensure it works for everyone
  // Use Pro Image Preview only for 2K/4K which requires specific permissions
  const isHighRes = resolution === '2K' || resolution === '4K';
  const model = isHighRes ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

  try {
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    };
    
    // imageSize is only supported by the Pro Image model
    if (isHighRes) {
      config.imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config
    });

    // Iterate parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || "image/png";
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image bytes returned");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const editImage = async (
  baseImageBase64: string,
  editPrompt: string,
  maskImageBase64?: string | null,
  referenceImageBase64?: string | null,
  resolution: ImageResolution = "1K",
  aspectRatio: "16:9" | "3:4" | "1:1" | "4:3" | "9:16" = "1:1"
): Promise<string> => {
  // Initialize locally to ensure latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use Flash for 1K (default), Pro for 2K/4K
  const isHighRes = resolution === '2K' || resolution === '4K';
  const model = isHighRes ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

  // Extract base64 data and mime type from string "data:image/xyz;base64,....."
  const parseBase64 = (str: string) => {
    const match = str.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data format");
    return { mimeType: match[1], data: match[2] };
  };

  const parts: any[] = [];
  
  // 1. Original Image (Required)
  const baseImg = parseBase64(baseImageBase64);
  parts.push({
      inlineData: { mimeType: baseImg.mimeType, data: baseImg.data }
  });

  // 2. Reference Image (Optional) - Add before prompt
  if (referenceImageBase64) {
      const refImg = parseBase64(referenceImageBase64);
      parts.push({
          inlineData: { mimeType: refImg.mimeType, data: refImg.data }
      });
  }

  // 3. Mask (Optional)
  if (maskImageBase64) {
       const maskImg = parseBase64(maskImageBase64);
       parts.push({
           inlineData: { mimeType: maskImg.mimeType, data: maskImg.data }
       });
  }

  // 4. Prompt (Optional/Required)
  let finalPrompt = editPrompt;
  if (maskImageBase64) {
      finalPrompt = `${editPrompt}. (Use the provided mask to strictly limit edits to the masked area).`;
  }
  if (referenceImageBase64) {
      finalPrompt = `${finalPrompt}. (Use the provided additional image as a style or structural reference).`;
  }
  
  parts.push({ text: finalPrompt });

  try {
    const config: any = {
        imageConfig: {
            aspectRatio: aspectRatio,
        }
    };
    if (isHighRes) {
        config.imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts,
      },
      config
    });

    // Iterate parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned from the model");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  imageUrl: string | null,
  aspectRatio: "16:9" | "3:4" | "1:1" | "4:3" | "9:16",
  style?: ImageStyle,
  resolution: ImageResolution = "1K"
): Promise<string> => {
  // Create a NEW instance to ensure we pick up the potentially newly selected API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let veoAspectRatio = '16:9';
  if (aspectRatio === '3:4' || aspectRatio === '9:16') {
    veoAspectRatio = '9:16';
  }

  // Enhance prompt with style
  const fullPrompt = style ? `${prompt}. Visual Style: ${style}.` : prompt;

  // Map 2K/4K to 1080p for Veo, 1K to 720p
  const veoResolution = (resolution === '2K' || resolution === '4K') ? '1080p' : '720p';

  let imageInput = undefined;
  if (imageUrl) {
    const match = imageUrl.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      imageInput = {
        imageBytes: match[2],
        mimeType: match[1]
      };
    }
  }

  try {
    // We do NOT retry video automatically as it's a long running operation and quota is handled differently,
    // plus key selection flow handles the 404/auth errors.
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: fullPrompt,
      image: imageInput,
      config: {
        numberOfVideos: 1,
        resolution: veoResolution as any,
        aspectRatio: veoAspectRatio as any
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed: No download URI");
    }

    // Fetch the video content securely with key
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoRes.ok) {
        const errorText = await videoRes.text().catch(() => "Unknown error");
        throw new Error(`Failed to download video: ${videoRes.status} ${videoRes.statusText} - ${errorText}`);
    }
    
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};
