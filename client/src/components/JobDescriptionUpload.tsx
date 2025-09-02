import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import type { JobDescription } from "@shared/schema";

interface JobDescriptionUploadProps {
  userId: string;
  selectedJobDescriptionId?: string;
  onJobDescriptionSelect?: (jobDescription: JobDescription | null) => void;
}

export default function JobDescriptionUpload({ 
  userId, 
  selectedJobDescriptionId, 
  onJobDescriptionSelect 
}: JobDescriptionUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch user's job descriptions
  const { data: jobDescriptions = [], isLoading } = useQuery({
    queryKey: ['/api/job-descriptions/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/job-descriptions/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch job descriptions');
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('jobDescription', file);
      formData.append('userId', userId);

      const response = await fetch('/api/job-descriptions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (jobDescription) => {
      toast({
        title: "Job Description Uploaded",
        description: `${jobDescription.fileName} has been successfully uploaded.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions/user', userId] });
      if (onJobDescriptionSelect) {
        onJobDescriptionSelect(jobDescription);
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/job-descriptions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Description Deleted",
        description: "The job description has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-descriptions/user', userId] });
      if (onJobDescriptionSelect) {
        onJobDescriptionSelect(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete file.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, TXT, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4" />
          Upload Job Description (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            {uploadMutation.isPending ? 'Uploading...' : 'Drop your job description here or click to browse'}
          </p>
          <p className="text-xs text-gray-500">
            Supports PDF, TXT, DOC, DOCX files up to 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
        </div>

        {/* Uploaded Files List */}
        {isLoading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading job descriptions...</div>
        ) : jobDescriptions.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No job descriptions uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Uploaded Job Descriptions</Label>
            {jobDescriptions.map((jd: JobDescription) => (
              <div
                key={jd.id}
                className={`
                  flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                  ${selectedJobDescriptionId === jd.id ? 'border-primary-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
                onClick={() => onJobDescriptionSelect?.(jd)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {jd.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(jd.fileSize || 0)} • Uploaded {jd.uploadedAt ? formatDate(jd.uploadedAt) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(jd.fileUrl, '_blank');
                    }}
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(jd.id);
                    }}
                    disabled={deleteMutation.isPending}
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedJobDescriptionId && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Job description selected. AI feedback will be tailored to this role.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}