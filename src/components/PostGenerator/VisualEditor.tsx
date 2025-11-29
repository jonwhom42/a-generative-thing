import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Slider,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  MdClose,
  MdBrush,
  MdDelete,
  MdUndo,
  MdUpload,
  MdTextFields,
  MdGesture,
  MdImage,
} from 'react-icons/md';

interface VisualEditorProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onApplyEdit: (
    editPrompt: string,
    maskBase64: string | null,
    referenceBase64: string | null
  ) => Promise<void>;
  isLoading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ py: 2, display: value === index ? 'block' : 'none' }}
  >
    {children}
  </Box>
);

const VisualEditor = ({
  open,
  onClose,
  imageUrl,
  onApplyEdit,
  isLoading = false,
}: VisualEditorProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editPrompt, setEditPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas when image loads
  useEffect(() => {
    if (!open || !imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to match image
      const maxWidth = 500;
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Configure context for drawing
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = brushSize;
      contextRef.current = ctx;
    };
    img.src = imageUrl;
  }, [open, imageUrl, brushSize]);

  // Update brush size when changed
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushSize]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;

    // Save current state for undo
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
      setMaskHistory(prev => [...prev, imageData]);
    }

    const { x, y } = getCanvasCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;

    const { x, y } = getCanvasCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMaskHistory([]);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || maskHistory.length === 0) return;

    const previousState = maskHistory[maskHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setMaskHistory(prev => prev.slice(0, -1));
  };

  const getMaskBase64 = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Check if canvas has any drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((value, index) => index % 4 === 3 && value > 0);

    if (!hasDrawing) return null;

    // Create a black and white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;

    // Fill with black (areas to preserve)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Convert red strokes to white (areas to edit)
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 0) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);
        maskCtx.fillStyle = 'white';
        maskCtx.fillRect(x, y, 1, 1);
      }
    }

    return maskCanvas.toDataURL('image/png');
  }, []);

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    if (!editPrompt.trim()) return;

    const maskBase64 = activeTab === 1 ? getMaskBase64() : null;
    const refBase64 = activeTab === 2 ? referenceImage : null;

    await onApplyEdit(editPrompt, maskBase64, refBase64);
  };

  const handleClose = () => {
    setEditPrompt('');
    setReferenceImage(null);
    clearCanvas();
    setActiveTab(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{ pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6" component="span" fontWeight={600}>
          Visual Editor
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
            }}
          >
            <Tab icon={<MdTextFields size={18} />} iconPosition="start" label="Text" />
            <Tab icon={<MdGesture size={18} />} iconPosition="start" label="Annotate / Mask" />
            <Tab icon={<MdImage size={18} />} iconPosition="start" label="Reference" />
          </Tabs>
        </Box>

        {/* Text Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe what changes you want to make to the image.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="e.g., Make the background more vibrant, add a sunset glow, change the color scheme to warm tones..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          {imageUrl && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Current Image Preview
              </Typography>
              <img
                src={imageUrl}
                alt="Current"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                }}
              />
            </Box>
          )}
        </TabPanel>

        {/* Annotate/Mask Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Draw on the image to create a mask. Red areas will be edited based on your prompt.
          </Typography>

          {/* Edit Prompt for Mask */}
          <TextField
            fullWidth
            placeholder="Describe what to change in the masked area..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            size="small"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Brush Controls */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MdBrush size={20} />
              <Typography variant="body2" sx={{ minWidth: 80 }}>
                Brush Size
              </Typography>
              <Slider
                value={brushSize}
                onChange={(_, value) => setBrushSize(value as number)}
                min={5}
                max={50}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'right' }}>
                {brushSize}px
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdUndo />}
                onClick={undoLastStroke}
                disabled={maskHistory.length === 0}
                sx={{ textTransform: 'none' }}
              >
                Undo
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MdDelete />}
                onClick={clearCanvas}
                color="error"
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            </Box>
          </Paper>

          {/* Canvas with Image */}
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 2,
              p: 2,
              minHeight: 300,
            }}
          >
            {imageUrl ? (
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imageUrl}
                  alt="Edit"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    borderRadius: 8,
                  }}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'crosshair',
                    borderRadius: 8,
                  }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">No image available</Typography>
            )}
          </Box>
        </TabPanel>

        {/* Reference Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a reference image for style transfer or structural guidance.
          </Typography>

          {/* Edit Prompt for Reference */}
          <TextField
            fullWidth
            placeholder="Describe how to use the reference image..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            size="small"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleReferenceUpload}
            style={{ display: 'none' }}
          />

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Current Image */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Current Image
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Current"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  />
                ) : (
                  <Typography color="text.secondary">No image</Typography>
                )}
              </Paper>
            </Box>

            {/* Reference Image Upload */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Reference Image
              </Typography>
              <Paper
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: referenceImage ? 'primary.main' : 'grey.300',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'grey.50',
                  },
                }}
              >
                {referenceImage ? (
                  <img
                    src={referenceImage}
                    alt="Reference"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  />
                ) : (
                  <>
                    <MdUpload size={40} color="#999" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Click to upload reference
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG up to 10MB
                    </Typography>
                  </>
                )}
              </Paper>
              {referenceImage && (
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReferenceImage(null);
                  }}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Remove Reference
                </Button>
              )}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={isLoading || !editPrompt.trim()}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 4,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6D28D9 0%, #9333EA 100%)',
            },
          }}
        >
          {isLoading ? 'Applying...' : 'Apply Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VisualEditor;
