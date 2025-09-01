'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppStore } from '@/lib/store';
import { Case } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

interface CreateCaseDialogProps {
  onCaseCreated?: (caseItem: Case) => void;
}

export function CreateCaseDialog({ onCaseCreated }: CreateCaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  
  const { addCase, setCurrentCase } = useAppStore();
  const walkthroughTarget = useWalkthroughTarget('create-case');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;
    
    setIsCreating(true);
    
    // Simulate case creation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a truly unique ID using timestamp + random string
    const uniqueId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCase: Case = {
      id: uniqueId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      status: 'active',
      createdBy: 'Detective Sarah Johnson',
      createdAt: new Date(),
      updatedAt: new Date(),
      evidenceFiles: [],
      recordCount: 0,
      anomalyCount: 0
    };
    
    addCase(newCase);
    setCurrentCase(newCase);
    
    // Reset form
    setFormData({ title: '', description: '' });
    setIsCreating(false);
    setIsOpen(false);
    
    // Notify parent
    onCaseCreated?.(newCase);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" {...walkthroughTarget}>
          <Plus className="h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Investigation Case</DialogTitle>
            <DialogDescription>
              Create a new case to start analyzing IPDR data from telecom operators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="case-title" className="text-sm font-medium">
                Case Title *
              </label>
              <input
                id="case-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Operation Digital Trail"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                required
                disabled={isCreating}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="case-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="case-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the investigation..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!formData.title.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
