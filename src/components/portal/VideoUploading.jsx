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
  
    // File type validation
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError(`Please select a valid video file. Supported formats: MP4, MOV, AVI, WMV, WebM, OGG`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
  
    // File size validation
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`Video file is too large. Maximum size is 2GB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
  
    // Duration validation
    const video = document.createElement('video');
    const tempUrl = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    
    video.onloadedmetadata = function() {
      // Clean up the temporary URL
      URL.revokeObjectURL(tempUrl);
      
      // Check duration (allowing a small buffer for rounding)
      if (video.duration > MAX_RECORDING_TIME + 1) {
        setError(`Video must be ${MAX_RECORDING_TIME} seconds or less. Your video is ${Math.round(video.duration)} seconds long.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Duration is OK, proceed with setting the video
      const previewUrl = URL.createObjectURL(file);
      setSelectedVideo(file);
      setVideoPreview(previewUrl);
      setError(null);
    };
    
    video.onerror = function() {
      URL.revokeObjectURL(tempUrl);
      setError('Unable to read video file. Please try a different video.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    // Set the source to trigger metadata loading
    video.src = tempUrl;
  };

  // SINGLE UNIFIED UPLOAD METHOD - Direct to GCS
  const handleUpload = async () => {
    if (!selectedVideo) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      console.log('[Upload] Starting direct GCS upload...');
      console.log('[Upload] File:', {
        name: selectedVideo.name,
        size: formatFileSize(selectedVideo.size),
        type: selectedVideo.type
      });

      // Step 1: Get signed upload URL from backend
      console.log('[Upload] Step 1: Getting signed upload URL...');
      const uploadUrlResult = await memberDataService.getVideoUploadUrl(
        contactId,
        selectedVideo.name,
        selectedVideo.type || 'video/webm',
        selectedVideo.size
      );

      if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
        throw new Error(uploadUrlResult.error || 'Failed to get upload URL');
      }

      console.log('[Upload] Got signed URL, GCS filename:', uploadUrlResult.gcsFileName);
      setUploadProgress(10);

      // Step 2: Upload directly to GCS using the signed URL
      console.log('[Upload] Step 2: Uploading to GCS...');
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 80) + 10; // 10-90%
          setUploadProgress(percentComplete);
          console.log(`[Upload] Progress: ${percentComplete}%`);
        }
      });

      // Set up completion/error handling
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            console.log('[Upload] GCS upload successful');
            resolve();
          } else {
            console.error('[Upload] GCS upload failed:', xhr.status, xhr.statusText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error('[Upload] Network error during upload');
          reject(new Error('Network error during upload'));
        };

        xhr.ontimeout = () => {
          console.error('[Upload] Upload timed out');
          reject(new Error('Upload timed out'));
        };
      });

      // Configure and send the request
      xhr.open('PUT', uploadUrlResult.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', selectedVideo.type || 'video/webm');
      
      // Set timeout for large files (5 minutes)
      xhr.timeout = 300000;
      
      // Send the file directly
      xhr.send(selectedVideo);

      // Wait for upload to complete
      await uploadPromise;
      setUploadProgress(90);

      // Step 3: Confirm the upload with backend
      console.log('[Upload] Step 3: Confirming upload with backend...');
      const confirmResult = await memberDataService.confirmVideoUpload(
        contactId,
        uploadUrlResult.gcsFileName,
        selectedVideo.size,
        selectedVideo.name
      );

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Failed to confirm upload');
      }

      console.log('[Upload] Upload confirmed successfully');
      setUploadProgress(100);

      // Update the flag to indicate video exists
      await updateVideoTestimonyStatus(true);
      
      // Clear the cache to ensure fresh data
      memberDataService.clearCacheEntry(contactId, 'videoTestimony');
      
      // Success! Clean up and reload
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

    } catch (err) {
      console.error('[Upload] Error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to upload video. ';
      
      if (err.message.includes('Network error')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (err.message.includes('timed out')) {
        errorMessage += 'The upload took too long. Please try with a smaller video or faster connection.';
      } else if (err.message.includes('status 413')) {
        errorMessage += 'The video file is too large. Please try a smaller file.';
      } else if (err.message.includes('status 403')) {
        errorMessage += 'Upload permission denied. Please try again or contact support.';
      } else {
        errorMessage += err.message || 'Please try again or contact support.';
      }
      
      setError(errorMessage);
      setUploading(false);
      setUploadProgress(0);
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
          className="px-6 py-3.5 sm:py-1.5 bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium lg:bg-none lg:bg-white lg:text-[#d4af37] lg:border-2 lg:border-[#d4af37] lg:hover:border-[#b8941f] lg:hover:text-[#b8941f] lg:hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Record Video Now
        </button>
        
        <label className="px-6 py-3.5 sm:py-1.5 bg-white border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium lg:border-[#d4af37] lg:text-[#d4af37] lg:hover:border-[#b8941f] lg:hover:text-[#b8941f]">
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

  // Selected video preview/upload UI
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Uploading video... {uploadProgress}%
              </span>
            </div>
            
            {/* Progress bar with actual percentage */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-600">
                {uploadProgress < 10 && 'Getting upload URL...'}
                {uploadProgress >= 10 && uploadProgress < 90 && 'Uploading to cloud storage...'}
                {uploadProgress >= 90 && uploadProgress < 100 && 'Confirming upload...'}
                {uploadProgress === 100 && 'Upload complete!'}
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                Please keep this page open until the upload completes.
              </p>
              {isMobile && (
                <p className="text-xs text-red-600 font-medium mt-2">
                  ⚠️ Do not navigate away or lock your phone during upload
                </p>
              )}
            </div>
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