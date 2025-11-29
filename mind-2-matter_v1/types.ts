

export enum Tone {
  PROFESSIONAL = 'Professional',
  WITTY = 'Witty',
  URGENT = 'Urgent',
  INSPIRATIONAL = 'Inspirational',
  CASUAL = 'Casual'
}

export enum Platform {
  LINKEDIN = 'LinkedIn',
  TWITTER = 'Twitter/X',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  FACEBOOK = 'Facebook'
}

export enum ImageStyle {
  PHOTOREALISTIC = 'Photorealistic',
  ILLUSTRATION = 'Illustration',
  MINIMALIST = 'Minimalist',
  ABSTRACT = 'Abstract',
  CYBERPUNK = 'Cyberpunk',
  WATERCOLOR = 'Watercolor',
  CARTOON = 'Cartoon',
  CINEMATIC = 'Cinematic',
  VECTOR_ART = 'Vector Art',
  RENDER_3D = '3D Render',
  GOUACHE = 'Gouache Painting',
  PIXEL_ART = 'Pixel Art',
  ANIME = 'Anime'
}

export type ImageResolution = '1K' | '2K' | '4K';

export interface BrandVoice {
  style: string;
  keywords: string;
  terminology: string;
}

export interface AnalyticsMetrics {
  likes: number;
  shares: number;
  comments: number;
  reach: number;
}

export interface PostVariant {
  id: 'A' | 'B';
  content: string | null;
  imagePrompt: string;
  imageUrl: string | null;
  imageHistory: string[];
  videoUrl: string | null;
  isVideoLoading: boolean;
  analytics: AnalyticsMetrics;
  rationale?: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface GeneratedPost {
  platform: Platform;
  variants: {
    A: PostVariant;
    B: PostVariant;
  };
  selectedVariantId: 'A' | 'B';
  imageAspectRatio: '16:9' | '3:4' | '1:1' | '4:3' | '9:16';
  isLoading: boolean;
  isImageRegenerating?: boolean;
  error: string | null;
  scheduledDate: string | null; // ISO string
  status: PostStatus;
  publishedDate: string | null;
}

export interface GenerateRequest {
  idea: string;
  tone: Tone;
  brandVoice: BrandVoice;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: {
    idea: string;
    tone: Tone;
    imageStyle: ImageStyle;
    brandVoice: BrandVoice;
    posts: GeneratedPost[];
    selectedPlatforms: Platform[];
    imageResolution: ImageResolution;
  };
}

export interface PromptTemplate {
  id: string;
  title: string;
  idea: string;
  tone: Tone;
  imageStyle: ImageStyle;
  brandVoice: BrandVoice;
  createdAt: string;
}
