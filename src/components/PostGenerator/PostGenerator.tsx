import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Typography, Alert, Snackbar, Chip } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import GeneratorControls from './GeneratorControls';
import PlatformCard from './PlatformCard';
import {
  DEFAULT_GENERATOR_STATE,
  createEmptyPost,
  Platform,
} from '../../types/postGenerator';
import type {
  GeneratorState,
  GeneratedPost,
} from '../../types/postGenerator';
import {
  generatePostContent,
  generateImage,
  generateVideo,
  editImage,
} from '../../services/gemini';
import { useStorage } from '../../context/StorageContext';
import type { StoredPost, StoredPostVariant } from '../../types/storage';
import { generatePostId } from '../../types/storage';

// Track save state per platform
interface SaveState {
  [platform: string]: {
    id: string | null;
    isSaving: boolean;
    isSaved: boolean;
  };
}

const PostGenerator = () => {
  const [searchParams] = useSearchParams();
  const { status, savePost, getPost, loadImage, loadVideo } = useStorage();
  const isStorageConnected = status === 'connected';

  // Extract idea context from URL params
  const ideaIdFromUrl = searchParams.get('ideaId');
  const ideaTitleFromUrl = searchParams.get('ideaTitle');
  const ideaSummaryFromUrl = searchParams.get('ideaSummary');

  // Build initial state with idea context if present
  const initialState = useMemo(() => {
    if (ideaTitleFromUrl || ideaSummaryFromUrl) {
      const ideaPrompt = ideaSummaryFromUrl
        ? `${ideaTitleFromUrl || ''}\n\n${ideaSummaryFromUrl}`
        : ideaTitleFromUrl || '';
      return {
        ...DEFAULT_GENERATOR_STATE,
        idea: ideaPrompt.trim(),
      };
    }
    return DEFAULT_GENERATOR_STATE;
  }, [ideaTitleFromUrl, ideaSummaryFromUrl]);

  const [state, setState] = useState<GeneratorState>(initialState);
  const [saveStates, setSaveStates] = useState<SaveState>({});
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Load post from storage if URL has ?load=id
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId && isStorageConnected) {
      loadPostFromStorage(loadId);
    }
  }, [searchParams, isStorageConnected]);

  const loadPostFromStorage = async (id: string) => {
    try {
      const storedPost = await getPost(id);
      if (!storedPost) {
        showToast('Post not found', 'error');
        return;
      }

      // Convert StoredPost back to GeneratedPost
      const loadedPost: GeneratedPost = {
        platform: storedPost.platform,
        isLoading: false,
        error: null,
        selectedVariantId: storedPost.selectedVariantId,
        variants: {
          A: {
            id: 'A',
            content: storedPost.variants.A.content,
            imagePrompt: storedPost.variants.A.imagePrompt,
            imageUrl: null,
            imageHistory: [],
            videoUrl: null,
            isVideoLoading: false,
            analytics: storedPost.variants.A.analytics,
            rationale: storedPost.variants.A.rationale,
          },
          B: {
            id: 'B',
            content: storedPost.variants.B.content,
            imagePrompt: storedPost.variants.B.imagePrompt,
            imageUrl: null,
            imageHistory: [],
            videoUrl: null,
            isVideoLoading: false,
            analytics: storedPost.variants.B.analytics,
            rationale: storedPost.variants.B.rationale,
          },
        },
        imageAspectRatio: storedPost.imageAspectRatio,
        imageResolution: storedPost.imageResolution,
        isImageRegenerating: false,
        scheduledDate: storedPost.scheduledDate,
        status: storedPost.status,
        publishedDate: storedPost.publishedDate,
      };

      // Full path prefix for this post's files
      const postPath = `posts/${storedPost.id}`;

      // Load images for variant A
      if (storedPost.variants.A.imagePath) {
        const imgA = await loadImage(`${postPath}/${storedPost.variants.A.imagePath}`);
        if (imgA) loadedPost.variants.A.imageUrl = imgA;
      }
      for (const histPath of storedPost.variants.A.imageHistoryPaths) {
        const histImg = await loadImage(`${postPath}/${histPath}`);
        if (histImg) loadedPost.variants.A.imageHistory.push(histImg);
      }
      if (storedPost.variants.A.videoPath) {
        const vidA = await loadVideo(`${postPath}/${storedPost.variants.A.videoPath}`);
        if (vidA) loadedPost.variants.A.videoUrl = vidA;
      }

      // Load images for variant B
      if (storedPost.variants.B.imagePath) {
        const imgB = await loadImage(`${postPath}/${storedPost.variants.B.imagePath}`);
        if (imgB) loadedPost.variants.B.imageUrl = imgB;
      }
      for (const histPath of storedPost.variants.B.imageHistoryPaths) {
        const histImg = await loadImage(`${postPath}/${histPath}`);
        if (histImg) loadedPost.variants.B.imageHistory.push(histImg);
      }
      if (storedPost.variants.B.videoPath) {
        const vidB = await loadVideo(`${postPath}/${storedPost.variants.B.videoPath}`);
        if (vidB) loadedPost.variants.B.videoUrl = vidB;
      }

      // Update state
      setState((prev) => ({
        ...prev,
        idea: storedPost.idea,
        tone: storedPost.tone,
        imageStyle: storedPost.imageStyle,
        brandVoice: storedPost.brandVoice,
        selectedPlatforms: [storedPost.platform],
        posts: [loadedPost],
      }));

      // Mark as saved
      setSaveStates({
        [storedPost.platform]: {
          id: storedPost.id,
          isSaving: false,
          isSaved: true,
        },
      });

      showToast('Post loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to load post:', error);
      showToast('Failed to load post', 'error');
    }
  };

  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'info' = 'info'
  ) => {
    setToast({ open: true, message, severity });
  };

  const handleStateChange = useCallback(
    (updates: Partial<GeneratorState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!state.idea.trim() || state.selectedPlatforms.length === 0) {
      showToast('Please enter an idea and select at least one platform', 'error');
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true }));

    // Create empty posts for each platform
    const newPosts: GeneratedPost[] = state.selectedPlatforms.map((platform) =>
      createEmptyPost(platform)
    );
    setState((prev) => ({ ...prev, posts: newPosts }));

    // Generate content for each platform
    for (let i = 0; i < state.selectedPlatforms.length; i++) {
      const platform = state.selectedPlatforms[i];

      try {
        // Generate text content
        const variants = await generatePostContent(
          platform,
          state.idea,
          state.tone,
          state.brandVoice,
          state.imageStyle
        );

        // Update post with generated content
        setState((prev) => {
          const updatedPosts = [...prev.posts];
          const postIndex = updatedPosts.findIndex(
            (p) => p.platform === platform
          );
          if (postIndex !== -1) {
            updatedPosts[postIndex] = {
              ...updatedPosts[postIndex],
              isLoading: false,
              variants: {
                A: {
                  ...updatedPosts[postIndex].variants.A,
                  content: variants.A.text,
                  imagePrompt: variants.A.imagePrompt,
                  analytics: variants.A.analytics,
                  rationale: variants.A.rationale,
                },
                B: {
                  ...updatedPosts[postIndex].variants.B,
                  content: variants.B.text,
                  imagePrompt: variants.B.imagePrompt,
                  analytics: variants.B.analytics,
                  rationale: variants.B.rationale,
                },
              },
            };
          }
          return { ...prev, posts: updatedPosts };
        });

        // Generate images for both variants
        try {
          const [imageA, imageB] = await Promise.all([
            generateImage(variants.A.imagePrompt, '1:1', state.imageResolution),
            generateImage(variants.B.imagePrompt, '1:1', state.imageResolution),
          ]);

          setState((prev) => {
            const updatedPosts = [...prev.posts];
            const postIndex = updatedPosts.findIndex(
              (p) => p.platform === platform
            );
            if (postIndex !== -1) {
              updatedPosts[postIndex] = {
                ...updatedPosts[postIndex],
                variants: {
                  A: {
                    ...updatedPosts[postIndex].variants.A,
                    imageUrl: imageA,
                    imageHistory: [imageA],
                  },
                  B: {
                    ...updatedPosts[postIndex].variants.B,
                    imageUrl: imageB,
                    imageHistory: [imageB],
                  },
                },
              };
            }
            return { ...prev, posts: updatedPosts };
          });
        } catch (imageError) {
          console.error('Image generation error:', imageError);
          // Continue without images
        }
      } catch (error) {
        console.error(`Error generating for ${platform}:`, error);
        setState((prev) => {
          const updatedPosts = [...prev.posts];
          const postIndex = updatedPosts.findIndex(
            (p) => p.platform === platform
          );
          if (postIndex !== -1) {
            updatedPosts[postIndex] = {
              ...updatedPosts[postIndex],
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to generate content',
            };
          }
          return { ...prev, posts: updatedPosts };
        });
      }
    }

    setState((prev) => ({ ...prev, isGenerating: false }));
    showToast('Content generation complete!', 'success');
  }, [state.idea, state.selectedPlatforms, state.tone, state.brandVoice, state.imageStyle, state.imageResolution]);

  const handleUpdatePost = useCallback(
    (platform: Platform, updates: Partial<GeneratedPost>) => {
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((post) =>
          post.platform === platform ? { ...post, ...updates } : post
        ),
      }));
    },
    []
  );

  const handleUpdateContent = useCallback(
    (platform: Platform, variantId: 'A' | 'B', content: string) => {
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((post) => {
          if (post.platform !== platform) return post;
          return {
            ...post,
            variants: {
              ...post.variants,
              [variantId]: {
                ...post.variants[variantId],
                content,
              },
            },
          };
        }),
      }));
    },
    []
  );

  const handleRegenerateImage = useCallback(
    async (platform: Platform, variantId: 'A' | 'B') => {
      const post = state.posts.find((p) => p.platform === platform);
      if (!post) return;

      const variant = post.variants[variantId];

      // Set loading state
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.platform === platform ? { ...p, isImageRegenerating: true } : p
        ),
      }));

      try {
        const newImage = await generateImage(
          variant.imagePrompt,
          post.imageAspectRatio,
          post.imageResolution
        );

        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.platform !== platform) return p;
            return {
              ...p,
              isImageRegenerating: false,
              variants: {
                ...p.variants,
                [variantId]: {
                  ...p.variants[variantId],
                  imageUrl: newImage,
                  imageHistory: [...p.variants[variantId].imageHistory, newImage],
                },
              },
            };
          }),
        }));
        showToast('Image regenerated!', 'success');
      } catch (error) {
        console.error('Image regeneration error:', error);
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.platform === platform ? { ...p, isImageRegenerating: false } : p
          ),
        }));
        showToast('Failed to regenerate image', 'error');
      }
    },
    [state.posts]
  );

  const handleEditImage = useCallback(
    async (
      platform: Platform,
      variantId: 'A' | 'B',
      editPrompt: string,
      maskBase64: string | null,
      referenceBase64: string | null
    ) => {
      const post = state.posts.find((p) => p.platform === platform);
      if (!post) return;

      const variant = post.variants[variantId];
      if (!variant.imageUrl) {
        showToast('No image to edit', 'error');
        return;
      }

      // Set editing state
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.platform === platform ? { ...p, isImageRegenerating: true } : p
        ),
      }));

      try {
        const editedImage = await editImage(
          variant.imageUrl,
          editPrompt,
          maskBase64,
          referenceBase64,
          post.imageResolution,
          post.imageAspectRatio
        );

        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.platform !== platform) return p;
            return {
              ...p,
              isImageRegenerating: false,
              variants: {
                ...p.variants,
                [variantId]: {
                  ...p.variants[variantId],
                  imageUrl: editedImage,
                  imageHistory: [...p.variants[variantId].imageHistory, editedImage],
                },
              },
            };
          }),
        }));
        showToast('Image edited successfully!', 'success');
      } catch (error) {
        console.error('Image edit error:', error);
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.platform === platform ? { ...p, isImageRegenerating: false } : p
          ),
        }));
        showToast('Failed to edit image', 'error');
      }
    },
    [state.posts]
  );

  const handleGenerateVideo = useCallback(
    async (platform: Platform, variantId: 'A' | 'B') => {
      const post = state.posts.find((p) => p.platform === platform);
      if (!post) return;

      const variant = post.variants[variantId];
      if (!variant.imageUrl) {
        showToast('Generate an image first', 'error');
        return;
      }

      // Set video loading state
      setState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.platform !== platform) return p;
          return {
            ...p,
            variants: {
              ...p.variants,
              [variantId]: {
                ...p.variants[variantId],
                isVideoLoading: true,
              },
            },
          };
        }),
      }));

      try {
        const videoUrl = await generateVideo(
          variant.imagePrompt,
          variant.imageUrl,
          post.imageAspectRatio,
          state.imageStyle,
          post.imageResolution
        );

        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.platform !== platform) return p;
            return {
              ...p,
              variants: {
                ...p.variants,
                [variantId]: {
                  ...p.variants[variantId],
                  videoUrl,
                  isVideoLoading: false,
                },
              },
            };
          }),
        }));
        showToast('Video generated!', 'success');
      } catch (error) {
        console.error('Video generation error:', error);
        setState((prev) => ({
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.platform !== platform) return p;
            return {
              ...p,
              variants: {
                ...p.variants,
                [variantId]: {
                  ...p.variants[variantId],
                  isVideoLoading: false,
                },
              },
            };
          }),
        }));
        showToast('Failed to generate video', 'error');
      }
    },
    [state.posts, state.imageStyle]
  );

  // Save post to storage
  const handleSavePost = useCallback(
    async (platform: Platform) => {
      if (!isStorageConnected) {
        showToast('Storage not connected', 'error');
        return;
      }

      const post = state.posts.find((p) => p.platform === platform);
      if (!post) return;

      // Set saving state
      setSaveStates((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], isSaving: true, isSaved: false },
      }));

      try {
        // Generate or reuse existing ID
        const postId = saveStates[platform]?.id || generatePostId();

        // Helper to convert variant
        const convertVariant = (variant: typeof post.variants.A, variantId: 'A' | 'B'): StoredPostVariant => ({
          id: variantId,
          content: variant.content,
          imagePrompt: variant.imagePrompt,
          imagePath: variant.imageUrl ? `images/${variantId}.png` : null,
          imageHistoryPaths: variant.imageHistory.map((_, idx) => `images/${variantId}_history_${idx}.png`),
          videoPath: variant.videoUrl ? `videos/${variantId}.mp4` : null,
          analytics: variant.analytics,
          rationale: variant.rationale,
        });

        // Build StoredPost
        const storedPost: StoredPost = {
          id: postId,
          createdAt: saveStates[platform]?.id ? new Date().toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          platform: post.platform,
          status: 'draft',
          scheduledDate: post.scheduledDate || null,
          publishedDate: null,
          idea: state.idea,
          tone: state.tone,
          imageStyle: state.imageStyle,
          brandVoice: state.brandVoice,
          variants: {
            A: convertVariant(post.variants.A, 'A'),
            B: convertVariant(post.variants.B, 'B'),
          },
          selectedVariantId: post.selectedVariantId,
          imageAspectRatio: post.imageAspectRatio,
          imageResolution: post.imageResolution,
          tags: [],
        };

        // Collect images to save - use the paths defined in storedPost (without doubling)
        const images = new Map<string, string>();
        if (post.variants.A.imageUrl && storedPost.variants.A.imagePath) {
          images.set(storedPost.variants.A.imagePath, post.variants.A.imageUrl);
        }
        storedPost.variants.A.imageHistoryPaths.forEach((path, idx) => {
          if (post.variants.A.imageHistory[idx]) {
            images.set(path, post.variants.A.imageHistory[idx]);
          }
        });
        if (post.variants.A.videoUrl && storedPost.variants.A.videoPath) {
          images.set(storedPost.variants.A.videoPath, post.variants.A.videoUrl);
        }
        if (post.variants.B.imageUrl && storedPost.variants.B.imagePath) {
          images.set(storedPost.variants.B.imagePath, post.variants.B.imageUrl);
        }
        storedPost.variants.B.imageHistoryPaths.forEach((path, idx) => {
          if (post.variants.B.imageHistory[idx]) {
            images.set(path, post.variants.B.imageHistory[idx]);
          }
        });
        if (post.variants.B.videoUrl && storedPost.variants.B.videoPath) {
          images.set(storedPost.variants.B.videoPath, post.variants.B.videoUrl);
        }

        await savePost(storedPost, images);

        setSaveStates((prev) => ({
          ...prev,
          [platform]: { id: postId, isSaving: false, isSaved: true },
        }));

        showToast(`${platform} post saved!`, 'success');
      } catch (error) {
        console.error('Failed to save post:', error);
        setSaveStates((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], isSaving: false, isSaved: false },
        }));
        showToast('Failed to save post', 'error');
      }
    },
    [isStorageConnected, state, saveStates, savePost]
  );

  // Mark as unsaved when post changes
  const handleUpdatePostWithDirty = useCallback(
    (platform: Platform, updates: Partial<GeneratedPost>) => {
      handleUpdatePost(platform, updates);
      setSaveStates((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], isSaved: false },
      }));
    },
    [handleUpdatePost]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Post Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Generate AI-powered social media content with A/B variants for multiple
        platforms.
      </Typography>

      {ideaIdFromUrl && (
        <Chip
          label={`From Idea: ${ideaTitleFromUrl || ideaIdFromUrl}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}

      <GeneratorControls
        state={state}
        onStateChange={handleStateChange}
        onGenerate={handleGenerate}
        disabled={state.isGenerating}
      />

      {state.posts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Content
          </Typography>
          {state.posts.map((post) => (
            <PlatformCard
              key={post.platform}
              post={post}
              onUpdatePost={(updates) =>
                handleUpdatePostWithDirty(post.platform, updates)
              }
              onRegenerateImage={(variantId) =>
                handleRegenerateImage(post.platform, variantId)
              }
              onGenerateVideo={(variantId) =>
                handleGenerateVideo(post.platform, variantId)
              }
              onUpdateContent={(variantId, content) =>
                handleUpdateContent(post.platform, variantId, content)
              }
              onEditImage={(variantId, editPrompt, maskBase64, referenceBase64) =>
                handleEditImage(post.platform, variantId, editPrompt, maskBase64, referenceBase64)
              }
              onSave={() => handleSavePost(post.platform)}
              isSaving={saveStates[post.platform]?.isSaving || false}
              isSaved={saveStates[post.platform]?.isSaved || false}
              isStorageConnected={isStorageConnected}
            />
          ))}
        </Box>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostGenerator;
