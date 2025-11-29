export const Tone = {
  PROFESSIONAL: 'Professional',
  WITTY: 'Witty',
  URGENT: 'Urgent',
  INSPIRATIONAL: 'Inspirational',
  CASUAL: 'Casual',
} as const;
export type Tone = (typeof Tone)[keyof typeof Tone];

export const Platform = {
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter/X',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ImageStyle = {
  PHOTOREALISTIC: 'Photorealistic',
  ILLUSTRATION: 'Illustration',
  MINIMALIST: 'Minimalist',
  ABSTRACT: 'Abstract',
  CYBERPUNK: 'Cyberpunk',
  WATERCOLOR: 'Watercolor',
  CARTOON: 'Cartoon',
  CINEMATIC: 'Cinematic',
  VECTOR_ART: 'Vector Art',
  RENDER_3D: '3D Render',
  GOUACHE: 'Gouache Painting',
  PIXEL_ART: 'Pixel Art',
  ANIME: 'Anime',
} as const;
export type ImageStyle = (typeof ImageStyle)[keyof typeof ImageStyle];

export type ImageResolution = '1K' | '2K' | '4K';

export type AspectRatio = '16:9' | '3:4' | '1:1' | '4:3' | '9:16';

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
  imageAspectRatio: AspectRatio;
  imageResolution: ImageResolution;
  isLoading: boolean;
  isImageRegenerating?: boolean;
  error: string | null;
  scheduledDate: string | null;
  status: PostStatus;
  publishedDate: string | null;
}

export interface GeneratorState {
  idea: string;
  tone: Tone;
  imageStyle: ImageStyle;
  imageResolution: ImageResolution;
  brandVoice: BrandVoice;
  selectedPlatforms: Platform[];
  posts: GeneratedPost[];
  isGenerating: boolean;
}

export const DEFAULT_BRAND_VOICE: BrandVoice = {
  style: '',
  keywords: '',
  terminology: '',
};

export const DEFAULT_GENERATOR_STATE: GeneratorState = {
  idea: '',
  tone: Tone.PROFESSIONAL,
  imageStyle: ImageStyle.PHOTOREALISTIC,
  imageResolution: '1K',
  brandVoice: DEFAULT_BRAND_VOICE,
  selectedPlatforms: [Platform.LINKEDIN],
  posts: [],
  isGenerating: false,
};

export const createEmptyPost = (platform: Platform): GeneratedPost => ({
  platform,
  variants: {
    A: {
      id: 'A',
      content: null,
      imagePrompt: '',
      imageUrl: null,
      imageHistory: [],
      videoUrl: null,
      isVideoLoading: false,
      analytics: { likes: 0, shares: 0, comments: 0, reach: 0 },
    },
    B: {
      id: 'B',
      content: null,
      imagePrompt: '',
      imageUrl: null,
      imageHistory: [],
      videoUrl: null,
      isVideoLoading: false,
      analytics: { likes: 0, shares: 0, comments: 0, reach: 0 },
    },
  },
  selectedVariantId: 'A',
  imageAspectRatio: '1:1',
  imageResolution: '1K',
  isLoading: true,
  error: null,
  scheduledDate: null,
  status: 'draft',
  publishedDate: null,
});
