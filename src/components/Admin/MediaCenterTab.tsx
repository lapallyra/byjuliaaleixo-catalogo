import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderPlus,
  UploadCloud,
  Grid,
  List,
  Search,
  MoreVertical,
  ChevronRight,
  Eye,
  Edit3,
  ExternalLink,
  Copy,
  Trash2,
  FileText,
  File,
  X,
  Plus,
  Check,
  ChevronLeft,
  Move,
  ArrowRight,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  subscribeToMediaFolders,
  saveMediaFolder,
  deleteMediaFolder,
  subscribeToMediaFiles,
  saveMediaFile,
  deleteMediaFile,
  subscribeToCollections,
  subscribeToProducts,
} from "../../services/firebaseService";
import { uploadImage, deleteImage } from "../../services/firebaseStorageService";
import { ImageWithFallback } from "../ImageWithFallback";

// Interfaces
interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt?: any;
}

interface MediaFile {
  id: string;
  name: string;
  url: string;
  format: string;
  size: number;
  dimensions: string;
  origin: string;
  folderId: string | null;
  createdAt?: any;
}

export const MediaCenterTab: React.FC = () => {
  // DB States
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout & Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");

  // Selection & Details panel
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  // Active uploads queue
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);

  // Modals / Modifiers
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingItem, setMovingItem] = useState<{ type: "folder" | "file"; item: any } | null>(null);
  const [renamingItem, setRenamingItem] = useState<{ type: "folder" | "file"; item: any } | null>(null);
  const [renamingName, setRenamingName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Real Data
  useEffect(() => {
    const unsubFolders = subscribeToMediaFolders((data) => {
      setFolders(data);
      // Pre-populate default folders if completely empty
      if (data.length === 0) {
        const defaults = [
          "Produtos",
          "Categorias",
          "Coleções",
          "Banner",
          "Lista de Presentes",
          "Logotipos",
          "Ícones",
          "Temporários",
          "Outros",
        ];
        defaults.forEach((name) => {
          saveMediaFolder({ name, parentId: null });
        });
      }
    });

    const unsubFiles = subscribeToMediaFiles((data) => {
      setFiles(data);
      setLoading(false);
    });

    const unsubCols = subscribeToCollections((data) => {
      setCollections(data);
    });

    const unsubProds = subscribeToProducts((data) => {
      setProducts(data);
    });

    return () => {
      unsubFolders();
      unsubFiles();
      unsubCols();
      unsubProds();
    };
  }, []);

  // Update selected file references if lists update
  useEffect(() => {
    if (selectedFile) {
      const updated = files.find((f) => f.id === selectedFile.id);
      if (updated) setSelectedFile(updated);
    }
  }, [files]);

  // Formats bytes
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get date string
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Raiz" }];
    if (!currentFolderId) return crumbs;

    const path: { id: string; name: string }[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = current.parentId ? folders.find((f) => f.id === current.parentId) : undefined;
    }
    return [...crumbs, ...path];
  };

  // Folder creation
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await saveMediaFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId,
      });
      setNewFolderName("");
      setIsNewFolderOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar pasta.");
    }
  };

  // Rename item
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem || !renamingName.trim()) return;

    try {
      if (renamingItem.type === "folder") {
        await saveMediaFolder({ ...renamingItem.item, name: renamingName.trim() });
      } else {
        await saveMediaFile({ ...renamingItem.item, name: renamingName.trim() });
      }
      setRenamingItem(null);
      setRenamingName("");
    } catch (err) {
      console.error(err);
      alert("Erro ao renomear.");
    }
  };

  // Move item
  const handleMove = async (targetFolderId: string | null) => {
    if (!movingItem) return;

    try {
      if (movingItem.type === "folder") {
        // Prevent moving a folder into itself
        if (movingItem.item.id === targetFolderId) {
          alert("Não é possível mover uma pasta para dentro de si mesma.");
          return;
        }
        await saveMediaFolder({ ...movingItem.item, parentId: targetFolderId });
      } else {
        await saveMediaFile({ ...movingItem.item, folderId: targetFolderId });
      }
      setMovingItem(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao mover.");
    }
  };

  // Duplicate file
  const handleDuplicateFile = async (file: MediaFile) => {
    try {
      const duplicated: Omit<MediaFile, "id"> = {
        name: `${file.name.replace(/\.[^/.]+$/, "")} (Cópia).${file.format}`,
        url: file.url,
        format: file.format,
        size: file.size,
        dimensions: file.dimensions,
        origin: file.origin,
        folderId: file.folderId,
      };
      await saveMediaFile(duplicated);
    } catch (err) {
      console.error(err);
      alert("Erro ao duplicar arquivo.");
    }
  };

  // Delete item
  const handleDeleteItem = async (type: "folder" | "file", item: any) => {
    if (!confirm(`Deseja realmente excluir este(a) ${type === "folder" ? "pasta" : "arquivo"}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      if (type === "folder") {
        // Find nested subfolders and files to move them to parent or delete
        const childFolders = folders.filter((f) => f.parentId === item.id);
        const childFiles = files.filter((f) => f.folderId === item.id);

        // Batch update children to move them up
        for (const cf of childFolders) {
          await saveMediaFolder({ ...cf, parentId: item.parentId });
        }
        for (const cf of childFiles) {
          await saveMediaFile({ ...cf, folderId: item.parentId });
        }

        await deleteMediaFolder(item.id);
      } else {
        // Delete from firestore
        await deleteMediaFile(item.id);
        // Optional: delete from firebase storage if it was directly uploaded and not external
        if (item.url.includes("firebasestorage.googleapis.com")) {
          try {
            await deleteImage(item.url);
          } catch (e) {
            console.warn("Storage deletion warning (might already be deleted or permission denied):", e);
          }
        }
        if (selectedFile?.id === item.id) {
          setSelectedFile(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir.");
    }
  };

  // Upload handler
  const handleFileUpload = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    const items = Array.from(filesToUpload);

    items.forEach((file) => {
      const queueId = Math.random().toString(36).substr(2, 9);
      const format = file.name.split(".").pop()?.toLowerCase() || "unknown";

      // Add to UI queue
      const newQueueItem = {
        id: queueId,
        name: file.name,
        progress: 0,
        status: "uploading",
        task: null,
      };

      setUploadQueue((prev) => [...prev, newQueueItem]);

      // Measure dimensions for images
      let dimensions = "-";
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          dimensions = `${img.width}x${img.height}`;
        };
        img.src = URL.createObjectURL(file);
      }

      // Execute upload
      const path = `media_center/${currentFolderId || "root"}`;
      const { promise, task } = uploadImage(file, path, (prog) => {
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, progress: Math.round(prog) } : item))
        );
      });

      // Track task in state so we can cancel it
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, task } : item))
      );

      promise
        .then(async (downloadUrl) => {
          // Save to Firestore
          await saveMediaFile({
            name: file.name,
            url: downloadUrl,
            format,
            size: file.size,
            dimensions: dimensions || "-",
            origin: "Central de Mídia",
            folderId: currentFolderId,
          });

          // Mark complete in queue
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, progress: 100, status: "completed" } : item
            )
          );

          // Clear completed items after 2s
          setTimeout(() => {
            setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
          }, 2000);
        })
        .catch((err) => {
          console.error("Upload error:", err);
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? { ...item, status: err.code === "storage/canceled" ? "canceled" : "error" }
                : item
            )
          );
        });
    });
  };

  const cancelQueueUpload = (item: any) => {
    if (item.task) {
      item.task.cancel();
    }
    setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  // Copy URL
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copiada para a área de transferência!");
  };

  // Filtering and Searching
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentFiles = files.filter((f) => f.folderId === currentFolderId);

  const filteredFolders = currentFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = currentFiles.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat =
      formatFilter === "ALL" ||
      (formatFilter === "OTHER" && !["png", "webp", "jpg", "jpeg", "svg", "pdf"].includes(f.format)) ||
      f.format === formatFilter.toLowerCase() ||
      (formatFilter === "JPG" && (f.format === "jpg" || f.format === "jpeg"));

    return matchesSearch && matchesFormat;
  });

  // Calculate usage of a file
  const getFileUsage = (fileUrl: string) => {
    const usedCollections = collections.filter(
      (c) => c.image === fileUrl || c.banner === fileUrl
    );
    const usedProducts = products.filter(
      (p) => p.image === fileUrl || p.image_hover === fileUrl || p.images?.includes(fileUrl)
    );
    return { collections: usedCollections, products: usedProducts };
  };

  // Icon selector based on extension
  const getFileIcon = (format: string) => {
    const fmt = format.toLowerCase();
    if (["png", "webp", "jpg", "jpeg", "svg"].includes(fmt)) {
      return null; // indicates to show image preview
    }
    if (fmt === "pdf") {
      return <FileText className="text-red-500" size={32} />;
    }
    return <File className="text-[#8E8E93]" size={32} />;
  };

  return (
    <div
      className="space-y-8 animate-in fade-in duration-500 pb-12 select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
            <UploadCloud size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1C1C1E] tracking-tight">
              Central de Mídia
            </h3>
            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-1">
              Biblioteca de Arquivos • Vitrine & La Pallyra Studio
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FolderPlus size={16} /> Nova Pasta
          </button>

          <button
            onClick={triggerFileInput}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1C1E] text-white hover:bg-black rounded-xl font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <UploadCloud size={16} /> Upload Arquivos
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* TOP CONTROLS: SEARCH, FILTERS, VIEW MODES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-xs">
        {/* Search */}
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={15} />
          <input
            type="text"
            placeholder="PESQUISAR ARQUIVO PELO NOME..."
            className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-5 flex flex-wrap gap-1.5 items-center">
          {["ALL", "PNG", "WEBP", "JPG", "SVG", "PDF", "OTHER"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFormatFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                formatFilter === filter
                  ? "bg-[#1C1C1E] text-white border-[#1C1C1E]"
                  : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:border-[#1C1C1E]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Layout Mode */}
        <div className="lg:col-span-2 flex items-center justify-end gap-1.5 border-t lg:border-t-0 pt-2 lg:pt-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#F5F5F7] text-[#1C1C1E] border-[#E5E5EA]"
                : "bg-white text-[#8E8E93] border-transparent hover:border-[#E5E5EA]"
            }`}
            title="Visualização em Grade"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-[#F5F5F7] text-[#1C1C1E] border-[#E5E5EA]"
                : "bg-white text-[#8E8E93] border-transparent hover:border-[#E5E5EA]"
            }`}
            title="Visualização em Lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* UPLOAD QUEUE */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#fffdfa] border border-[#e8dcc8] rounded-2xl p-4 space-y-3 shadow-md"
          >
            <h4 className="text-[10px] uppercase font-bold text-[#cca062] tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> Fila de Envios ({uploadQueue.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-[#E5E5EA]">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold truncate text-[#1C1C1E]">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-[#F5F5F7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1C1C1E] transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-[#8E8E93]">
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "completed" ? (
                      <span className="text-[9px] font-bold text-[#34C759] uppercase bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                        Sucesso
                      </span>
                    ) : item.status === "error" ? (
                      <span className="text-[9px] font-bold text-[#FF3B30] uppercase bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        Erro
                      </span>
                    ) : (
                      <button
                        onClick={() => cancelQueueUpload(item)}
                        className="p-1 hover:bg-[#F5F5F7] rounded-md text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
                        title="Cancelar Envio"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BREADCRUMBS & INNER DIRECTORY INDICATOR */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8E8E93] bg-[#F5F5F7] px-4 py-3 rounded-xl border border-[#E5E5EA]">
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.id || "root"}>
            {idx > 0 && <ChevronRight size={14} className="text-[#D1D1D6]" />}
            <button
              onClick={() => {
                setCurrentFolderId(crumb.id);
                setSelectedFile(null);
              }}
              className={`hover:text-[#1C1C1E] transition-colors cursor-pointer ${
                currentFolderId === crumb.id ? "text-[#1C1C1E] font-bold" : ""
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* DRAG-DROP SENSITIVE ZONE AND MAIN LIBRARY CONTENT */}
      <div className="relative min-h-[400px] bg-[#fffdfa] border border-[#E5E5EA] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        {loading ? (
          <div className="h-64 flex items-center justify-center flex-1">
            <div className="w-8 h-8 border-4 border-[#1C1C1E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 flex-1">
            <UploadCloud size={48} className="text-[#D1D1D6] mb-4" />
            <h4 className="text-sm font-bold text-[#1C1C1E]">Arraste arquivos aqui</h4>
            <p className="text-xs text-[#8E8E93] max-w-sm mt-1">
              Selecione pastas acima ou arraste imagens diretamente para esta área para iniciar o upload automático.
            </p>
          </div>
        ) : (
          <div className="space-y-8 flex-1">
            {/* SUBFOLDERS SECTION */}
            {filteredFolders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest block ml-1">
                  Pastas ({filteredFolders.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] hover:shadow-md rounded-2xl p-4 flex flex-col justify-between items-start gap-4 transition-all"
                    >
                      {/* Folder visual row */}
                      <div
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="w-full flex flex-col gap-2 cursor-pointer"
                      >
                        <Folder className="text-[#cca062] group-hover:scale-105 transition-transform" size={32} />
                        <span className="text-xs font-bold text-[#1C1C1E] line-clamp-2 truncate">
                          {folder.name}
                        </span>
                      </div>

                      {/* Folder contextual actions overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-md px-1 py-0.5 rounded-lg border border-[#E5E5EA]">
                        <button
                          onClick={() => {
                            setRenamingItem({ type: "folder", item: folder });
                            setRenamingName(folder.name);
                          }}
                          className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                          title="Renomear"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => setMovingItem({ type: "folder", item: folder })}
                          className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                          title="Mover"
                        >
                          <Move size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem("folder", folder)}
                          className="p-1 hover:bg-rose-50 rounded text-[#8E8E93] hover:text-[#FF3B30]"
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILES LIBRARY SECTION */}
            {filteredFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest block ml-1">
                  Arquivos ({filteredFiles.length})
                </h4>

                {/* VIEW GRID MODE */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredFiles.map((file) => {
                      const icon = getFileIcon(file.format);
                      const isSelected = selectedFile?.id === file.id;

                      return (
                        <div
                          key={file.id}
                          className={`group relative bg-white border rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer ${
                            isSelected
                              ? "border-[#1C1C1E] ring-2 ring-[#1C1C1E]/5 shadow-sm"
                              : "border-[#E5E5EA] hover:border-dark-gray/30"
                          }`}
                          onClick={() => setSelectedFile(file)}
                        >
                          {/* Miniature Preview container */}
                          <div className="relative aspect-square bg-[#F5F5F7] border-b border-[#E5E5EA] flex items-center justify-center overflow-hidden">
                            {icon === null ? (
                              <ImageWithFallback
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              icon
                            )}

                            {/* Badge with Format */}
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-md text-[8px] font-bold uppercase tracking-wider text-[#1C1C1E] border border-[#E5E5EA] rounded-md">
                              {file.format}
                            </div>
                          </div>

                          {/* Detail summary */}
                          <div className="p-3.5 space-y-1">
                            <p className="text-[11px] font-bold text-[#1C1C1E] truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center justify-between">
                              <span>{formatBytes(file.size)}</span>
                              <span>{file.dimensions !== "-" ? file.dimensions : ""}</span>
                            </p>
                          </div>

                          {/* Quick Operations panel inside card */}
                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-[#E5E5EA] shadow-sm" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedFile(file)}
                              className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                              title="Ver Detalhes"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setRenamingItem({ type: "file", item: file });
                                setRenamingName(file.name);
                              }}
                              className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                              title="Renomear"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => setMovingItem({ type: "file", item: file })}
                              className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                              title="Mover de Pasta"
                            >
                              <Move size={12} />
                            </button>
                            <button
                              onClick={() => handleDuplicateFile(file)}
                              className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                              title="Duplicar"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => handleCopyUrl(file.url)}
                              className="p-1 hover:bg-[#F5F5F7] rounded text-[#8E8E93] hover:text-[#1C1C1E]"
                              title="Copiar Link"
                            >
                              <ExternalLink size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("file", file)}
                              className="p-1 hover:bg-rose-50 rounded text-[#8E8E93] hover:text-[#FF3B30]"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* VIEW LIST MODE */
                  <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden bg-white shadow-xs divide-y divide-[#E5E5EA]">
                    {filteredFiles.map((file) => {
                      const icon = getFileIcon(file.format);
                      const isSelected = selectedFile?.id === file.id;

                      return (
                        <div
                          key={file.id}
                          onClick={() => setSelectedFile(file)}
                          className={`flex items-center justify-between p-3.5 hover:bg-[#F5F5F7] transition-colors cursor-pointer ${
                            isSelected ? "bg-[#F5F5F7]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {/* Small thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden shrink-0 flex items-center justify-center">
                              {icon === null ? (
                                <ImageWithFallback
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="scale-75">{icon}</div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#1C1C1E] truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-0.5">
                                <span className="bg-white border border-[#E5E5EA] px-1.5 py-0.5 rounded text-[8px] text-[#1C1C1E]">
                                  {file.format}
                                </span>
                                <span>{formatBytes(file.size)}</span>
                                {file.dimensions !== "-" && <span>{file.dimensions}</span>}
                                <span>{formatDate(file.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Row Actions menu */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleCopyUrl(file.url)}
                              className="p-2 border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                              title="Copiar URL"
                            >
                              <ExternalLink size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setRenamingItem({ type: "file", item: file });
                                setRenamingName(file.name);
                              }}
                              className="p-2 border border-[#E5E5EA] hover:border-[#1C1C1E] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                              title="Renomear"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("file", file)}
                              className="p-2 border border-[#E5E5EA] hover:border-[#FF3B30] hover:bg-rose-50 rounded-xl text-[#8E8E93] hover:text-[#FF3B30] transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETALHES SIDEBAR PANEL */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 bg-black/5 backdrop-blur-xs z-[100] flex justify-end" onClick={() => setSelectedFile(null)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-[#E5E5EA]"
            >
              {/* Panel Header */}
              <div className="px-6 py-5 border-b border-[#E5E5EA] flex items-center justify-between shrink-0 bg-[#F5F5F7]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white border border-[#E5E5EA] rounded-lg text-[#1C1C1E]">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1C1E]">
                      Detalhes do Arquivo
                    </h4>
                    <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider">
                      Uso & Especificações do Arquivo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 hover:bg-white rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5EA]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sidebar Body */}
              <div className="p-6 space-y-8 flex-1">
                {/* Preview Image Frame */}
                <div className="aspect-square bg-[#F5F5F7] rounded-2xl border border-[#E5E5EA] overflow-hidden flex items-center justify-center relative p-4 shadow-inner">
                  {getFileIcon(selectedFile.format) === null ? (
                    <ImageWithFallback
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="scale-150">{getFileIcon(selectedFile.format)}</div>
                  )}
                </div>

                {/* Specs metadata */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest border-b border-[#E5E5EA] pb-2">
                    Metadados Técnicos
                  </h4>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Nome</span>
                      <span className="font-bold text-[#1C1C1E] break-all">{selectedFile.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Formato</span>
                      <span className="font-bold text-[#1C1C1E] uppercase">{selectedFile.format}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Peso / Tamanho</span>
                      <span className="font-bold text-[#1C1C1E]">{formatBytes(selectedFile.size)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Dimensões</span>
                      <span className="font-bold text-[#1C1C1E]">{selectedFile.dimensions}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Data de Envio</span>
                      <span className="font-bold text-[#1C1C1E]">{formatDate(selectedFile.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8E8E93] block uppercase">Origem</span>
                      <span className="font-bold text-[#1C1C1E]">{selectedFile.origin}</span>
                    </div>
                  </div>
                </div>

                {/* Detect System Usages */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-widest border-b border-[#E5E5EA] pb-2">
                    Onde está sendo Utilizado?
                  </h4>

                  {(() => {
                    const usage = getFileUsage(selectedFile.url);
                    const noUsage = usage.collections.length === 0 && usage.products.length === 0;

                    if (noUsage) {
                      return (
                        <div className="p-4 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl flex items-center gap-3 text-xs text-[#8E8E93]">
                          <AlertCircle size={16} />
                          <span>Este arquivo não está sendo utilizado por nenhuma coleção ou produto atualmente.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {usage.collections.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-[#8E8E93] uppercase block">Coleções</span>
                            <div className="space-y-1.5">
                              {usage.collections.map((col) => (
                                <div key={col.id} className="p-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl flex items-center gap-3">
                                  <Folder size={14} className="text-[#cca062]" />
                                  <span className="text-xs font-bold text-[#1C1C1E]">{col.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {usage.products.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-[#8E8E93] uppercase block">Produtos</span>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {usage.products.map((prod) => (
                                <div key={prod.id} className="p-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl flex items-center gap-3">
                                  <div className="w-6 h-6 rounded bg-white overflow-hidden border border-[#E5E5EA] shrink-0">
                                    <img src={prod.image} alt={prod.product_name} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-xs font-bold text-[#1C1C1E] truncate">{prod.product_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Link buttons */}
                <div className="pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => handleCopyUrl(selectedFile.url)}
                    className="w-full py-3 bg-[#F5F5F7] border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] text-xs font-semibold rounded-xl tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
                  >
                    <Copy size={14} /> Copiar URL do Arquivo
                  </button>

                  <a
                    href={selectedFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-[#1C1C1E] text-white hover:bg-black text-xs font-semibold rounded-xl tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
                  >
                    <ExternalLink size={14} /> Abrir em Nova Guia
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW FOLDER MODAL */}
      <AnimatePresence>
        {isNewFolderOpen && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#E5E5EA] shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2">
                <FolderPlus size={18} className="text-[#cca062]" /> Nova Pasta Personalizada
              </h3>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Nome da Pasta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Primavera, Banners Principais"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewFolderOpen(false);
                      setNewFolderName("");
                    }}
                    className="px-4 py-2 border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1C1C1E] text-white hover:bg-black rounded-xl text-xs font-semibold transition-colors"
                  >
                    Criar Pasta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENAME MODAL */}
      <AnimatePresence>
        {renamingItem && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-[#E5E5EA] shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Renomear {renamingItem.type === "folder" ? "Pasta" : "Arquivo"}
              </h3>

              <form onSubmit={handleRename} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#8E8E93]">Novo Nome</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#1C1C1E]"
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenamingItem(null)}
                    className="px-4 py-2 border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1C1C1E] text-white hover:bg-black rounded-xl text-xs font-semibold transition-colors"
                  >
                    Renomear
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOVE MODAL */}
      <AnimatePresence>
        {movingItem && (
          <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E5E5EA] shadow-2xl space-y-4"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2">
                  <Move size={18} className="text-[#cca062]" /> Mover Item
                </h3>
                <p className="text-[9px] text-[#8E8E93] font-bold uppercase tracking-wider">
                  Mover "{movingItem.item.name}" para outro diretório
                </p>
              </div>

              {/* List of folders */}
              <div className="border border-[#E5E5EA] rounded-xl max-h-60 overflow-y-auto divide-y divide-[#E5E5EA] bg-[#F5F5F7]">
                {/* Raiz folder trigger */}
                <div
                  onClick={() => handleMove(null)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white transition-colors"
                >
                  <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-2">
                    <Folder size={14} className="text-[#cca062]" /> [Diretório Raiz]
                  </span>
                  <ArrowRight size={14} className="text-[#8E8E93]" />
                </div>

                {folders
                  // Prevent moving inside itself or sub-structures
                  .filter((f) => f.id !== movingItem.item.id)
                  .map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => handleMove(folder.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white transition-colors"
                    >
                      <span className="text-xs font-bold text-[#1C1C1E] flex items-center gap-2">
                        <Folder size={14} className="text-[#cca062]" /> {folder.name}
                      </span>
                      <ArrowRight size={14} className="text-[#8E8E93]" />
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setMovingItem(null)}
                  className="px-4 py-2 border border-[#E5E5EA] rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
