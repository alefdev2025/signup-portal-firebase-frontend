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

  // Mobile direct upload with better error handling
// Mobile direct upload with extensive debugging
const handleMobileDirectUpload = async () => {
    const debugInfo = [];
    
    try {
      // Log initial state
      debugInfo.push(`[START] File: ${selectedVideo.name}`);
      debugInfo.push(`[SIZE] ${(selectedVideo.size / 1024 / 1024).toFixed(2)} MB`);
      debugInfo.push(`[TYPE] ${selectedVideo.type || 'unknown'}`);
      
      // Check if file is actually readable
      debugInfo.push(`[CHECK] Testing file readability...`);
      try {
        // Try to read first 1KB of file to verify it's accessible
        const testSlice = selectedVideo.slice(0, 1024);
        const testReader = new FileReader();
        
        await new Promise((resolve, reject) => {
          testReader.onload = () => {
            debugInfo.push(`[READ] ✓ File is readable`);
            resolve();
          };
          testReader.onerror = () => {
            debugInfo.push(`[READ] ✗ File read error: ${testReader.error}`);
            reject(testReader.error);
          };
          testReader.readAsArrayBuffer(testSlice);
        });
      } catch (readErr) {
        debugInfo.push(`[READ ERROR] ${readErr.message}`);
        setError(debugInfo.join('\n'));
        return;
      }
      
      // Check browser capabilities
      debugInfo.push(`[BROWSER] ${navigator.userAgent.substring(0, 50)}...`);
      
      // Check network
      if ('connection' in navigator) {
        const conn = navigator.connection;
        debugInfo.push(`[NETWORK] Type: ${conn.effectiveType || 'unknown'}`);
        debugInfo.push(`[NETWORK] Downlink: ${conn.downlink || 'unknown'} Mbps`);
      }
      
      // Check available memory (Chrome only)
      if (performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
        debugInfo.push(`[MEMORY] ${usedMB}/${limitMB} MB used`);
      }
      
      // Try to create FormData
      debugInfo.push(`[UPLOAD] Creating upload data...`);
      let formData;
      try {
        formData = new FormData();
        formData.append('video', selectedVideo);
        formData.append('contactId', contactId);
        debugInfo.push(`[FORMDATA] ✓ Created successfully`);
      } catch (formErr) {
        debugInfo.push(`[FORMDATA] ✗ Error: ${formErr.message}`);
        setError(debugInfo.join('\n'));
        return;
      }
      
      // Check if memberDataService exists
      if (!memberDataService) {
        debugInfo.push(`[SERVICE] ✗ memberDataService is undefined`);
        setError(debugInfo.join('\n'));
        return;
      }
      
      if (!memberDataService.uploadVideoTestimony) {
        debugInfo.push(`[SERVICE] ✗ uploadVideoTestimony method missing`);
        setError(debugInfo.join('\n'));
        return;
      }
      
      debugInfo.push(`[SERVICE] ✓ Service ready`);
      
      // Set up timeout
      debugInfo.push(`[UPLOAD] Starting upload with 2 min timeout...`);
      setError(debugInfo.join('\n')); // Show progress in UI
      
      let uploadStartTime = Date.now();
      
      // Create upload promise with detailed error catching
      const uploadPromise = new Promise(async (resolve, reject) => {
        try {
          debugInfo.push(`[CALL] Calling uploadVideoTestimony...`);
          setError(debugInfo.join('\n')); // Update UI
          
          const result = await memberDataService.uploadVideoTestimony(contactId, selectedVideo);
          
          const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
          debugInfo.push(`[RESPONSE] Got response after ${uploadTime}s`);
          debugInfo.push(`[RESPONSE] Success: ${result.success}`);
          
          if (result.error) {
            debugInfo.push(`[RESPONSE] Error: ${result.error}`);
          }
          
          resolve(result);
        } catch (uploadErr) {
          const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
          debugInfo.push(`[UPLOAD ERROR] After ${uploadTime}s`);
          debugInfo.push(`[ERROR TYPE] ${uploadErr.name}`);
          debugInfo.push(`[ERROR MSG] ${uploadErr.message}`);
          
          // Check for specific error types
          if (uploadErr.name === 'TypeError') {
            debugInfo.push(`[DETAIL] Likely network or CORS issue`);
          } else if (uploadErr.name === 'AbortError') {
            debugInfo.push(`[DETAIL] Request was aborted`);
          } else if (uploadErr.message.includes('Failed to fetch')) {
            debugInfo.push(`[DETAIL] Network request failed - check connection`);
          } else if (uploadErr.message.includes('NetworkError')) {
            debugInfo.push(`[DETAIL] Network error - possibly offline`);
          }
          
          reject(uploadErr);
        }
      });
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          debugInfo.push(`[TIMEOUT] Upload exceeded 2 minutes`);
          reject(new Error('Upload timeout after 2 minutes'));
        }, 120000) // 2 minute timeout
      );
      
      // Update progress slowly
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          const elapsed = (Date.now() - uploadStartTime) / 1000;
          debugInfo[debugInfo.length - 1] = `[UPLOADING] ${elapsed.toFixed(0)}s elapsed...`;
          setError(debugInfo.join('\n')); // Keep updating UI
          return prev + 5;
        });
      }, 1000);
      
      // Race upload against timeout
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        debugInfo.push(`[SUCCESS] Upload completed!`);
        setError(null); // Clear debug info on success
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
        debugInfo.push(`[FAILED] ${result.error || 'Unknown error'}`);
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (err) {
      debugInfo.push(`\n[FINAL ERROR] ${err.message}`);
      debugInfo.push(`[ERROR STACK] ${err.stack?.substring(0, 200)}`);
      
      // Show all debug info in the error message
      setError(debugInfo.join('\n'));
      setUploading(false);
      setUploadProgress(0);
      
      // Don't throw, just display the error
      return;
    }
  };

  // Chunked upload for mobile (for large files)
  const handleMobileChunkedUpload = async () => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for mobile
    const totalChunks = Math.ceil(selectedVideo.size / CHUNK_SIZE);
    
    console.log(`[Mobile Upload] Splitting into ${totalChunks} chunks`);

    try {
      // First, initialize the chunked upload
      const initResult = await memberDataService.initializeChunkedUpload(contactId, {
        fileName: selectedVideo.name,
        fileSize: selectedVideo.size,
        fileType: selectedVideo.type,
        totalChunks: totalChunks
      });

      if (!initResult.success) {
        throw new Error('Failed to initialize upload');
      }

      const uploadId = initResult.uploadId;

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedVideo.size);
        const chunk = selectedVideo.slice(start, end);

        console.log(`[Mobile Upload] Uploading chunk ${i + 1}/${totalChunks}`);
        
        const chunkResult = await memberDataService.uploadVideoChunk(contactId, {
          uploadId: uploadId,
          chunkIndex: i,
          chunk: chunk,
          totalChunks: totalChunks
        });

        if (!chunkResult.success) {
          // Retry once on failure
          console.log(`[Mobile Upload] Retrying chunk ${i + 1}`);
          const retryResult = await memberDataService.uploadVideoChunk(contactId, {
            uploadId: uploadId,
            chunkIndex: i,
            chunk: chunk,
            totalChunks: totalChunks
          });
          
          if (!retryResult.success) {
            throw new Error(`Failed to upload chunk ${i + 1}`);
          }
        }

        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      // Finalize the upload
      const finalResult = await memberDataService.finalizeChunkedUpload(contactId, uploadId);
      
      if (finalResult.success) {
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
        throw new Error('Failed to finalize upload');
      }
    } catch (err) {
      // Fallback to direct upload if chunked upload is not supported
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
            className="px-6 py-3 bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Record Video Now
          </button>
          
          <label className="px-6 py-3 bg-white border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm 2xl:text-base font-medium">
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
          <video
            src={videoPreview}
            controls
            className="w-full max-w-2xl mx-auto rounded-lg"
            style={{ maxHeight: '400px' }}
          />
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