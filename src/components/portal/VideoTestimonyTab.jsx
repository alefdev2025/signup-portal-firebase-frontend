import React, { useState, useEffect, useRef } from 'react';
import { memberDataService } from './services/memberDataService';
import { getVideoTestimonyStatus, updateVideoTestimonyStatus } from '../../services/contact';
import VideoRecording from './VideoRecording';
import VideoUploading from './VideoUploading';

// Global configuration for video overlay
const SHOW_VIDEO_OVERLAY = false; // Set to false to disable overlay
const VIDEO_OVERLAY_GRADIENT = 'linear-gradient(to bottom right, rgba(18, 36, 60, 0.95) 0%, rgba(110, 67, 118, 0.9) 40%, rgba(156, 116, 144, 0.75) 70%, rgba(178, 138, 172, 0.65) 100%)';
const ENABLE_DELETE_MODAL = false; 

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
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [stream, setStream] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/ogg'];
  const MAX_RECORDING_TIME = 60; // 60 seconds max

  // Add Helvetica font styles with responsive text sizing
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .video-testimony-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .video-testimony-tab .font-bold,
      .video-testimony-tab .font-semibold {
        font-weight: 500 !important;
      }
      .video-testimony-tab .font-bold {
        font-weight: 700 !important;
      }
      .video-testimony-tab h1 {
        font-weight: 300 !important;
      }
      .video-testimony-tab h2,
      .video-testimony-tab h3,
      .video-testimony-tab h4 {
        font-weight: 400 !important;
      }
      .video-testimony-tab .font-medium {
        font-weight: 400 !important;
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
      .video-testimony-tab .animate-fadeInUp {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      .video-testimony-tab .animate-fadeInUp-delay-1 {
        animation: fadeInUp 0.8s ease-out 0.1s both;
      }
      .video-testimony-tab .animate-fadeInUp-delay-2 {
        animation: fadeInUp 0.8s ease-out 0.2s both;
      }
      .video-testimony-tab .animate-fadeInUp-delay-3 {
        animation: fadeInUp 0.8s ease-out 0.3s both;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (contactId) {
      loadTestimony();
    }
  }, [contactId]);

  useEffect(() => {
    // Clean up the blob URL when component unmounts or video changes
    return () => {
      // Only revoke if it's a blob URL (starts with 'blob:')
      if (downloadedVideoUrl && downloadedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadedVideoUrl);
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recorderRef.current) {
        recorderRef.current.destroy();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [downloadedVideoUrl, videoPreview, stream]);

  const loadTestimony = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusResult = await getVideoTestimonyStatus();
      
      if (statusResult.success && statusResult.hasVideoTestimony) {
        const result = await memberDataService.getVideoTestimony(contactId);
        
        if (result.success && result.data) {
          const downloadSuccess = await downloadVideoForPlayback();
          
          if (downloadSuccess) {
            setTestimony(result);
          } else {
            setTestimony(null);
            await updateVideoTestimonyStatus(false);
          }
        } else {
          await updateVideoTestimonyStatus(false);
          setTestimony(null);
        }
      } else {
        setTestimony(null);
        setLoading(false);
        
        memberDataService.getVideoTestimony(contactId).then(async (result) => {
          if (result.success && result.data) {
            await updateVideoTestimonyStatus(true);
            
            const downloadSuccess = await downloadVideoForPlayback();
            if (downloadSuccess) {
              setTestimony(result);
            }
          }
        }).catch(err => {
          console.log('[VideoTestimony] No video found (as expected from flag)');
        });
        
        return;
      }
    } catch (err) {
      if (err.message && !err.message.includes('not found') && !err.message.includes('No video testimony')) {
        setError('Failed to load video testimony');
      }
      setTestimony(null);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Now gets signed URL instead of downloading the video
  const downloadVideoForPlayback = async () => {
    try {
      setDownloadingVideo(true);
      
      // Get signed URL for playback
      const result = await memberDataService.getVideoDownloadUrl(contactId);
      
      if (result.success && result.downloadUrl) {
        // Set the signed URL directly for video playback
        setDownloadedVideoUrl(result.downloadUrl);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error getting video URL:', err);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const convertWebMToMP4 = async (blob) => {
    return new Promise((resolve, reject) => {
      try {
        setIsConverting(true);
        const mp4Blob = new Blob([blob], { type: 'video/mp4' });
        setIsConverting(false);
        resolve(mp4Blob);
      } catch (error) {
        setIsConverting(false);
        reject(error);
      }
    });
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true); // Add this
    
    try {
      setError(null);
      setLoading(true);
      
      const result = await memberDataService.deleteVideoTestimony(contactId);
      
      if (result.success || (result.error && result.error.includes('No video testimony found'))) {
        setTestimony(null);
        
        await updateVideoTestimonyStatus(false);
        
        // Don't revoke signed URLs, only blob URLs
        if (downloadedVideoUrl && downloadedVideoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(downloadedVideoUrl);
        }
        setDownloadedVideoUrl(null);
        
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          loadTestimony();
        }, 500);
      } else {
        setError(result.error || 'Failed to delete video testimony');
        setLoading(false);
        setIsDeleting(false); // Add this
      }
    } catch (err) {
      if (err.message && err.message.includes('No video testimony found')) {
        setTestimony(null);
        
        await updateVideoTestimonyStatus(false);
        
        if (downloadedVideoUrl && downloadedVideoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(downloadedVideoUrl);
        }
        setDownloadedVideoUrl(null);
        
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          loadTestimony();
        }, 500);
      } else {
        setError('Failed to delete video testimony');
        setLoading(false);
        setIsDeleting(false); // Add this
      }
    } finally {
      setIsDeleting(false); // Add this - ensures it's always reset
    }
  };

  const handleDownload = async () => {
    try {
      // Get a fresh signed URL for download
      const result = await memberDataService.getVideoDownloadUrl(contactId);
      
      if (result.success && result.downloadUrl) {
        // Open the signed URL in a new tab to trigger download
        window.open(result.downloadUrl, '_blank');
      } else {
        setError('Failed to download video testimony');
      }
    } catch (err) {
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

  const initializeCamera = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }, 
        audio: true 
      });
      
      setIsPreviewing(true);
      setStream(mediaStream);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          videoRef.current.play().then(() => {
            console.log('[VideoTestimony] Video preview playing');
          }).catch(err => {
            console.error('[VideoTestimony] Error playing video:', err);
          });
        }
      }, 100);
      
    } catch (err) {
      setIsPreviewing(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('camera-permission-denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Unable to access camera: ${err.message}`);
      }
    }
  };

  const cancelRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsRecording(false);
    setIsPreviewing(false);
    setSelectedVideo(null);
    setVideoPreview(null);
    setRecordingTime(0);
  };

  if (loading) {
    return (
      <div className="video-testimony-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="flex items-center justify-center" style={{ minHeight: '30vh', marginTop: '10vh' }}>
          <div className="text-center">
            <div className="w-16 h-16 relative mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-purple-100"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin"></div>
            </div>
            <p className="text-gray-500 font-light text-sm lg:text-base">
              {isDeleting ? 'Removing video...' : 'Loading video testimony...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-testimony-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      <div className="h-8"></div>
      
      <div className="px-4 md:px-0">
        {/* Error Messages */}
        {error && (
          error === 'camera-permission-denied' ? (
            <div className="mb-6 bg-gray-50 border border-gray-300 rounded-xl p-6">
              <h3 className="text-gray-800 font-medium text-base xl:text-lg mb-3">Camera Access Needed</h3>
              <p className="text-gray-600 text-xs xl:text-sm mb-4">
                Please allow camera access in your browser settings and refresh the page.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs 2xl:text-sm font-medium"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs 2xl:text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <p className="font-medium text-xs lg:text-sm 2xl:text-base">{error}</p>
            </div>
          )
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Upload/Current Video Section */}
          {!testimony || !testimony.data || !downloadedVideoUrl ? (
            <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp border border-gray-200 flex flex-col" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)', minHeight: 'min(400px, 40vh)' }}>
              <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold text-gray-900 mb-12 flex items-center gap-3 flex-wrap">
                <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2.5 2xl:p-3 rounded-lg shadow-md">
                  <svg className="h-5 w-5 sm:h-8 sm:w-8 2xl:h-9 2xl:w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                Your Video Testimony
              </h3>
              
              <div className="flex-1 flex items-center justify-center">
                {!selectedVideo && !isRecording && !isPreviewing ? (
                <VideoUploading
                  selectedVideo={selectedVideo}
                  videoPreview={videoPreview}
                  isConverting={isConverting}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  fileInputRef={fileInputRef}
                  setSelectedVideo={setSelectedVideo}
                  setVideoPreview={setVideoPreview}
                  setError={setError}
                  setUploading={setUploading}
                  setUploadProgress={setUploadProgress}
                  setLoading={setLoading}
                  contactId={contactId}
                  memberDataService={memberDataService}
                  loadTestimony={loadTestimony}
                  formatFileSize={formatFileSize}
                  handleCancel={handleCancel}
                  cancelRecording={cancelRecording}
                  ALLOWED_VIDEO_TYPES={ALLOWED_VIDEO_TYPES}
                  MAX_VIDEO_SIZE={MAX_VIDEO_SIZE}
                  MAX_RECORDING_TIME={MAX_RECORDING_TIME}
                  initializeCamera={initializeCamera}
                />
              ) : (isPreviewing || isRecording) ? (
                <VideoRecording
                  isPreviewing={isPreviewing}
                  isRecording={isRecording}
                  stream={stream}
                  recordingTime={recordingTime}
                  videoRef={videoRef}
                  recorderRef={recorderRef}
                  recordingIntervalRef={recordingIntervalRef}
                  setError={setError}
                  setIsPreviewing={setIsPreviewing}
                  setStream={setStream}
                  setIsRecording={setIsRecording}
                  setRecordingTime={setRecordingTime}
                  setSelectedVideo={setSelectedVideo}
                  setVideoPreview={setVideoPreview}
                  initializeCamera={initializeCamera}
                  formatTime={formatTime}
                  MAX_RECORDING_TIME={MAX_RECORDING_TIME}
                />
              ) : (
                <VideoUploading
                  selectedVideo={selectedVideo}
                  videoPreview={videoPreview}
                  isConverting={isConverting}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  fileInputRef={fileInputRef}
                  setSelectedVideo={setSelectedVideo}
                  setVideoPreview={setVideoPreview}
                  setError={setError}
                  setUploading={setUploading}
                  setUploadProgress={setUploadProgress}
                  setLoading={setLoading}
                  contactId={contactId}
                  memberDataService={memberDataService}
                  loadTestimony={loadTestimony}
                  formatFileSize={formatFileSize}
                  handleCancel={handleCancel}
                  cancelRecording={cancelRecording}
                  ALLOWED_VIDEO_TYPES={ALLOWED_VIDEO_TYPES}
                  MAX_VIDEO_SIZE={MAX_VIDEO_SIZE}
                  MAX_RECORDING_TIME={MAX_RECORDING_TIME}
                  initializeCamera={initializeCamera}
                />
              )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)', minHeight: 'min(400px, 40vh)' }}>
              <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold text-gray-900 mb-12 flex items-center gap-3">
                <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2.5 2xl:p-3 rounded-lg shadow-md">
                  <svg className="h-5 w-5 sm:h-8 sm:w-8 2xl:h-9 2xl:w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                Your Video Testimony
              </h3>
              
              {/* Video Player */}
              <div className="bg-black rounded-xl overflow-hidden mb-12 w-full max-w-2xl relative">
                {downloadingVideo ? (
                  <div className="flex items-center justify-center h-64 bg-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 relative mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                      </div>
                      <p className="text-white font-light text-xs lg:text-sm 2xl:text-base">Loading video...</p>
                    </div>
                  </div>
                ) : downloadedVideoUrl ? (
                  <div className="relative">
                    <div className="relative">
                      <video
                        key={downloadedVideoUrl}
                        controls
                        className="w-full"
                        preload="metadata"
                        playsInline
                        webkit-playsinline="true"
                        muted={false}
                        autoPlay={false}
                        onLoadedMetadata={(e) => {
                          console.log('[Video] Metadata loaded, duration:', e.target.duration);
                          
                          // Mobile fix for duration
                          if (e.target.duration === Infinity || isNaN(e.target.duration) || e.target.duration === 0) {
                            console.log('[Video] Attempting mobile duration fix');
                            const fixDuration = async () => {
                              e.target.currentTime = 1e101;
                              await new Promise(r => setTimeout(r, 10));
                              e.target.currentTime = 0;
                            };
                            fixDuration();
                          }
                        }}
                        onError={(e) => {
                          const errorMessages = {
                            1: 'Video loading aborted',
                            2: 'Network error while loading video',
                            3: 'Video decoding error - corrupt or unsupported format',
                            4: 'Video format not supported'
                          };
                          
                          const errorCode = e.target.error?.code;
                          console.error('[Video] Playback error:', errorCode, e.target.error);
                          
                          // Show mobile-specific help
                          if (window.innerWidth <= 768) {
                            setError(`Video playback issue on mobile. ${errorMessages[errorCode] || 'Unknown error'}. Try: 1) Refresh the page, 2) Open in a different browser, or 3) View on desktop.`);
                          } else {
                            setError(errorMessages[errorCode] || 'Failed to play video');
                          }
                        }}
                      >
                        <source src={downloadedVideoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Mobile fallback UI - show if video doesn't load */}
                      {window.innerWidth <= 768 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-800 mb-2">
                            Having trouble playing the video?
                          </p>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                // Force reload video
                                const video = document.querySelector('video');
                                if (video) {
                                  video.load();
                                  video.play().catch(err => {
                                    console.error('[Video] Play failed:', err);
                                    setError('Unable to play video. This may be a format compatibility issue with your mobile browser.');
                                  });
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs"
                            >
                              Try Playing Video
                            </button>
                            <button
                              onClick={() => {
                                // Open video in new tab (sometimes works better on mobile)
                                window.open(downloadedVideoUrl, '_blank');
                              }}
                              className="w-full px-3 py-1.5 bg-gray-600 text-white rounded text-xs"
                            >
                              Open in New Tab
                            </button>
                            <p className="text-xs text-gray-600 mt-2">
                              Note: Video playback on mobile devices can be limited. For best experience, view on desktop.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {SHOW_VIDEO_OVERLAY && (
                      <div 
                        id="video-overlay"
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                        style={{ 
                          display: 'flex',
                          background: VIDEO_OVERLAY_GRADIENT
                        }}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <p className="text-white text-base lg:text-lg 2xl:text-xl font-medium">Your Current Video Testimony</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-900">
                    <p className="text-gray-400 font-light text-xs lg:text-sm 2xl:text-base">Video unavailable</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {testimony.data.createdDate && testimony.data.size ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                  <div className="p-2 lg:p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs 2xl:text-sm text-gray-600 mb-1 font-medium">Uploaded on</p>
                    <p className="text-xs lg:text-sm 2xl:text-base font-normal text-gray-900">{formatDate(testimony.data.createdDate)}</p>
                  </div>
                  <div className="p-2 lg:p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs 2xl:text-sm text-gray-600 mb-1 font-medium">File size</p>
                    <p className="text-xs lg:text-sm 2xl:text-base font-normal text-gray-900">{formatFileSize(testimony.data.size)}</p>
                  </div>
                </div>
              ) : null}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Download temporarily disabled - QuickTime compatibility issue
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all flex items-center justify-center gap-2 text-xs 2xl:text-sm font-medium"
              >
                <svg className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Video
              </button>
              */}
              <button
                onClick={() => ENABLE_DELETE_MODAL ? setShowDeleteConfirm(true) : handleDelete()}
                className="px-4 py-2 bg-transparent border-2 border-black text-black rounded-lg text-xs 2xl:text-sm font-medium"
              >
                Remove Video
              </button>
            </div>
            </div>
            )}

          {/* About Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp-delay-1 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)', minHeight: 'min(200px, 20vh)' }}>
            <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2.5 2xl:p-3 rounded-lg shadow-md">
                <svg className="h-5 w-5 sm:h-8 sm:w-8 2xl:h-9 2xl:w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              About Video Testimonies
            </h3>
            <p className="text-gray-600 font-light leading-relaxed text-xs lg:text-sm 2xl:text-base">
              Your video testimony is a personal message that can be used as evidence that your intention upon legal death is to be cryopreserved. Make sure you take the video in good 
              lighting, indicate your full name, and detail your specific contact with Alcor and your wishes for cryopreservation.
            </p>
          </div>
          
          <div className="h-32"></div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {ENABLE_DELETE_MODAL && showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 z-10 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <h3 className="text-xs lg:text-sm 2xl:text-base font-semibold text-gray-900 mb-4">Replace Video Testimony?</h3>
            <p className="text-gray-600 font-light mb-6 text-xs lg:text-sm 2xl:text-base">
              This will permanently delete your current video testimony. You'll need to upload a new video to replace it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all text-xs 2xl:text-sm font-medium"
              >
                Yes, Replace
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs 2xl:text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        <button
          className="w-16 h-16 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Help Popup */}
        {showHelpPopup && (
          <div className="fixed bottom-28 right-8 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50 animate-slideIn">
            <div className="bg-[#9f5fa6] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-medium">Video Testimony Help</h3>
              <button
                onClick={() => setShowHelpPopup(false)}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Sample Script</h4>
                <p className="text-sm text-gray-600 mb-2">Here's a recommended statement to include:</p>
                <p className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                  "My name is [your full legal name]. I am a member of Alcor Life Extension Foundation. It is my wish and intention to be cryopreserved upon my legal death. I have made arrangements with Alcor for this purpose."
                </p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Recording a Video</h4>
                <p className="text-sm text-gray-600">Click "Record Video Now" to use your device's camera. Make sure you're in a well-lit area and speak clearly.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Uploading a Video</h4>
                <p className="text-sm text-gray-600">Click "Select Video File" to upload a pre-recorded video. Maximum file size is 2GB. Supported formats: MP4, MOV, AVI, WMV, WebM, OGG.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">What to Include</h4>
                <p className="text-sm text-gray-600">State your full legal name, confirm your intention to be cryopreserved, and mention your membership with Alcor.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Why It's Important</h4>
                <p className="text-sm text-gray-600">Your video testimony serves as evidence of your wishes and can help ensure your cryopreservation arrangements are honored.</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Need assistance?</h4>
                <p className="text-sm text-gray-600">
                  Contact support at{' '}
                  <a href="mailto:info@alcor.org" className="text-[#9f5fa6] hover:underline">
                    info@alcor.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTestimonyTab;