import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { MdCloudUpload, MdZoomIn, MdZoomOut, MdCenterFocusStrong } from 'react-icons/md';
import type { EditorTool } from '../../types/imageEditor';

interface EditorCanvasProps {
  currentImage: string | null;
  activeTool: EditorTool;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  onUploadImage: (file: File) => void;
  isLoading: boolean;
}

export interface EditorCanvasRef {
  getMaskDataUrl: () => string | null;
  clearMask: () => void;
}

export const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ currentImage, activeTool, brushSize, brushColor, brushOpacity, onUploadImage, isLoading }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    useImperativeHandle(ref, () => ({
      getMaskDataUrl: () => {
        if (!maskCanvasRef.current) return null;
        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        const hasDrawing = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);

        if (!hasDrawing) return null;
        return maskCanvasRef.current.toDataURL('image/png');
      },
      clearMask: () => {
        if (!maskCanvasRef.current) return;
        const ctx = maskCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
      },
    }));

    // Load image onto canvas
    useEffect(() => {
      if (!currentImage || !imageCanvasRef.current) return;

      const img = new Image();
      img.onload = () => {
        const canvas = imageCanvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        setCanvasSize({ width: img.width, height: img.height });

        // Also resize mask canvas
        if (maskCanvasRef.current) {
          maskCanvasRef.current.width = img.width;
          maskCanvasRef.current.height = img.height;
        }

        ctx.drawImage(img, 0, 0);

        // Reset zoom and pan when new image loads
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      img.src = currentImage;
    }, [currentImage]);

    const getCanvasPoint = useCallback((e: React.MouseEvent) => {
      if (!maskCanvasRef.current || !containerRef.current) return null;

      const rect = maskCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      return { x, y };
    }, [zoom]);

    const draw = useCallback((e: React.MouseEvent) => {
      if (!isDrawing || activeTool === 'select' || !maskCanvasRef.current) return;

      const point = getCanvasPoint(e);
      if (!point) return;

      const ctx = maskCanvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.globalAlpha = activeTool === 'eraser' ? 1 : brushOpacity;
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }, [isDrawing, activeTool, brushSize, brushColor, brushOpacity, getCanvasPoint]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (activeTool === 'select') {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      } else {
        setIsDrawing(true);
        draw(e);
      }
    }, [activeTool, draw]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      } else if (isDrawing) {
        draw(e);
      }
    }, [isPanning, isDrawing, lastPanPoint, draw]);

    const handleMouseUp = useCallback(() => {
      setIsDrawing(false);
      setIsPanning(false);
    }, []);

    const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 5));
    const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.1));
    const handleResetView = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onUploadImage(file);
      }
    }, [onUploadImage]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUploadImage(file);
      }
    }, [onUploadImage]);

    return (
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Zoom Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            bgcolor: 'white',
            borderRadius: 1,
            boxShadow: 1,
            display: 'flex',
            gap: 0.5,
            p: 0.5,
          }}
        >
          <IconButton size="small" onClick={handleZoomOut}>
            <MdZoomOut />
          </IconButton>
          <Typography sx={{ px: 1, display: 'flex', alignItems: 'center', fontSize: 14 }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <IconButton size="small" onClick={handleZoomIn}>
            <MdZoomIn />
          </IconButton>
          <IconButton size="small" onClick={handleResetView}>
            <MdCenterFocusStrong />
          </IconButton>
        </Box>

        {/* Loading Overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <CircularProgress size={60} />
          </Box>
        )}

        {/* Canvas Area */}
        {currentImage ? (
          <Box
            sx={{
              position: 'relative',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              cursor: activeTool === 'select' ? 'grab' : 'crosshair',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Image Layer */}
            <canvas
              ref={imageCanvasRef}
              style={{
                display: 'block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            />
            {/* Mask Layer */}
            <canvas
              ref={maskCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
              }}
            />
          </Box>
        ) : (
          /* Upload Placeholder */
          <Box
            component="label"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 6,
              border: '2px dashed',
              borderColor: 'grey.400',
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: 'white',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'grey.50',
              },
            }}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileInput}
            />
            <MdCloudUpload size={64} color="#9CA3AF" />
            <Typography variant="h6" color="text.secondary">
              Drop an image here or click to upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Or generate a new image using the prompt below
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
);

EditorCanvas.displayName = 'EditorCanvas';
