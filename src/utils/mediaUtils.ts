/**
 * Utility functions for parsing and rendering media from YouTube, Google Drive, and direct URLs
 */

export interface ParsedMedia {
  sourceType: 'youtube' | 'google_drive' | 'direct';
  embedUrl: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  fileId?: string;
  isScrollablePreview: boolean;
  isVideo: boolean;
  label: string;
}

/**
 * Extracts YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Pattern 1: youtu.be/ID
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Pattern 2: youtube.com/watch?v=ID
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Pattern 3: youtube.com/embed/ID or youtube.com/shorts/ID or youtube.com/v/ID
  const pathMatch = cleanUrl.match(/youtube\.com\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  return null;
}

/**
 * Extracts Google Drive File ID or Folder ID from various URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID
 */
export function extractGoogleDriveId(url: string): { id: string; isFolder: boolean } | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Folder: drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = cleanUrl.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return { id: folderMatch[1], isFolder: true };
  }

  // File: /file/d/FILE_ID
  const fileMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return { id: fileMatch[1], isFolder: false };
  }

  // Query parameter: id=FILE_ID
  const paramMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (paramMatch && cleanUrl.includes('drive.google.com')) {
    return { id: paramMatch[1], isFolder: false };
  }

  return null;
}

/**
 * Parse any URL into embeddable preview, direct download link, and thumbnail
 */
export function parseMediaUrl(url: string, explicitType?: 'photo' | 'video' | 'document'): ParsedMedia {
  if (!url) {
    return {
      sourceType: 'direct',
      embedUrl: '',
      isScrollablePreview: false,
      isVideo: false,
      label: 'Langsung',
    };
  }

  const cleanUrl = url.trim();

  // 1. Check for YouTube
  const ytId = extractYoutubeId(cleanUrl);
  if (ytId) {
    return {
      sourceType: 'youtube',
      fileId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
      downloadUrl: `https://www.youtube.com/watch?v=${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      isScrollablePreview: false,
      isVideo: true,
      label: 'YouTube Video',
    };
  }

  // 2. Check for Google Drive
  const driveInfo = extractGoogleDriveId(cleanUrl);
  if (driveInfo) {
    if (driveInfo.isFolder) {
      return {
        sourceType: 'google_drive',
        fileId: driveInfo.id,
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${driveInfo.id}#grid`,
        downloadUrl: `https://drive.google.com/drive/folders/${driveInfo.id}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        isScrollablePreview: true,
        isVideo: false,
        label: 'Google Drive Folder',
      };
    }

    // Google Drive File (Video, Document, PDF, Image)
    const isVid = explicitType === 'video' || cleanUrl.toLowerCase().includes('.mp4');
    return {
      sourceType: 'google_drive',
      fileId: driveInfo.id,
      embedUrl: `https://drive.google.com/file/d/${driveInfo.id}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${driveInfo.id}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveInfo.id}&sz=w800`,
      isScrollablePreview: true, // Google Drive preview frame supports scrolling through pages / videos
      isVideo: isVid,
      label: isVid ? 'Google Drive Video' : 'Google Drive Dokumen / File',
    };
  }

  // 3. Direct URL (image or mp4/webm or doc)
  const isVideoDirect =
    explicitType === 'video' ||
    cleanUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) !== null;

  return {
    sourceType: 'direct',
    embedUrl: cleanUrl,
    downloadUrl: cleanUrl,
    thumbnailUrl: cleanUrl,
    isScrollablePreview: explicitType === 'document' || cleanUrl.match(/\.(pdf|doc|docx)$/i) !== null,
    isVideo: isVideoDirect,
    label: isVideoDirect ? 'Video Langsung (MP4)' : 'Foto / Berkas Langsung',
  };
}
