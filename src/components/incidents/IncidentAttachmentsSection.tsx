import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Upload, Loader2, X, FileText, Image } from "lucide-react"; // Adicionado Image e FileText para ícones

interface AttachmentItem {
  name: string;
  url: string;
}

interface IncidentAttachmentsSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  uploadingFiles: { [key: string]: boolean };
  handleRemoveAttachment: (field: string, index: number) => void; // Nova prop para remover anexo
}

export const IncidentAttachmentsSection: React.FC<IncidentAttachmentsSectionProps> = ({
  formData,
  handleInputChange,
  uploadingFiles,
  handleRemoveAttachment,
}) => {
  const renderAttachmentItem = (file: AttachmentItem, fieldName: string, index: number) => {
    const isImage = file.name.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    const isPdf = file.name.match(/\.pdf$/i);

    return (
      <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border border-border">
        <div className="flex items-center gap-2">
          {isImage ? (
            <img src={file.url} alt={file.name} className="h-8 w-8 object-cover rounded-sm" />
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

  const renderFileList = (files: AttachmentItem[], fieldName: string) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        {files.map((file, index) => renderAttachmentItem(file, fieldName, index))}
      </div>
    );
  };

  const renderSingleFile = (file: AttachmentItem | null, fieldName: string) => {
    if (!file) return null;
    return (
      <div className="mt-2 space-y-2">
        {renderAttachmentItem(file, fieldName, 0)} {/* Single file, so index is 0 */}
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
              onChange={(e) => handleInputChange("boFiles", e.target.files)}
              className="h-11"
              disabled={uploadingFiles.boFiles}
            />
            {uploadingFiles.boFiles && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(formData.boFiles, "boFiles")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Prints do Sistema SAP</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleInputChange("sapScreenshots", e.target.files)}
              className="h-11"
              disabled={uploadingFiles.sapScreenshots}
            />
            {uploadingFiles.sapScreenshots && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(formData.sapScreenshots, "sapScreenshots")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Prints/Relatórios de Monitoramento de Risco</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => handleInputChange("riskReports", e.target.files)}
              className="h-11"
              disabled={uploadingFiles.riskReports}
            />
            {uploadingFiles.riskReports && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderFileList(formData.riskReports, "riskReports")}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Foto Omnilink</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleInputChange("omnilinkPhoto", e.target.files?.[0])}
              className="h-11"
              disabled={uploadingFiles.omnilinkPhoto}
            />
            {uploadingFiles.omnilinkPhoto && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {renderSingleFile(formData.omnilinkPhoto, "omnilinkPhoto")}
        </div>
      </div>
    </div>
  );
};