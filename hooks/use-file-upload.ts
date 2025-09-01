// IPDR File Upload Hook
'use client';

import { useState, useCallback, useRef } from 'react';
import { TelecomOperator } from '@/lib/types';

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  operator?: TelecomOperator;
  recordCount?: number;
}

interface UseFileUploadProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  initialFiles?: any[];
  onUpload?: (files: File[]) => Promise<void>;
}

interface FileUploadState {
  files: UploadFile[];
  isDragging: boolean;
  errors: string[];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function useFileUpload({
  accept = '.csv,.xlsx,.xls,.txt,.dat,.xml,.zip,.json',
  maxSize = 100 * 1024 * 1024, // 100MB
  multiple = false,
  maxFiles = 5,
  initialFiles = [],
  onUpload
}: UseFileUploadProps = {}) {
  const [state, setState] = useState<FileUploadState>({
    files: initialFiles.map(file => ({
      id: file.id || `file_${Date.now()}_${Math.random()}`,
      file: file,
      preview: file.url,
      status: 'completed'
    })),
    isDragging: false,
    errors: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${formatBytes(maxSize)}`;
    }

    // Check file type for IPDR files
    const validExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return `File type not supported. Accepted: ${validExtensions.join(', ')}`;
    }

    return null;
  }, [accept, maxSize]);

  const detectOperator = useCallback((filename: string): TelecomOperator | undefined => {
    const name = filename.toLowerCase();
    if (name.includes('airtel')) return 'airtel';
    if (name.includes('jio')) return 'jio';
    if (name.includes('vodafone') || name.includes('vi')) return 'vodafone';
    if (name.includes('bsnl')) return 'bsnl';
    return undefined;
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const errors: string[] = [];
    const validFiles: UploadFile[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      // Check if we're at max files
      if (state.files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const uploadFile: UploadFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        status: 'pending',
        operator: detectOperator(file.name),
        progress: 0
      };

      // Create preview for images (though IPDR files won't have previews)
      if (file.type.startsWith('image/')) {
        uploadFile.preview = URL.createObjectURL(file);
      }

      validFiles.push(uploadFile);
    }

    setState(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles],
      errors: errors.length > 0 ? errors : []
    }));

    // Auto-upload if onUpload is provided
    if (onUpload && validFiles.length > 0) {
      onUpload(validFiles.map(f => f.file));
    }
  }, [state.files.length, maxFiles, validateFile, detectOperator, onUpload]);

  const removeFile = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter(file => {
        if (file.id === id && file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return file.id !== id;
      })
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState(prev => {
      prev.files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      return {
        ...prev,
        files: [],
        errors: []
      };
    });
  }, []);

  const updateFileProgress = useCallback((id: string, progress: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(file =>
        file.id === id ? { ...file, progress } : file
      )
    }));
  }, []);

  const updateFileStatus = useCallback((id: string, status: UploadFile['status'], recordCount?: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(file =>
        file.id === id ? { ...file, status, recordCount } : file
      )
    }));
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setState(prev => ({ ...prev, isDragging: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [addFiles]);

  const getInputProps = useCallback(() => ({
    ref: fileInputRef,
    type: 'file' as const,
    accept,
    multiple,
    onChange: handleFileSelect
  }), [accept, multiple, handleFileSelect]);

  return [
    state,
    {
      addFiles,
      removeFile,
      clearFiles,
      updateFileProgress,
      updateFileStatus,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps
    }
  ] as const;
}