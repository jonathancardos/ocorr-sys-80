import React from 'react';
import { Button } from './button';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfPreviewControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
}

export const PdfPreviewControls: React.FC<PdfPreviewControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        title="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        title="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        title="Redefinir zoom"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
};