import React, { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, Ban } from "lucide-react";
import {
  uploadImage,
  compressImage,
} from "../../services/firebaseStorageService";
import { ImageWithFallback } from "../ImageWithFallback";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  currentUrl?: string | null;
  path: string;
  label?: string;
  onUploadStarted?: () => void;
  onUploadFinished?: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onRemove,
  currentUrl,
  path,
  label = "Imagem",
  onUploadStarted,
  onUploadFinished,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato não suportado.");
      return;
    }

    setError(null);
    setIsUploading(true);
    if (onUploadStarted) onUploadStarted();
    setUploadProgress(0);

    try {
      console.log('Starting compression...');
      const compressedFile = await compressImage(file);
      console.log('Compression complete, starting upload...');
      const { promise, task } = uploadImage(
        compressedFile,
        path,
        (progress) => {
          setUploadProgress(Math.round(progress));
        },
      );
      uploadTaskRef.current = task;
      const url = await promise;
      console.log('Upload complete, URL:', url);
      onUploadComplete(url);
    } catch (err: any) {
      console.error('Upload Error Details:', err);
      if (err.code === "storage/canceled") {
        setError("O upload foi cancelado.");
      } else {
        setError(err.message || "Erro ao enviar.");
      }
    } finally {
      setIsUploading(false);
      uploadTaskRef.current = null;
      if (onUploadFinished) onUploadFinished();
    }
  };

  const cancelUpload = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: fileInputRef.current } as any);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-black text-[#A09898] ml-2">
        {label}
      </label>

      <div
        className={`relative rounded-3xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center min-h-[160px] bg-white ${
          currentUrl
            ? "border-lilac/30"
            : "border-[#F0E6D2] hover:border-lilac/30"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {currentUrl ? (
          <div className="relative group w-full h-full p-2 flex items-center justify-center">
            <ImageWithFallback
              src={currentUrl}
              alt="Preview"
              className="max-h-[140px] rounded-2xl object-contain shadow-sm"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 p-8 cursor-pointer w-full text-center"
          >
            <div className="p-4 bg-lilac/5 text-lilac rounded-full">
              <Upload size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900">
                Clique ou arraste a imagem
              </p>
              <p className="text-[9px] font-bold text-[#A09898] uppercase tracking-widest">
                PNG, JPG ou WEBP até 5MB
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
            <Loader2 size={24} className="text-lilac animate-spin mb-4" />
            <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-lilac transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-lilac mt-2 uppercase tracking-widest">
              Enviando... {uploadProgress}%
            </p>
            <button
              onClick={cancelUpload}
              className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-9000 hover:text-rose-600"
            >
              <Ban size={12} /> Cancelar
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <p className="text-[10px] font-bold text-slate-9000 ml-2 mt-1 uppercase tracking-widest flex items-center gap-1">
          <X size={10} /> {error}
        </p>
      )}
    </div>
  );
};
