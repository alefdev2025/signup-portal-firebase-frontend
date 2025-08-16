import React, { useState, useEffect } from 'react';
import { updateVideoTestimonyStatus } from '../../services/contact';

const VideoUploading = ({
  selectedVideo,
  videoPreview,
  isConverting,
  uploading,
  uploadProgress,
  fileInputRef,
  setSelectedVideo,
  setVideoPreview,
  setError,
  setUploading,
  setUploadProgress,
  setLoading,
  contactId,
  memberDataService,
  loadTestimony,
  formatFileSize,
  handleCancel,
  cancelRecording,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE,
  MAX_RECORDING_TIME,
  initializeCamera
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileUploadStrategy, setMobileUploadStrategy] = useState('chunk'); // 'chunk' or 'compress'
  const [videoAspectRatio, setVideoAspectRatio] = useState(null);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect video aspect ratio when preview is set
  useEffect(() => {
    if (videoPreview) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        // Determine if video is portrait or landscape
        const isPortrait = video.videoHeight > video.videoWidth;
        // On mobile, recorded videos are portrait (9:16), on desktop they're landscape (16:9)
        setVideoAspectRatio(isPortrait ? '9/16' : '16/9');
      };
      video.src = videoPreview;
    }
  }, [videoPreview]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError(`Please select a valid video file. Supported formats: MP4, MOV, AVI, WMV, WebM, OGG`);
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError(`Video file is too large. Maximum size is 2GB.`);
      return;
    }

    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  // Desktop upload - EXACTLY AS BEFORE
  const handleDesktopUpload = async () => {
    if (!selectedVideo) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await memberDataService.uploadVideoTestimony(contactId, selectedVideo);

      clearInterval(progressInterval);
      
      if (result.success) {
        setUploadProgress(100);
        
        // Update the flag to indicate video exists
        await updateVideoTestimonyStatus(true);
        
        // Clear the cache to ensure fresh data
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          setSelectedVideo(null);
          setVideoPreview(null);
          setUploading(false);
          setUploadProgress(0);
          setLoading(true);
          
          // Reload to show the uploaded video
          setTimeout(() => {
            loadTestimony();
          }, 500);
        }, 1000);
      } else {
        setError(result.error || 'Failed to upload video testimony');
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video testimony');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Mobile upload - CHUNKED UPLOAD FOR RELIABILITY
  const handleMobileUpload = async () => {
    if (!selectedVideo) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      console.log('[Mobile Upload] Starting mobile-optimized upload...');
      console.log('[Mobile Upload] File size:', formatFileSize(selectedVideo.size));

      // For mobile, we'll try different strategies
      if (selectedVideo.size > 100 * 1024 * 1024) { // If larger than 100MB
        console.log('[Mobile Upload] Large file detected, using chunked upload');
        await handleMobileChunkedUpload();
      } else {
        console.log('[Mobile Upload] Small file, using direct upload');
        // For smaller files, use regular upload but with mobile-specific error handling
        await handleMobileDirectUpload();
      }
      
    } catch (err) {
      console.error('[Mobile Upload] Error:', err);
      setError('Failed to upload video. Please try a shorter video or use a desktop browser.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMobileDirectUpload = async () => {
    try {
      console.log('[Mobile Upload] Using direct upload');
      
      const result = await memberDataService.uploadVideoTestimony(contactId, selectedVideo);
      
      if (result && result.success) {
        setUploadProgress(100);
        await updateVideoTestimonyStatus(true);
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          setSelectedVideo(null);
          setVideoPreview(null);
          setUploading(false);
          setUploadProgress(0);
          setLoading(true);
          
          setTimeout(() => {
            loadTestimony();
          }, 500);
        }, 1000);
      } else {
        throw new Error(result?.error || 'Upload failed');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Chunked upload for mobile (for large files)
// Chunked upload for mobile (for large files)
const handleMobileChunkedUpload = async () => {
    try {
      console.log('[Mobile Upload] Using chunked upload for large file');
      
      // The service already handles chunking internally!
      const result = await memberDataService.uploadVideoTestimony(contactId, selectedVideo);
      
      if (result && result.success) {
        setUploadProgress(100);
        await updateVideoTestimonyStatus(true);
        memberDataService.clearCacheEntry(contactId, 'videoTestimony');
        
        setTimeout(() => {
          setSelectedVideo(null);
          setVideoPreview(null);
          setUploading(false);
          setUploadProgress(0);
          setLoading(true);
          
          setTimeout(() => {
            loadTestimony();
          }, 500);
        }, 1000);
      } else {
        throw new Error(result?.error || 'Upload failed');
      }
    } catch (err) {
      console.log('[Mobile Upload] Chunked upload failed, trying direct upload');
      await handleMobileDirectUpload();
    }
  };

  const handleUpload = async () => {
    // Use different upload strategy based on device
    if (isMobile) {
      console.log('[Upload] Using mobile upload strategy');
      await handleMobileUpload();
    } else {
      console.log('[Upload] Using desktop upload strategy');
      await handleDesktopUpload();
    }
  };

  // Render component
  if (!selectedVideo) {
    return (
      <div className="text-center">
        <div className="mb-8">
          <p className="text-gray-600 font-light mb-6 text-sm 2xl:text-base">
            Record a personal video testimony stating your intention to be cryopreserved
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={initializeCamera}
            className="px-6 py-3.5 sm:py-3 bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium lg:bg-none lg:bg-white lg:text-[#d4af37] lg:border-2 lg:border-[#d4af37] lg:hover:border-[#b8941f] lg:hover:text-[#b8941f] lg:hover:opacity-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Record Video Now
          </button>
          
          <label className="px-6 py-3.5 sm:py-3 bg-white border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium lg:border-[#d4af37] lg:text-[#d4af37] lg:hover:border-[#b8941f] lg:hover:text-[#b8941f]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Select Video File
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
        
        {isMobile && (
          <p className="text-xs text-gray-500 mt-4">
            For best results on mobile, record videos under 60 seconds
          </p>
        )}
      </div>
    );
  }

  // Selected video preview/upload UI - FIXED FOR MOBILE
  return (
    <div>
      {videoPreview && (
        <div className="mb-6">
          <div className="relative bg-black rounded-xl overflow-hidden w-full max-w-md mx-auto lg:max-w-2xl">
            <video
              src={videoPreview}
              controls
              playsInline
              muted
              autoPlay={false}
              preload="metadata"
              poster=""
              className="w-full h-full object-contain"
              style={{ 
                aspectRatio: videoAspectRatio || (window.innerWidth < 1024 ? '9/16' : '16/9'),
                maxHeight: window.innerWidth < 1024 ? '500px' : '400px'
              }}
              onLoadedMetadata={(e) => {
                // Force the video to show first frame on mobile
                e.target.currentTime = 0.1;
                e.target.play().then(() => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }).catch(() => {
                  // If autoplay fails, just set the current time
                  e.target.currentTime = 0;
                });
              }}
            />
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {selectedVideo.name}
          </span>
          <span className="text-sm text-gray-500">
            {formatFileSize(selectedVideo.size)}
          </span>
        </div>
        
        {uploading && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Uploading...</span>
              <span className="text-xs text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {isMobile && uploadProgress > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Please keep this page open until upload completes
              </p>
            )}
          </div>
        )}
      </div>
      
      {!uploading && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleUpload}
            disabled={isConverting}
            className="px-6 py-2 bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white rounded-lg hover:opacity-90 transition-all text-sm 2xl:text-base font-medium disabled:opacity-50"
          >
            {isConverting ? 'Processing...' : 'Upload Video'}
          </button>
          
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm 2xl:text-base font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploading;