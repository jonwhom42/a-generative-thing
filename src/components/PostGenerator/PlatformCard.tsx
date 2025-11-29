import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Collapse,
  Button,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import {
  MdExpandMore,
  MdExpandLess,
  MdRefresh,
  MdPlayCircle,
  MdInfo,
  MdEdit,
  MdSchedule,
  MdFavorite,
  MdChatBubble,
  MdShare,
  MdRemoveRedEye,
  MdSave,
  MdCheck,
} from 'react-icons/md';
import {
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaHome,
  FaSearch,
  FaPlus,
} from 'react-icons/fa';
import { Platform } from '../../types/postGenerator';
import type {
  GeneratedPost,
  AspectRatio,
  ImageResolution,
} from '../../types/postGenerator';
import VisualEditor from './VisualEditor';

interface PlatformCardProps {
  post: GeneratedPost;
  onUpdatePost: (updates: Partial<GeneratedPost>) => void;
  onRegenerateImage: (variantId: 'A' | 'B') => void;
  onGenerateVideo: (variantId: 'A' | 'B') => void;
  onUpdateContent: (variantId: 'A' | 'B', content: string) => void;
  onEditImage: (
    variantId: 'A' | 'B',
    editPrompt: string,
    maskBase64: string | null,
    referenceBase64: string | null
  ) => Promise<void>;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  isStorageConnected?: boolean;
}

const getPlatformIcon = (platform: Platform) => {
  const iconProps = { size: 24 };
  switch (platform) {
    case Platform.LINKEDIN:
      return <FaLinkedin {...iconProps} color="#0A66C2" />;
    case Platform.TWITTER:
      return <FaTwitter {...iconProps} color="#000000" />;
    case Platform.INSTAGRAM:
      return <FaInstagram {...iconProps} color="#E4405F" />;
    case Platform.TIKTOK:
      return <FaTiktok {...iconProps} color="#000000" />;
    case Platform.FACEBOOK:
      return <FaFacebook {...iconProps} color="#1877F2" />;
    default:
      return null;
  }
};

const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

const resolutionOptions: ImageResolution[] = ['1K', '2K', '4K'];

// Instagram Preview Component
const InstagramPreview = ({
  imageUrl,
  caption,
  imageStyle,
  resolution,
}: {
  imageUrl: string | null;
  caption: string;
  imageStyle: string;
  resolution: string;
}) => (
  <Paper
    sx={{
      width: 280,
      bgcolor: '#FAFAFA',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}
  >
    {/* Phone Status Bar */}
    <Box sx={{ bgcolor: '#FAFAFA', px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="caption" fontWeight={600}>9:41</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'grey.400' }} />
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'grey.400' }} />
      </Box>
    </Box>

    {/* Header */}
    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white' }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" fontWeight={600}>M</Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600} fontSize={13}>Mind 2 Matter</Typography>
        <Typography variant="caption" color="text.secondary" fontSize={11}>The AI Creative Agency</Typography>
      </Box>
      <Typography color="text.secondary">•••</Typography>
    </Box>

    {/* Image */}
    <Box sx={{ position: 'relative', bgcolor: 'grey.200', aspectRatio: '1/1' }}>
      {imageUrl ? (
        <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary" fontSize={12}>No image</Typography>
        </Box>
      )}
      {/* Style Badge */}
      <Chip
        label={`${imageStyle} • ${resolution}`}
        size="small"
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: 10,
          height: 24,
        }}
      />
    </Box>

    {/* Actions */}
    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FaHeart size={20} />
        <FaComment size={20} />
        <FaShare size={20} />
      </Box>
      <FaBookmark size={20} />
    </Box>

    {/* Caption */}
    <Box sx={{ px: 2, pb: 1.5, bgcolor: 'white' }}>
      <Typography variant="body2" fontSize={12} sx={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        <strong>Mind 2 Matter</strong> {caption?.slice(0, 80) || 'Your caption will appear here...'}
      </Typography>
    </Box>

    {/* Nav */}
    <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
      <FaHome size={20} />
      <FaSearch size={20} color="#999" />
      <FaPlus size={20} color="#999" />
      <FaHeart size={20} color="#999" />
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'grey.400' }} />
    </Box>

    {/* Live Preview Button */}
    <Box sx={{ p: 2, bgcolor: '#1a1a2e', display: 'flex', justifyContent: 'center' }}>
      <Button size="small" sx={{ color: 'white', fontSize: 11 }}>
        LIVE PREVIEW
      </Button>
    </Box>
  </Paper>
);

