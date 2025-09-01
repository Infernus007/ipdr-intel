'use client';

import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon, CheckCircleIcon, LoaderIcon } from "lucide-react";
import { useFileUpload, formatBytes, UploadFile } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { useAppStore } from '@/lib/store';
import { TelecomOperator, EvidenceFile } from '@/lib/types';
import { getOperatorColor, getOperatorDisplayName } from '@/utils/formatters';
import { processAirtelFile, ProcessingProgress } from '@/lib/processing';
import { toast } from 'sonner';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

interface IPDRFileUploadProps {
  caseId: string;
  onFilesUploaded?: (files: EvidenceFile[]) => void;
}

const operatorColors = {
  airtel: '#E31E24',
  jio: '#0066CC', 
  vodafone: '#E60000',
  bsnl: '#FF6600'
};

export function IPDRFileUpload({ caseId, onFilesUploaded }: IPDRFileUploadProps) {
  const maxSizeMB = 2048; // Increased to 2GB for enterprise files
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 10; // Increased for batch processing
  const walkthroughTarget = useWalkthroughTarget('upload-area');
  
  const { addEvidenceFile, updateEvidenceFile, addRecords, attachFileToCase, currentCase } = useAppStore();

  const handleUpload = async (files: File[]) => {
    if (!currentCase) {
      toast.error('No active case selected');
      return;
    }
    
    for (const file of files) {
      const operator = detectOperator(file.name);
      if (operator === 'airtel') {
        const fileSize = (file.size / 1024 / 1024).toFixed(1); // MB
        let progressToast: string | number | null = null;
        
        try {
          // Show initial processing toast
          progressToast = toast.info(`Processing ${file.name} (${fileSize} MB)...`, {
            duration: Infinity // Keep until we dismiss it
          });
          
          const { evidence, records } = await processAirtelFile(
            file, 
            currentCase.id,
            (progress: ProcessingProgress) => {
              // Update progress toast for large files
              if (file.size > 50 * 1024 * 1024) { // > 50MB
                const percent = Math.round((progress.processedBytes / progress.totalBytes) * 100);
                const throughputMB = progress.throughput.toFixed(1);
                const etaMinutes = Math.round(progress.estimatedTimeRemaining / 60000);
                
                if (progressToast) {
                  toast.dismiss(progressToast);
                }
                progressToast = toast.info(
                  `Processing ${file.name} - ${percent}% complete`, 
                  {
                    description: `${progress.processedRows.toLocaleString()} records processed • ${throughputMB} MB/s • ETA: ${etaMinutes}m`,
                    duration: Infinity
                  }
                );
              }
            }
          );
          
          // Dismiss progress toast
          if (progressToast) {
            toast.dismiss(progressToast);
          }
          
          const evidenceWithStatus: EvidenceFile = {
            ...evidence,
            status: 'completed',
            recordCount: records.length,
            errorCount: 0
          };
          addEvidenceFile(evidenceWithStatus);
          attachFileToCase(currentCase.id, evidenceWithStatus);
          addRecords(records);
          
          toast.success(`Successfully processed ${file.name}`, {
            description: `${records.length.toLocaleString()} records parsed • ${evidence.sha256.slice(0, 8)}... hash verified • ${fileSize} MB processed`
          });
        } catch (error) {
          console.error('File processing failed:', error);
          
          // Dismiss progress toast on error
          if (progressToast) {
            toast.dismiss(progressToast);
          }
          
          // Show specific error message
          let errorMessage = 'File processing failed';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          toast.error(`Failed to process ${file.name}`, {
            description: errorMessage
          });
          
          toast.error(`Failed to process ${file.name}`, {
            description: error instanceof Error ? error.message : 'Please check the file format and try again'
          });
        }
      } else {
        toast.warning(`${file.name} not recognized as Airtel format`, {
          description: 'Only Airtel IPDR files are currently supported'
        });
      }
    }
  };

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: ".csv,.xlsx,.xls,.txt,.dat,.xml,.zip",
    maxSize,
    multiple: true,
    maxFiles,
    onUpload: handleUpload
  });

  const detectOperator = (filename: string): TelecomOperator | undefined => {
    const name = filename.toLowerCase();
    if (name.includes('airtel')) return 'airtel';
    if (name.includes('jio')) return 'jio';
    if (name.includes('vodafone') || name.includes('vi')) return 'vodafone';
    if (name.includes('bsnl')) return 'bsnl';
    
    // For demo purposes, default to airtel if no operator detected
    // In production, this would be determined by file content analysis
    return 'airtel';
  };

  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return <LoaderIcon className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <FileTextIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading...';
      case 'completed':
        return `Completed • ${file.recordCount || 0} records`;
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-48 flex-col items-center overflow-hidden rounded-xl border border-dashed p-6 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
        {...walkthroughTarget}
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload IPDR file"
        />
        
        <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
          <div
            className="bg-background mb-3 flex size-12 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <FileTextIcon className="size-5 opacity-60" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Upload IPDR Files</h3>
          <p className="mb-1.5 text-sm font-medium">Drop your IPDR files here</p>
          <p className="text-muted-foreground text-sm mb-4">
            Supports CSV, Excel, XML, TXT, DAT files (max. {maxSizeMB}MB each) • Enterprise-grade streaming processing
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(operatorColors).map(([operator, color]) => (
              <div key={operator} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${color}15`, color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {getOperatorDisplayName(operator as TelecomOperator)}
              </div>
            ))}
          </div>
          
          <Button variant="outline" onClick={openFileDialog}>
            <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
            Select IPDR Files
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div
              key={index}
              className="text-destructive flex items-center gap-2 text-sm p-3 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              <AlertCircleIcon className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Uploaded Files ({files.length})</h4>
            {files.length > 1 && (
              <Button size="sm" variant="outline" onClick={clearFiles}>
                Remove all
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-background flex items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-accent">
                    {getStatusIcon(file)}
                  </div>
                  
                  <div className="flex min-w-0 flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {file.file.name}
                      </p>
                      {file.operator && (
                        <div 
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${operatorColors[file.operator]}15`, 
                            color: operatorColors[file.operator] 
                          }}
                        >
                          {getOperatorDisplayName(file.operator)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatBytes(file.file.size)}</span>
                      <span>•</span>
                      <span>{getStatusText(file)}</span>
                    </div>
                    
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground/80 hover:text-foreground size-8 hover:bg-transparent shrink-0"
                  onClick={() => removeFile(file.id)}
                  aria-label="Remove file"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Files will be automatically parsed and analyzed after upload
          </p>
        </div>
      )}
    </div>
  );
}
