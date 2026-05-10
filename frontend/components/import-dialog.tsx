"use client"

import React, { useState, useRef } from "react"
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { 
  importCveData, 
  getCsvTemplate, 
  getJsonTemplate, 
  downloadTemplate, 
  validateImportFile,
  ImportResponse 
} from "@/services/import"

interface ImportDialogProps {
  onImportComplete?: (result: ImportResponse) => void
}

export function ImportDialog({ onImportComplete }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImportFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedFile(file)
    setError(null)
    setImportResult(null)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    const validation = validateImportFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedFile(file)
    setError(null)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await importCveData(selectedFile, overwrite)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setImportResult(result)
      
      if (onImportComplete) {
        onImportComplete(result)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async (type: 'csv' | 'json') => {
    try {
      const template = type === 'csv' 
        ? await getCsvTemplate()
        : await getJsonTemplate()
      
      downloadTemplate(template)
    } catch (err) {
      setError(`Failed to download ${type.toUpperCase()} template`)
    }
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setOverwrite(false)
    setIsUploading(false)
    setUploadProgress(0)
    setImportResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import CVE Data
          </DialogTitle>
          <DialogDescription>
            Upload CSV or JSON files to import CVE vulnerability data into the database.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="templates">Download Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : 'Choose a file or drag it here'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV and JSON files up to 50MB
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="outline">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwrite}
                    onCheckedChange={(checked) => setOverwrite(checked as boolean)}
                  />
                  <Label htmlFor="overwrite" className="text-sm">
                    Overwrite existing records with the same CVE ID
                  </Label>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Result */}
              {importResult && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">Import completed successfully!</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Records:</span> {importResult.total_records}
                        </div>
                        <div>
                          <span className="font-medium">Successful:</span> {importResult.successful_imports}
                        </div>
                        <div>
                          <span className="font-medium">Skipped:</span> {importResult.skipped_records}
                        </div>
                        <div>
                          <span className="font-medium">Errors:</span> {importResult.errors.length}
                        </div>
                      </div>
                      {importResult.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            View Errors ({importResult.errors.length})
                          </summary>
                          <div className="mt-2 max-h-32 overflow-y-auto">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <div key={index} className="text-xs p-2 bg-red-50 rounded mb-1">
                                <strong>Record:</strong> {JSON.stringify(error.record).substring(0, 50)}...
                                <br />
                                <strong>Error:</strong> {error.error}
                              </div>
                            ))}
                            {importResult.errors.length > 5 && (
                              <p className="text-xs text-gray-500">
                                ... and {importResult.errors.length - 5} more errors
                              </p>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download template files to see the expected format for importing CVE data.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-medium">CSV Template</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Comma-separated values format with column headers.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadTemplate('csv')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-medium">JSON Template</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    JavaScript Object Notation format with nested structure.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadTemplate('json')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON Template
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required fields:</strong> cve_id (CVE identifier)
                  <br />
                  <strong>Optional fields:</strong> description, published_date, cvss_base_score, 
                  cvss_base_severity, vendor, product, and other vulnerability metadata.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}