// Metric Card Component
const MetricCard = ({
  label,
  value,
  change,
  icon
}: {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}) => (
  <Paper sx={{ p: 2, flex: 1, minWidth: 120 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Box sx={{ color: 'grey.400' }}>{icon}</Box>
    </Box>
    <Typography variant="h5" fontWeight={700}>
      {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString()}
    </Typography>
    <Typography variant="caption" color={change >= 0 ? 'success.main' : 'error.main'}>
      {change >= 0 ? '+' : ''}{change}% <span style={{ color: '#999' }}>vs. 30-day avg</span>
    </Typography>
  </Paper>
);

const PlatformCard = ({
  post,
  onUpdatePost,
  onRegenerateImage,
  onGenerateVideo,
  onUpdateContent,
  onEditImage,
  onSave,
  isSaving = false,
  isSaved = false,
  isStorageConnected = false,
}: PlatformCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const selectedVariant = post.variants[post.selectedVariantId];

  const handleApplyEdit = async (
    editPrompt: string,
    maskBase64: string | null,
    referenceBase64: string | null
  ) => {
    setIsEditingImage(true);
    try {
      await onEditImage(post.selectedVariantId, editPrompt, maskBase64, referenceBase64);
      setShowVisualEditor(false);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleVariantChange = (
    _: React.MouseEvent<HTMLElement>,
    newVariant: 'A' | 'B' | null
  ) => {
    if (newVariant) {
      onUpdatePost({ selectedVariantId: newVariant });
    }
  };

  if (post.isLoading) {
    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Generating content for {post.platform}...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (post.error) {
    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getPlatformIcon(post.platform)}
            <Typography variant="h6">{post.platform}</Typography>
          </Box>
          <Alert severity="error">{post.error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getPlatformIcon(post.platform)}
          <Box>
            <Typography variant="h6" fontWeight={600}>{post.platform}</Typography>
            <Typography variant="caption" color="text.secondary">SOCIAL POST</Typography>
          </Box>
          <Chip
            label={isSaved ? 'SAVED' : 'DRAFT'}
            size="small"
            sx={{
              bgcolor: isSaved ? '#E8F5E9' : '#E3F2FD',
              color: isSaved ? '#2E7D32' : '#1976D2',
              fontWeight: 600,
              fontSize: 10,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isStorageConnected && onSave && (
            <IconButton
              onClick={onSave}
              disabled={isSaving}
              title={isSaved ? 'Saved' : 'Save to storage'}
              sx={{
                color: isSaved ? 'success.main' : 'text.secondary',
                '&:hover': { color: isSaved ? 'success.dark' : 'primary.main' },
              }}
            >
              {isSaving ? (
                <CircularProgress size={20} />
              ) : isSaved ? (
                <MdCheck size={24} />
              ) : (
                <MdSave size={24} />
              )}
            </IconButton>
          )}
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={4}>
            {/* Left Column - Controls */}
            <Grid size={{ xs: 12, md: 7 }}>
              {/* Variant Selector Row */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={post.selectedVariantId}
                  exclusive
                  onChange={handleVariantChange}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    },
                    '& .Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ToggleButton value="A">Option A</ToggleButton>
                  <ToggleButton value="B">Option B</ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={post.imageAspectRatio}
                    onChange={(e) => onUpdatePost({ imageAspectRatio: e.target.value as AspectRatio })}
                    sx={{ borderRadius: 2 }}
                  >
                    {aspectRatioOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Caption Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    CAPTION
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedVariant.content?.length || 0} chars
                  </Typography>
                </Box>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={selectedVariant.content || ''}
                  onChange={(e) => onUpdateContent(post.selectedVariantId, e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* Performance Forecast */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  PERFORMANCE FORECAST
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <MetricCard
                    label="LIKES"
                    value={selectedVariant.analytics.likes}
                    change={12}
                    icon={<MdFavorite size={16} />}
                  />
                  <MetricCard
                    label="COMMENTS"
                    value={selectedVariant.analytics.comments}
                    change={8}
                    icon={<MdChatBubble size={16} />}
                  />
                  <MetricCard
                    label="SHARES"
                    value={selectedVariant.analytics.shares}
                    change={15}
                    icon={<MdShare size={16} />}
                  />
                  <MetricCard
                    label="REACH"
                    value={selectedVariant.analytics.reach}
                    change={5}
                    icon={<MdRemoveRedEye size={16} />}
                  />
                </Box>
              </Box>

              {/* AI Insight */}
              {selectedVariant.rationale && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <MdInfo size={20} color="#1976D2" style={{ marginTop: 2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        AI Insight:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedVariant.rationale}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Visual Editor */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    VISUAL EDITOR
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 70 }}>
                    <Select
                      value={post.imageResolution}
                      onChange={(e) => onUpdatePost({ imageResolution: e.target.value as ImageResolution })}
                      sx={{ borderRadius: 2 }}
                    >
                      {resolutionOptions.map((res) => (
                        <MenuItem key={res} value={res}>{res}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<MdEdit />}
                    onClick={() => setShowVisualEditor(true)}
                    disabled={!selectedVariant.imageUrl}
                    sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
                  >
                    Advanced Edit
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdRefresh />}
                    onClick={() => onRegenerateImage(post.selectedVariantId)}
                    disabled={post.isImageRegenerating}
                    sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
                  >
                    {post.isImageRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </Box>
              </Box>

              {/* Version History */}
              {selectedVariant.imageHistory.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      VERSION HISTORY
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedVariant.imageHistory.length} versions
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedVariant.imageHistory.slice(-4).map((img, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: img === selectedVariant.imageUrl ? 2 : 1,
                          borderColor: img === selectedVariant.imageUrl ? 'primary.main' : 'divider',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const updatedVariants = { ...post.variants };
                          updatedVariants[post.selectedVariantId] = {
                            ...selectedVariant,
                            imageUrl: img,
                          };
                          onUpdatePost({ variants: updatedVariants });
                        }}
                      >
                        <img src={img} alt={`Version ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Generate Video */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<MdPlayCircle />}
                onClick={() => onGenerateVideo(post.selectedVariantId)}
                disabled={selectedVariant.isVideoLoading || !selectedVariant.imageUrl}
                sx={{
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: 'grey.800',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                {selectedVariant.isVideoLoading ? 'Generating Video...' : 'Generate Video'}
              </Button>

              {/* Video Display */}
              {selectedVariant.videoUrl && (
                <Box sx={{ mb: 3 }}>
                  <video
                    src={selectedVariant.videoUrl}
                    controls
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </Box>
              )}

              {/* Schedule Post */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                  SCHEDULE POST
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    type="datetime-local"
                    size="small"
                    fullWidth
                    value={post.scheduledDate || ''}
                    onChange={(e) => onUpdatePost({ scheduledDate: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<MdSchedule />}
                    sx={{
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: 'primary.main',
                    }}
                  >
                    Schedule
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Preview */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', position: 'sticky', top: 20 }}>
                <InstagramPreview
                  imageUrl={selectedVariant.imageUrl}
                  caption={selectedVariant.content || ''}
                  imageStyle="PHOTOREALISTIC"
                  resolution={post.imageResolution}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>

      {/* Visual Editor Modal */}
      <VisualEditor
        open={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        imageUrl={selectedVariant.imageUrl}
        onApplyEdit={handleApplyEdit}
        isLoading={isEditingImage}
      />
    </Card>
  );
};

export default PlatformCard;
