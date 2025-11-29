import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Typography,
  Collapse,
  Paper,
  Card,
  CardActionArea,
  Chip,
  IconButton,
} from '@mui/material';
import {
  MdExpandMore,
  MdExpandLess,
  MdMic,
  MdImage,
  MdShare,
  MdPerson,
  MdBolt,
} from 'react-icons/md';
import {
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaTiktok,
  FaFacebook,
} from 'react-icons/fa';
import {
  Tone,
  Platform,
  ImageStyle,
} from '../../types/postGenerator';
import type {
  BrandVoice,
  GeneratorState,
} from '../../types/postGenerator';

interface GeneratorControlsProps {
  state: GeneratorState;
  onStateChange: (updates: Partial<GeneratorState>) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  [Platform.LINKEDIN]: <FaLinkedin size={24} />,
  [Platform.TWITTER]: <FaTwitter size={24} />,
  [Platform.INSTAGRAM]: <FaInstagram size={24} />,
  [Platform.TIKTOK]: <FaTiktok size={24} />,
  [Platform.FACEBOOK]: <FaFacebook size={24} />,
};

const platformColors: Record<Platform, string> = {
  [Platform.LINKEDIN]: '#0A66C2',
  [Platform.TWITTER]: '#000000',
  [Platform.INSTAGRAM]: '#E4405F',
  [Platform.TIKTOK]: '#000000',
  [Platform.FACEBOOK]: '#1877F2',
};

const GeneratorControls = ({
  state,
  onStateChange,
  onGenerate,
  disabled = false,
}: GeneratorControlsProps) => {
  const [showBrandVoice, setShowBrandVoice] = useState(false);

  const handlePlatformToggle = (platform: Platform) => {
    const current = state.selectedPlatforms;
    if (current.includes(platform)) {
      if (current.length > 1) {
        onStateChange({
          selectedPlatforms: current.filter((p) => p !== platform),
        });
      }
    } else {
      onStateChange({ selectedPlatforms: [...current, platform] });
    }
  };

  const handleBrandVoiceChange = (field: keyof BrandVoice, value: string) => {
    onStateChange({
      brandVoice: { ...state.brandVoice, [field]: value },
    });
  };

  const allPlatforms = Object.values(Platform);
  const allTones = Object.values(Tone);
  const allImageStyles = Object.values(ImageStyle);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Idea Input Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            WHAT DO YOU WANT TO POST ABOUT?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {state.idea.length} / 3000
          </Typography>
        </Box>
        <TextField
          placeholder="e.g., a butt washing laser gun"
          multiline
          rows={4}
          fullWidth
          value={state.idea}
          onChange={(e) => onStateChange({ idea: e.target.value.slice(0, 3000) })}
          disabled={disabled}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Paper>

      {/* Tone of Voice Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MdMic size={20} color="#7C3AED" />
          <Typography variant="subtitle1" fontWeight={600}>
            Tone of Voice
          </Typography>
          <IconButton size="small">
            <MdExpandLess />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {allTones.map((tone) => (
            <Chip
              key={tone}
              label={tone}
              onClick={() => !disabled && onStateChange({ tone })}
              variant={state.tone === tone ? 'filled' : 'outlined'}
              color={state.tone === tone ? 'primary' : 'default'}
              sx={{
                borderRadius: 2,
                fontWeight: state.tone === tone ? 600 : 400,
                bgcolor: state.tone === tone ? 'primary.main' : 'transparent',
                color: state.tone === tone ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: state.tone === tone ? 'primary.dark' : 'grey.100',
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Visual Style Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MdImage size={20} color="#7C3AED" />
          <Typography variant="subtitle1" fontWeight={600}>
            Visual Style
          </Typography>
          <IconButton size="small">
            <MdExpandLess />
          </IconButton>
        </Box>
        <FormControl fullWidth disabled={disabled}>
          <Select
            value={state.imageStyle}
            onChange={(e) => onStateChange({ imageStyle: e.target.value as ImageStyle })}
            sx={{ borderRadius: 2 }}
          >
            {allImageStyles.map((style) => (
              <MenuItem key={style} value={style}>
                {style}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Target Platforms Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MdShare size={20} color="#7C3AED" />
          <Typography variant="subtitle1" fontWeight={600}>
            Target Platforms
          </Typography>
          <IconButton size="small">
            <MdExpandLess />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {allPlatforms.map((platform) => {
            const isSelected = state.selectedPlatforms.includes(platform);
            return (
              <Card
                key={platform}
                sx={{
                  width: 120,
                  border: 2,
                  borderColor: isSelected ? platformColors[platform] : 'grey.200',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: platformColors[platform],
                  },
                }}
              >
                <CardActionArea
                  onClick={() => !disabled && handlePlatformToggle(platform)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      color: isSelected ? platformColors[platform] : 'grey.500',
                      transition: 'color 0.2s',
                    }}
                  >
                    {platformIcons[platform]}
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={isSelected ? 600 : 400}
                    color={isSelected ? 'text.primary' : 'text.secondary'}
                  >
                    {platform.replace('Twitter/X', 'Twitter/X')}
                  </Typography>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Paper>

      {/* Brand Voice Section */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
          onClick={() => setShowBrandVoice(!showBrandVoice)}
        >
          <MdPerson size={20} color="#7C3AED" />
          <Typography variant="subtitle1" fontWeight={600}>
            Customize Brand Voice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (Optional)
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small">
            {showBrandVoice ? <MdExpandLess /> : <MdExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={showBrandVoice}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              label="WRITING STYLE"
              placeholder="e.g. Short, Punchy"
              value={state.brandVoice.style}
              onChange={(e) => handleBrandVoiceChange('style', e.target.value)}
              disabled={disabled}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              label="KEYWORDS"
              placeholder="e.g. Sustainable"
              value={state.brandVoice.keywords}
              onChange={(e) => handleBrandVoiceChange('keywords', e.target.value)}
              disabled={disabled}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              label="TERMINOLOGY"
              placeholder="e.g. Use 'Guests' not 'Customers'"
              value={state.brandVoice.terminology}
              onChange={(e) => handleBrandVoiceChange('terminology', e.target.value)}
              disabled={disabled}
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>
        </Collapse>
      </Paper>

      {/* Generate Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<MdBolt />}
        onClick={onGenerate}
        disabled={disabled || !state.idea.trim() || state.selectedPlatforms.length === 0}
        sx={{
          py: 2,
          borderRadius: 2,
          fontSize: '1.1rem',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6D28D9 0%, #9333EA 100%)',
          },
          '&:disabled': {
            background: 'grey.300',
          },
        }}
      >
        {disabled ? 'Generating...' : 'Generate Campaign Assets'}
      </Button>
    </Box>
  );
};

export default GeneratorControls;
