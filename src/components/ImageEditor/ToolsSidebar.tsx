import { Box, IconButton, Tooltip, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  MdBrush,
  MdAutoFixHigh,
  MdUndo,
  MdRedo,
  MdDelete,
  MdImage,
  MdVideocam,
  MdPanTool,
} from 'react-icons/md';
import type { EditorTool } from '../../types/imageEditor';

interface ToolsSidebarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearCanvas: () => void;
  mode: 'image' | 'video';
  onModeChange: (mode: 'image' | 'video') => void;
}

export const ToolsSidebar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  mode,
  onModeChange,
}: ToolsSidebarProps) => {
  const tools = [
    { id: 'select' as EditorTool, icon: MdPanTool, tooltip: 'Select / Pan' },
    { id: 'brush' as EditorTool, icon: MdBrush, tooltip: 'Brush (Paint Mask)' },
    { id: 'eraser' as EditorTool, icon: MdAutoFixHigh, tooltip: 'Eraser' },
  ];

  return (
    <Box
      sx={{
        width: 64,
        bgcolor: 'white',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        gap: 1,
      }}
    >
      {/* Mode Toggle */}
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, newMode) => newMode && onModeChange(newMode)}
        orientation="vertical"
        size="small"
        sx={{ mb: 1 }}
      >
        <ToggleButton value="image" sx={{ p: 1 }}>
          <Tooltip title="Image Mode" placement="right">
            <Box component="span" sx={{ display: 'flex' }}>
              <MdImage size={20} />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="video" sx={{ p: 1 }}>
          <Tooltip title="Video Mode" placement="right">
            <Box component="span" sx={{ display: 'flex' }}>
              <MdVideocam size={20} />
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Drawing Tools */}
      {tools.map((tool) => (
        <Tooltip key={tool.id} title={tool.tooltip} placement="right">
          <IconButton
            onClick={() => onToolChange(tool.id)}
            sx={{
              bgcolor: activeTool === tool.id ? 'primary.main' : 'transparent',
              color: activeTool === tool.id ? 'white' : 'text.primary',
              '&:hover': {
                bgcolor: activeTool === tool.id ? 'primary.dark' : 'grey.100',
              },
            }}
          >
            <tool.icon size={22} />
          </IconButton>
        </Tooltip>
      ))}

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Undo/Redo */}
      <Tooltip title="Undo" placement="right">
        <span>
          <IconButton onClick={onUndo} disabled={!canUndo}>
            <MdUndo size={22} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo" placement="right">
        <span>
          <IconButton onClick={onRedo} disabled={!canRedo}>
            <MdRedo size={22} />
          </IconButton>
        </span>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      {/* Clear Mask */}
      <Tooltip title="Clear Mask" placement="right">
        <IconButton onClick={onClearCanvas} color="error">
          <MdDelete size={22} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
