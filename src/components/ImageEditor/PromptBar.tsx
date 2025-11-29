import { Box, TextField, Button, CircularProgress } from '@mui/material';
import { MdAutoAwesome, MdEdit } from 'react-icons/md';

interface PromptBarProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEdit: () => void;
  isLoading: boolean;
  hasImage: boolean;
  mode: 'image' | 'video';
}

export const PromptBar = ({
  prompt,
  onPromptChange,
  onGenerate,
  onEdit,
  isLoading,
  hasImage,
  mode,
}: PromptBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'white',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: 2,
        alignItems: 'flex-end',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={3}
        placeholder={
          mode === 'image'
            ? 'Describe the image you want to generate or the edits you want to make...'
            : 'Describe the video you want to generate...'
        }
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {mode === 'image' && hasImage && (
          <Button
            variant="outlined"
            onClick={onEdit}
            disabled={isLoading || !prompt.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <MdEdit />}
            sx={{ minWidth: 100 }}
          >
            Edit
          </Button>
        )}

        <Button
          variant="contained"
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MdAutoAwesome />}
          sx={{ minWidth: 120 }}
        >
          {mode === 'image' ? 'Generate' : 'Create Video'}
        </Button>
      </Box>
    </Box>
  );
};
