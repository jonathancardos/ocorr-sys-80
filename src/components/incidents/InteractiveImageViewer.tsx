import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Importar o componente Label
import { RotateCw, ZoomIn, ZoomOut, Sun, Contrast } from 'lucide-react'; // Corrigido Brightness para Sun

interface InteractiveImageViewerProps {
  imageUrl: string;
  imageName: string; // Adicionado imageName
  onClose: () => void;
}

const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({ imageUrl, imageName, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const imgRef = useRef<HTMLImageElement>(null);

  const applyFilters = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      imgRef.current.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
    }
  }, [brightness, contrast, zoom, rotation]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Visualizador de Imagem</CardTitle>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col lg:flex-row p-4">
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden relative">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Imagem Carregada"
            className="max-w-full max-h-full object-contain transition-all duration-100 ease-in-out"
            style={{ transformOrigin: 'center center' }}
          />
        </div>
        <div className="w-full lg:w-64 lg:ml-4 mt-4 lg:mt-0 p-4 bg-gray-50 dark:bg-gray-700 rounded-md flex flex-col space-y-4">
          <h3 className="text-lg font-semibold">Controles</h3>
          <div className="flex items-center space-x-2">
            <Button onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
            <Button onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={handleRotate}><RotateCw className="h-4 w-4" /></Button>
          </div>
          <div>
            <Label>Brilho ({brightness}%)</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[brightness]}
              onValueChange={([val]) => setBrightness(val)}
            />
          </div>
          <div>
            <Label>Contraste ({contrast}%)</Label>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[contrast]}
              onValueChange={([val]) => setContrast(val)}
            />
          </div>
          <h3 className="text-lg font-semibold">Metadados</h3>
          {/* Metadados serão adicionados aqui */}
          <p>Resolução: N/A</p>
          <p>Formato: N/A</p>
          <p>Tamanho: N/A</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveImageViewer;