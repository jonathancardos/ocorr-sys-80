"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Upload, Loader2, X, FileText, Image } from "lucide-react"; // Adicionado Image e FileText para ícones
import { toast } from 'sonner'; // Import toast for error messages

export interface AttachmentItem {
  name: string;
  url: string;
}

export interface IncidentAttachmentsFormData {
  boFiles: AttachmentItem[];
  sapScreenshots: AttachmentItem[];
  riskReports: AttachmentItem[];
  omnilinkPhoto: AttachmentItem | null;
}

interface IncidentAttachmentsSectionProps {
  boFiles: AttachmentItem[];
  sapScreenshots: AttachmentItem[];
  riskReports: AttachmentItem[];
  omnilinkPhoto: AttachmentItem | null;
  handleFileUpload: (field: keyof IncidentAttachmentsFormData, files: FileList | File | null) => void; // More specific type for handleInputChange
  uploadingFiles: { [key: string]: boolean };
  handleRemoveAttachment: (field: keyof IncidentAttachmentsFormData, index: number) => void;
}

export const IncidentAttachmentsSection: React.FC<IncidentAttachmentsSectionProps> = ({
  boFiles,
  sapScreenshots,
  riskReports,
  omnilinkPhoto,
  handleFileUpload,
  uploadingFiles,
  handleRemoveAttachment,
}) => {
  console.log('IncidentAttachmentsSection: Re-rendering. Prop omnilinkPhoto:', omnilinkPhoto);
  console.log('IncidentAttachmentsSection: Received handleFileUpload prop type:', typeof handleFileUpload); // This log is already there.

  // ADDING THIS NEW LOG TO BE SURE
  console.log('IncidentAttachmentsSection (inside component): Type of handleFileUpload prop:', typeof handleFileUpload);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Failed to load image in preview:", e.currentTarget.src);
    e.currentTarget.src = '/placeholder.svg'; // Fallback to a generic placeholder image
    e.currentTarget.alt = 'Imagem não carregada';
    e.currentTarget.classList.add('bg-gray-200', 'p-2'); // Add some styling for placeholder
  };

  const renderAttachmentItem = (file: AttachmentItem, fieldName: keyof IncidentAttachmentsFormData, index: number) => {
    const isImage = file.name.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    const isPdf = file.name.match(/\.pdf$/i);

    console.log(`renderAttachmentItem for ${file.name}: isImage=${isImage}, isPdf=${isPdf}, url=${file.url}`);

    return (
      <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border border-border">
        <div className="flex items-center gap-2">
          {isImage ? (
            <img 
              src={file.url} 
              alt={file.name} 
              className="h-8 w-8 object-cover rounded-sm" 
              onError={handleImageError}
            />
          ) : isPdf ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Paperclip className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0.5 ml-1 text-destructive hover:bg-destructive/10"
          onClick={() => handleRemoveAttachment(fieldName, index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderFileList = (files: AttachmentItem[] | null | undefined, fieldName: keyof IncidentAttachmentsFormData) => {
    if (!Array.isArray(files) || files.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        {files.map((file, index) => renderAttachmentItem(file, fieldName, index))}
      </div>
    );
  };

  const renderSingleFile = (file: AttachmentItem | null, fieldName: keyof IncidentAttachmentsFormData) => {
    if (!file) return null;
    return (
      <div className="mt-2 space-y-2">
        {renderAttachmentItem(file, fieldName, 0)}
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Paperclip className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Anexos do Laudo</h2>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Anexos do B.O.</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={(e) => {
                if (typeof handleFileUpload === 'function') {
                  handleFileUpload("boFiles", e.target.files);
                } else {
                  console.error("handleFileUpload is not a function when trying to upload boFiles:", handleFileUpload);
                  toast.error("Erro interno", { description: "A função de upload de arquivos não está disponível." });
                }
              }}
              className="h-11"
              disabled={uploadingFiles.boFiles}
            />
            {uploadingFiles.boFiles && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(boFiles, "boFiles")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Prints do Sistema SAP</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (typeof handleFileUpload === 'function') {
                  handleFileUpload("sapScreenshots", e.target.files);
                } else {
                  console.error("handleFileUpload is not a function when trying to upload sapScreenshots:", handleFileUpload);
                  toast.error("Erro interno", { description: "A função de upload de arquivos não está disponível." });
                }
              }}
              className="h-11"
              disabled={uploadingFiles.sapScreenshots}
            />
            {uploadingFiles.sapScreenshots && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(sapScreenshots, "sapScreenshots")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Prints/Relatórios de Monitoramento de Risco</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => {
                if (typeof handleFileUpload === 'function') {
                  handleFileUpload("riskReports", e.target.files);
                } else {
                  console.error("handleFileUpload is not a function when trying to upload riskReports:", handleFileUpload);
                  toast.error("Erro interno", { description: "A função de upload de arquivos não está disponível." });
                }
              }}
              className="h-11"
              disabled={uploadingFiles.riskReports}
            />
            {uploadingFiles.riskReports && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(riskReports, "riskReports")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Foto Omnilink</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (typeof handleFileUpload === 'function') {
                  handleFileUpload("omnilinkPhoto", e.target.files?.[0] || null);
                } else {
                  console.error("handleFileUpload is not a function when trying to upload omnilinkPhoto:", handleFileUpload);
                  toast.error("Erro interno", { description: "A função de upload de arquivos não está disponível." });
                }
              }}
              className="h-11"
              disabled={uploadingFiles.omnilinkPhoto}
            />
            {uploadingFiles.omnilinkPhoto && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderSingleFile(omnilinkPhoto, "omnilinkPhoto")}
        </div>
      </div>
    </div>
  );
};