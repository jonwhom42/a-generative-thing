import { Box, Typography, Slider, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Switch, FormControlLabel, Chip, Divider } from '@mui/material';
import { MdAdd, MdClose, MdFirstPage, MdLastPage } from 'react-icons/md';
import type {
  ImageModel,
  ImageResolutionV3,
  AspectRatioV3,
  ReferenceImage,
  VideoSettings,
  VideoDuration,
  VideoResolution,
} from '../../types/imageEditor';
import {
  MODEL_CONFIG,
  ASPECT_RATIO_OPTIONS,
  RESOLUTION_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_RESOLUTION_OPTIONS,
} from '../../types/imageEditor';

interface PropertiesPanelProps {
  mode: 'image' | 'video';
  model: ImageModel;
  resolution: ImageResolutionV3;
  aspectRatio: AspectRatioV3;
  brushSize: number;
  brushOpacity: number;
  referenceImages: ReferenceImage[];
  videoSettings: VideoSettings;
  onModelChange: (model: ImageModel) => void;
  onResolutionChange: (resolution: ImageResolutionV3) => void;
  onAspectRatioChange: (aspectRatio: AspectRatioV3) => void;
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onAddReferenceImage: (file: File) => void;
  onRemoveReferenceImage: (id: string) => void;
  onVideoSettingsChange: (settings: Partial<VideoSettings>) => void;
  onSetFirstFrame: () => void;
  onSetLastFrame: () => void;
  hasCurrentImage: boolean;
}

export const PropertiesPanel = ({
  mode,
  model,
  resolution,
  aspectRatio,
  brushSize,
  brushOpacity,
  referenceImages,
  videoSettings,
  onModelChange,
  onResolutionChange,
  onAspectRatioChange,
  onBrushSizeChange,
  onBrushOpacityChange,
  onAddReferenceImage,
  onRemoveReferenceImage,
  onVideoSettingsChange,
  onSetFirstFrame,
  onSetLastFrame,
  hasCurrentImage,
}: PropertiesPanelProps) => {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddReferenceImage(file);
      e.target.value = '';
    }
  };

  const maxResolutions = model === 'pro' ? RESOLUTION_OPTIONS : RESOLUTION_OPTIONS.filter((r) => r.value === '1K');

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'white',
        borderLeft: 1,
        borderColor: 'divider',
        overflow: 'auto',
        p: 2,
      }}
    >
      {/* Model Selection */}
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Model
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {(['pro', 'flash'] as ImageModel[]).map((m) => (
          <Chip
            key={m}
            label={MODEL_CONFIG[m].name}
            onClick={() => onModelChange(m)}
            color={model === m ? 'primary' : 'default'}
            variant={model === m ? 'filled' : 'outlined'}
            sx={{ flex: 1 }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        {MODEL_CONFIG[model].description}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {mode === 'image' ? (
        <>
          {/* Image Settings */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Image Settings
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Resolution</InputLabel>
            <Select
              value={resolution}
              label="Resolution"
              onChange={(e) => onResolutionChange(e.target.value as ImageResolutionV3)}
            >
              {maxResolutions.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={aspectRatio}
              label="Aspect Ratio"
              onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioV3)}
            >
              {ASPECT_RATIO_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Brush Settings */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Brush Settings
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Size: {brushSize}px
          </Typography>
          <Slider
            value={brushSize}
            onChange={(_, value) => onBrushSizeChange(value as number)}
            min={1}
            max={100}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" color="text.secondary">
            Opacity: {Math.round(brushOpacity * 100)}%
          </Typography>
          <Slider
            value={brushOpacity}
            onChange={(_, value) => onBrushOpacityChange(value as number)}
            min={0.1}
            max={1}
            step={0.1}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Reference Images */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Reference Images
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {referenceImages.length}/{MODEL_CONFIG[model].maxReferenceImages}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {referenceImages.map((ref) => (
              <Box
                key={ref.id}
                sx={{
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={ref.thumbnail}
                  alt="Reference"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => onRemoveReferenceImage(ref.id)}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    p: 0.25,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                >
                  <MdClose size={14} />
                </IconButton>
              </Box>
            ))}

            {referenceImages.length < MODEL_CONFIG[model].maxReferenceImages && (
              <Box
                component="label"
                sx={{
                  width: 60,
                  height: 60,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <input type="file" accept="image/*" hidden onChange={handleFileInput} />
                <MdAdd size={24} color="#9CA3AF" />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          {/* Video Settings */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Video Settings
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Duration</InputLabel>
            <Select
              value={videoSettings.duration}
              label="Duration"
              onChange={(e) => onVideoSettingsChange({ duration: e.target.value as VideoDuration })}
            >
              {VIDEO_DURATION_OPTIONS.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Resolution</InputLabel>
            <Select
              value={videoSettings.resolution}
              label="Resolution"
              onChange={(e) => onVideoSettingsChange({ resolution: e.target.value as VideoResolution })}
            >
              {VIDEO_RESOLUTION_OPTIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={aspectRatio === '9:16' ? '9:16' : '16:9'}
              label="Aspect Ratio"
              onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioV3)}
            >
              <MenuItem value="16:9">Landscape (16:9)</MenuItem>
              <MenuItem value="9:16">Portrait (9:16)</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={videoSettings.fast}
                onChange={(e) => onVideoSettingsChange({ fast: e.target.checked })}
              />
            }
            label="Fast Mode"
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Faster generation with slightly lower quality
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={videoSettings.includeAudio}
                onChange={(e) => onVideoSettingsChange({ includeAudio: e.target.checked })}
              />
            }
            label="Include Audio"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Frame Controls */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Frame Controls
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title="Set current image as first frame">
              <span>
                <IconButton
                  onClick={onSetFirstFrame}
                  disabled={!hasCurrentImage}
                  sx={{
                    flex: 1,
                    border: 1,
                    borderColor: videoSettings.firstFrame ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    bgcolor: videoSettings.firstFrame ? 'primary.50' : 'transparent',
                  }}
                >
                  <MdFirstPage />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    First
                  </Typography>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Set current image as last frame">
              <span>
                <IconButton
                  onClick={onSetLastFrame}
                  disabled={!hasCurrentImage}
                  sx={{
                    flex: 1,
                    border: 1,
                    borderColor: videoSettings.lastFrame ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    bgcolor: videoSettings.lastFrame ? 'primary.50' : 'transparent',
                  }}
                >
                  <MdLastPage />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    Last
                  </Typography>
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Frame Previews */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {videoSettings.firstFrame && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  First Frame
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'grey.200',
                  }}
                >
                  <img
                    src={videoSettings.firstFrame}
                    alt="First frame"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              </Box>
            )}
            {videoSettings.lastFrame && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Last Frame
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'grey.200',
                  }}
                >
                  <img
                    src={videoSettings.lastFrame}
                    alt="Last frame"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};
