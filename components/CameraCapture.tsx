import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface CameraCaptureProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSelect = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <input
        id="camera-trigger"
        type="file"
        accept="image/*"
        capture="environment" 
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={triggerSelect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-3 bg-white text-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 font-bold"
      >
        <Camera className="w-5 h-5" />
        <span className="hidden sm:inline">Scan</span>
      </button>
    </>
  );
};