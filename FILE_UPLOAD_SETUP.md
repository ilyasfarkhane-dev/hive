# File Upload System Documentation

## Overview
This document describes the file upload system for project submissions in the ICESCO Portal.

## Features
- **Upload Location**: Files are stored in `public/uploads/` folder
- **Supported File Types**: PDF, DOCX, DOC, PNG, JPG, JPEG, XLSX, PPTX
- **File Size Limit**: 10MB per file
- **Multiple Files**: Users can upload multiple files per project
- **Automatic Validation**: File type and size validation on both client and server side

## System Components

### 1. Upload API Endpoint
**Location**: `app/api/upload-documents/route.ts`

**Functionality**:
- Accepts multiple files via FormData
- Validates file type and size
- Generates unique filenames to avoid conflicts
- Stores files in `public/uploads/`
- Returns file metadata including server path

**Request Format**:
```
POST /api/upload-documents
Content-Type: multipart/form-data
Body: FormData with 'files' field containing File objects
```

**Response Format**:
```json
{
  "success": true,
  "files": [
    {
      "originalName": "document.pdf",
      "fileName": "1234567890_abc123_document.pdf",
      "filePath": "/uploads/1234567890_abc123_document.pdf",
      "size": 102400,
      "type": "application/pdf"
    }
  ],
  "message": "Successfully uploaded 1 file(s)"
}
```

### 2. Upload Folder
**Location**: `public/uploads/`

**Purpose**:
- Stores all uploaded project documents
- Files are publicly accessible via their file path
- Each file has a unique name with timestamp and random string

**Naming Convention**:
- Format: `{userEmail}_{timestamp}_{originalFilename}`
- Example: `demo@icesco.org_1704067200000_project_proposal.pdf`
- Ensures unique filenames even if same user uploads same file multiple times

### 3. Frontend Upload Component
**Location**: `components/steps/StepFive.tsx`

**Functionality**:
- Drag-and-drop or click to upload interface
- File validation before upload
- Automatic upload to server when files are selected
- Display uploaded files with ability to remove
- Stores file metadata for submission

### 4. Data Flow

1. **User selects files** in StepFive form
2. **Files are validated** (type and size)
3. **Files are uploaded** to `/api/upload-documents`
4. **Server saves files** to `public/uploads/` folder
5. **File metadata returned** to frontend
6. **Metadata stored** in form state
7. **On submission**, file metadata is sent to CRM

### 5. CRM Integration

**Field Mapping**: `utils/crmFieldMapping.ts`

The `supporting_documents` field is mapped to CRM with custom mapping that converts the file metadata array to JSON string:

```typescript
supporting_documents: {
  crmField: 'supporting_documents',
  type: 'text',
  customMapping: (value: any) => {
    if (Array.isArray(value) && value.length > 0) {
      return JSON.stringify(value);
    }
    return '';
  }
}
```

**Stored Data Structure**:
```json
[
  {
    "name": "document.pdf",
    "size": 102400,
    "type": "application/pdf",
    "filePath": "/uploads/1234567890_abc123_document.pdf",
    "fileName": "1234567890_abc123_document.pdf"
  }
]
```

## Security Considerations

1. **File Type Validation**: Only allowed file extensions can be uploaded
2. **File Size Limit**: Maximum 10MB per file prevents DoS attacks
3. **Unique Filenames**: Prevents file overwrites and conflicts
4. **Sanitized Filenames**: Special characters are replaced with underscores

## Usage Example

```typescript
// In StepFive.tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch('/api/upload-documents', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  
  if (result.success) {
    // Store file metadata
    setFiles(result.files);
  }
};
```

## Future Enhancements

1. **File Preview**: Add ability to preview uploaded documents
2. **File Download**: Allow users to download their uploaded files
3. **File Deletion**: Add endpoint to delete files from server
4. **Cloud Storage**: Integrate with cloud storage (AWS S3, Azure Blob, etc.)
5. **Progress Indicator**: Show upload progress for large files
6. **Thumbnail Generation**: Generate thumbnails for image files

## Troubleshooting

### Files not uploading
- Check that the `public/uploads/` folder exists and has write permissions
- Verify file size is under 10MB
- Ensure file type is in the allowed list

### Files not accessible
- Files in `public/uploads/` are accessible via `/uploads/{filename}` path
- Check Next.js public folder configuration

### CRM submission failing
- Verify file metadata is properly formatted as JSON string
- Check CRM field mapping configuration
- Ensure `supporting_documents` field exists in CRM


