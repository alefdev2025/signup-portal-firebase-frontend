import React, { useState, useEffect, useRef } from 'react';
import { memberDataService } from './services/memberDataService';

const VideoTestimonyTab = ({ contactId }) => {
  const [testimony, setTestimony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloadedVideoUrl, setDownloadedVideoUrl] = useState(null);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/ogg'];
  const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

  useEffect(() => {
    if (contactId) {
      loadTestimony();
    }
  }, [contactId]);

  useEffect(() => {
    // Clean up the blob URL when component unmounts or video changes
    return () => {
      if (downloadedVideoUrl) {
        URL.revokeObjectURL(downloadedVideoUrl);
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [downloadedVideoUrl, videoPreview]);

  const loadTestimony = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      
      const result = await memberDataService.getVideoTestimony(contactId);
      
      if (result.success && result.data) {
        // Try to download the video for local playback
        const downloadSuccess = await downloadVideoForPlayback();
        
        // Only set testimony if we successfully downloaded the video
        if (downloadSuccess) {
          setTestimony(result);
        } else {
          // If download failed, don't show the video player view
          console.log('[VideoTestimony] Video download failed - showing upload view');
          setTestimony(null);
        }
      } else {
        // Only show error if it's not a "no testimony found" situation
        if (result.error && !result.error.includes('not found') && !result.error.includes('No video testimony')) {
          setError(result.error || 'Failed to load video testimony');
        }
        // If no video testimony found, that's okay - user can upload one
        console.log('[VideoTestimony] No existing video testimony found for member');
        setTestimony(null);
      }
    } catch (err) {
      console.error('Error loading testimony:', err);
      // Only show error for actual failures, not missing testimony
      if (err.message && !err.message.includes('not found') && !err.message.includes('No video testimony')) {
        setError('Failed to load video testimony');
      }
      setTestimony(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideoForPlayback = async () => {
    try {
      setDownloadingVideo(true);
      console.log('[VideoTestimony] Downloading video for playback...');
      
      const result = await memberDataService.downloadVideoTestimony(contactId);
      
      if (result.success && result.data) {
        // Debug: Check what we received
        console.log('[VideoTestimony] Download result details:', {
          dataType: typeof result.data,
          dataLength: result.data.length || result.data.size,
          isBlob: result.data instanceof Blob,
          blobSize: result.data.size,
          blobType: result.data.type,
          contentType: result.contentType,
          // Check if it's base64 string
          isString: typeof result.data === 'string',
          stringLength: typeof result.data === 'string' ? result.data.length : 'N/A',
          // Check first few chars if string
          firstChars: typeof result.data === 'string' ? result.data.substring(0, 50) : 'N/A'
        });
        
        // Create a blob if we don't have one
        let blob;
        if (result.data instanceof Blob) {
          blob = result.data;
        } else {
          // Convert to Blob if needed
          blob = new Blob([result.data], { type: result.contentType || 'video/mp4' });
        }
        
        console.log('[VideoTestimony] Created blob:', {
          size: blob.size,
          type: blob.type
        });
        
        // Debug: Try to read the first few bytes to check the file signature
        const reader = new FileReader();
        reader.onload = (e) => {
          const arr = new Uint8Array(e.target.result);
          const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log('[VideoTestimony] File header (first 4 bytes):', header);
          
          // Common video file signatures:
          // MP4: 00 00 00 18/1C/20 66 74 79 70
          // MOV: 00 00 00 14 66 74 79 70
          // AVI: 52 49 46 46
        };
        reader.readAsArrayBuffer(blob.slice(0, 20));
        
        // Create blob URL
        const url = window.URL.createObjectURL(blob);
        setDownloadedVideoUrl(url);
        
        console.log('[VideoTestimony] Video blob URL created:', url);
        console.log('[VideoTestimony] Video downloaded successfully for playback');
        return true; // Return success
      } else {
        console.error('[VideoTestimony] Failed to download video for playback');
        return false;
      }
    } catch (err) {
      console.error('[VideoTestimony] Error downloading video for playback:', err);
      return false;
    } finally {
      setDownloadingVideo(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVideoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    
    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, WMV, WebM, or OGG)');
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`Video size must be less than 2GB. Your video is ${formatFileSize(file.size)}`);
      return;
    }

    setSelectedVideo(file);
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);
  };

  const handleUpload = async () => {
    if (!selectedVideo) return;
  
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
  
      const formData = new FormData();
      formData.append('file', selectedVideo);
      formData.append('description', `Video testimony recorded on ${new Date().toLocaleDateString()}`);
  
      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
  
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setSelectedVideo(null);
            setVideoPreview(null);
            setUploadProgress(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            // Clear the cache first to ensure fresh data
            memberDataService.clearCacheEntry(contactId, 'videoTestimony');
            
            // Set loading to true to show spinner instead of upload screen
            setLoading(true);
            
            // Add a small delay to ensure Salesforce has processed the upload
            setTimeout(async () => {
              try {
                // Reload the testimony
                await loadTestimony();
              } catch (err) {
                console.error('Error reloading testimony after upload:', err);
                setLoading(false);
              }
            }, 1000);
          } else {
            setError(response.error || 'Failed to upload video testimony');
          }
        } else {
          setError(`Upload failed with status: ${xhr.status}`);
        }
        setUploading(false);
      });
  
      xhr.addEventListener('error', () => {
        setError('Network error during upload');
        setUploading(false);
      });
  
      xhr.open('POST', `${API_BASE_URL}/api/salesforce/member/${contactId}/video-testimony`);
      xhr.withCredentials = true;
      xhr.send(formData);
  
    } catch (err) {
      console.error('Error uploading video:', err);
      setError(err.message || 'Failed to upload video testimony');
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    // Close modal immediately
    setShowDeleteConfirm(false);
    
    try {
      setError(null);
      setLoading(true); // Show loading state
      
      const result = await memberDataService.deleteVideoTestimony(contactId);
      
      if (result.success || (result.error && result.error.includes('No video testimony found'))) {
        // Either deleted successfully OR it was already deleted
        setTestimony(null);
        
        // Clean up the blob URL if it exists
        if (downloadedVideoUrl) {
          URL.revokeObjectURL(downloadedVideoUrl);
          setDownloadedVideoUrl(null);
        }
        
        // Clear the cache to ensure fresh data
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        // Force a reload to ensure UI is in sync
        setTimeout(() => {
          loadTestimony();
        }, 500);
      } else {
        setError(result.error || 'Failed to delete video testimony');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error deleting testimony:', err);
      
      // If it's a "not found" error, treat it as success
      if (err.message && err.message.includes('No video testimony found')) {
        setTestimony(null);
        
        if (downloadedVideoUrl) {
          URL.revokeObjectURL(downloadedVideoUrl);
          setDownloadedVideoUrl(null);
        }
        
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          loadTestimony();
        }, 500);
      } else {
        setError('Failed to delete video testimony');
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const result = await memberDataService.downloadVideoTestimony(contactId);
      
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'video-testimony.mp4';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download video testimony');
      }
    } catch (err) {
      console.error('Error downloading video:', err);
      setError('Failed to download video testimony');
    }
  };

  const handleCancel = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading video testimony...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen relative overflow-hidden">
      <div>
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Video Testimony Sections */}
        <div className="space-y-8">
          {/* Upload Section OR Current Video Section */}
          {!testimony || !testimony.data || !downloadedVideoUrl ? (
            // Show upload section when no video exists
            <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
              <div className="py-4">
                <h2 className="text-2xl font-thin text-[#2a2346] mb-8 tracking-wider">YOUR VIDEO TESTIMONY</h2>
                
                {!selectedVideo ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="video-upload"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoSelect}
                    />
                    
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer inline-flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 text-[#2a2346] rounded-2xl hover:border-[#6b5b7e] hover:text-[#6b5b7e] transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Select Video File</span>
                    </label>
                    
                    <p className="mt-4 text-sm text-gray-600">
                      Maximum file size: 2GB • Supported formats: MP4, MOV, AVI, WMV, WebM, OGG
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Video Preview */}
                    <div className="bg-black rounded-lg overflow-hidden max-w-2xl">
                      <video
                        src={videoPreview}
                        className="w-full"
                        controls
                      />
                    </div>

                    {/* Selected File Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{selectedVideo.name}</p>
                          <p className="text-sm text-gray-600">{formatFileSize(selectedVideo.size)}</p>
                        </div>
                        {!uploading && (
                          <button
                            onClick={handleCancel}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#6b5b7e] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    {!uploading && (
                      <button
                        onClick={handleUpload}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-[#2a2346] rounded-2xl hover:border-[#6b5b7e] hover:text-[#6b5b7e] transition-all font-medium"
                      >
                        Upload Video Testimony
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show current video when testimony exists
            <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
              <div className="py-4">
                <h2 className="text-2xl font-thin text-[#2a2346] mb-8 tracking-wider">YOUR VIDEO TESTIMONY</h2>
                
                {/* Video Player with enhanced debugging */}
                <div className="bg-black rounded-lg overflow-hidden mb-6 max-w-2xl">
                  {downloadingVideo ? (
                    <div className="flex items-center justify-center h-64 bg-gray-900">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">Loading video...</p>
                      </div>
                    </div>
                  ) : downloadedVideoUrl ? (
                    <video
                      controls
                      className="w-full"
                      src={downloadedVideoUrl}
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        console.log('[Video] Metadata loaded:', {
                          duration: e.target.duration,
                          videoWidth: e.target.videoWidth,
                          videoHeight: e.target.videoHeight,
                          readyState: e.target.readyState
                        });
                      }}
                      onCanPlay={() => console.log('[Video] Can play')}
                      onCanPlayThrough={() => console.log('[Video] Can play through')}
                      onError={(e) => {
                        console.error('[Video] Error:', {
                          error: e.target.error,
                          errorCode: e.target.error?.code,
                          errorMessage: e.target.error?.message,
                          src: e.target.src
                        });
                        
                        // Video error codes:
                        // 1 = MEDIA_ERR_ABORTED
                        // 2 = MEDIA_ERR_NETWORK
                        // 3 = MEDIA_ERR_DECODE
                        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
                        
                        const errorMessages = {
                          1: 'Video loading aborted',
                          2: 'Network error while loading video',
                          3: 'Video decoding error - corrupt or unsupported format',
                          4: 'Video format not supported'
                        };
                        
                        const errorCode = e.target.error?.code;
                        if (errorCode) {
                          console.error(`[Video] ${errorMessages[errorCode] || 'Unknown error'}`);
                          setError(errorMessages[errorCode] || 'Failed to play video');
                        }
                      }}
                      onLoadStart={() => console.log('[Video] Load started')}
                      onProgress={(e) => console.log('[Video] Loading progress:', e)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-900">
                      <p className="text-gray-400">Video unavailable</p>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                {testimony.data.createdDate && testimony.data.size ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-[#6b7280]">Uploaded on</p>
                      <p className="font-medium text-[#2a2346]">{formatDate(testimony.data.createdDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6b7280]">File size</p>
                      <p className="font-medium text-[#2a2346]">{formatFileSize(testimony.data.size)}</p>
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-[#2a2346] rounded-2xl hover:border-[#6b5b7e] hover:text-[#6b5b7e] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video
                  </button>
                  <button
                    onClick={() => {
                      setError(null); // Clear any existing errors
                      setShowDeleteConfirm(true);
                    }}
                    className="px-6 py-3 bg-white border-2 border-red-300 text-red-600 rounded-2xl hover:border-red-500 hover:text-red-700 transition-all"
                  >
                    Replace Video
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About Section - Now appears second */}
          <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{animationDelay: '150ms', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
            <div className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-[#6b5b7e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-thin text-[#2a2346] mb-4 tracking-wider">ABOUT VIDEO TESTIMONIES</h3>
                  <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
                    Your video testimony is a personal message that can be used as evidence that your intention upon legal death is to be cryopreserved. Make sure you take the video in good 
                    lighting, indicate your full name, and detail your specific contact with Alcor and your wishes for cryopreservation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white rounded-lg max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Replace Video Testimony?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete your current video testimony. You'll need to upload a new video to replace it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Replace
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTestimonyTab;