"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Upload, Download, Trash2, File, ImageIcon, FileText, Archive } from "lucide-react"

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadProgress?: number
  status: "uploading" | "completed" | "error"
  createdAt: Date
}

interface FileManagerProps {
  onFileUpload?: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  onFileDelete?: (fileId: string) => Promise<{ success: boolean; error?: string }>
  maxFileSize?: number
  acceptedFileTypes?: string[]
  showGoogleDriveIntegration?: boolean
}

export default function FileManager({
  onFileUpload,
  onFileDelete,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ["image/*", "application/pdf", "text/*", ".docx", ".xlsx"],
  showGoogleDriveIntegration = true,
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true)

      for (const file of acceptedFiles) {
        if (file.size > maxFileSize) {
          toast.error(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`)
          continue
        }

        const fileItem: FileItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadProgress: 0,
          status: "uploading",
          createdAt: new Date(),
        }

        setFiles((prev) => [...prev, fileItem])

        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 10, 90) } : f,
              ),
            )
          }, 200)

          let uploadResult = { success: false, url: "", error: "No upload handler provided" }

          if (onFileUpload) {
            uploadResult = await onFileUpload(file)
          } else {
            // Default upload to Vercel Blob
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (response.ok) {
              const result = await response.json()
              uploadResult = { success: true, url: result.url }
            } else {
              const error = await response.text()
              uploadResult = { success: false, error }
            }
          }

          clearInterval(progressInterval)

          if (uploadResult.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, uploadProgress: 100, status: "completed", url: uploadResult.url } : f,
              ),
            )
            toast.success(`${file.name} uploaded successfully`)
          } else {
            setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, status: "error" } : f)))
            toast.error(`Failed to upload ${file.name}: ${uploadResult.error}`)
          }
        } catch (error) {
          setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, status: "error" } : f)))
          toast.error(`Error uploading ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      setIsUploading(false)
    },
    [maxFileSize, onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    multiple: true,
  })

  const handleDelete = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (!file) return

    try {
      let deleteResult = { success: false, error: "No delete handler provided" }

      if (onFileDelete) {
        deleteResult = await onFileDelete(fileId)
      } else {
        // Default delete from Vercel Blob
        const response = await fetch(`/api/upload?fileId=${fileId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          deleteResult = { success: true }
        } else {
          const error = await response.text()
          deleteResult = { success: false, error }
        }
      }

      if (deleteResult.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
        toast.success(`${file.name} deleted successfully`)
      } else {
        toast.error(`Failed to delete ${file.name}: ${deleteResult.error}`)
      }
    } catch (error) {
      toast.error(`Error deleting ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleDownload = (file: FileItem) => {
    if (file.url) {
      const link = document.createElement("a")
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const connectGoogleDrive = async () => {
    try {
      const response = await fetch("/api/google/auth-url")
      const result = await response.json()

      if (result.success && result.authUrl) {
        window.open(result.authUrl, "_blank", "width=500,height=600")
        // Listen for auth completion
        const checkAuth = setInterval(async () => {
          const authResponse = await fetch("/api/google/status")
          const authResult = await authResponse.json()
          if (authResult.connected) {
            setGoogleDriveConnected(true)
            clearInterval(checkAuth)
            toast.success("Google Drive connected successfully")
          }
        }, 2000)
      } else {
        toast.error("Failed to get Google auth URL")
      }
    } catch (error) {
      toast.error("Error connecting to Google Drive")
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.includes("pdf") || type.includes("document")) return <FileText className="h-4 w-4" />
    if (type.includes("zip") || type.includes("archive")) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Manager
          </CardTitle>
          <CardDescription>Upload and manage your files. Drag and drop files or click to browse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">Maximum file size: {maxFileSize / 1024 / 1024}MB</p>
              </div>
            )}
          </div>

          {showGoogleDriveIntegration && (
            <div className="mt-4">
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Google Drive Integration</h4>
                  <p className="text-sm text-muted-foreground">Connect to upload files directly to Google Drive</p>
                </div>
                <Button
                  onClick={connectGoogleDrive}
                  variant={googleDriveConnected ? "secondary" : "default"}
                  disabled={googleDriveConnected}
                >
                  {googleDriveConnected ? "Connected" : "Connect Google Drive"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge
                          variant={
                            file.status === "completed"
                              ? "default"
                              : file.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {file.status}
                        </Badge>
                      </div>
                      {file.status === "uploading" && file.uploadProgress !== undefined && (
                        <Progress value={file.uploadProgress} className="mt-2 h-2" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "completed" && file.url && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(file.id)}
                      disabled={file.status === "uploading"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
