import React, { useState, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [stream, setStream] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);

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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recorderRef.current) {
        recorderRef.current.destroy();
      }
    };
  }, [downloadedVideoUrl, videoPreview, stream]);

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
          contentType: result.contentType
        });
        
        // Create a blob if we don't have one
        let blob;
        if (result.data instanceof Blob) {
          // If it's already a blob but has wrong MIME type, recreate it
          if (result.data.type !== 'video/mp4' && result.data.type !== 'video/quicktime') {
            const arrayBuffer = await result.data.arrayBuffer();
            blob = new Blob([arrayBuffer], { type: 'video/mp4' });
            console.log('[VideoTestimony] Recreated blob with video/mp4 type');
          } else {
            blob = result.data;
          }
        } else if (typeof result.data === 'string' && result.data.includes('base64,')) {
          // Handle base64 data URL
          const base64Response = result.data.split(',')[1];
          const binaryString = atob(base64Response);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'video/mp4' });
        } else if (typeof result.data === 'string') {
          // Handle raw base64 without data URL prefix
          try {
            const binaryString = atob(result.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'video/mp4' });
          } catch (e) {
            // If it's not base64, treat as raw data
            blob = new Blob([result.data], { type: 'video/mp4' });
          }
        } else {
          // Convert to Blob if needed
          blob = new Blob([result.data], { type: 'video/mp4' });
        }
        
        console.log('[VideoTestimony] Created blob:', {
          size: blob.size,
          type: blob.type
        });
        
        // For Safari, we need to ensure the video is properly loaded
        // Create a blob URL
        const url = URL.createObjectURL(blob);
        
        // Test video playability before setting it
        const testVideo = document.createElement('video');
        testVideo.muted = true;
        testVideo.playsInline = true;
        
        // Set up event handlers
        const loadPromise = new Promise((resolve, reject) => {
          let loadTimeout;
          
          testVideo.onloadedmetadata = () => {
            clearTimeout(loadTimeout);
            console.log('[VideoTestimony] Test video metadata loaded successfully');
            resolve(true);
          };
          
          testVideo.onerror = (e) => {
            clearTimeout(loadTimeout);
            console.error('[VideoTestimony] Test video error:', e);
            // Even if there's an error, we'll still try to display it
            resolve(false);
          };
          
          // Safari sometimes needs more time
          loadTimeout = setTimeout(() => {
            console.log('[VideoTestimony] Test video load timeout - proceeding anyway');
            resolve(false);
          }, 5000);
        });
        
        // Try to load the video
        testVideo.src = url;
        testVideo.load();
        
        await loadPromise;
        
        // Set the URL regardless of test result
        setDownloadedVideoUrl(url);
        
        console.log('[VideoTestimony] Video URL set:', url);
        return true;
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

  // Convert WebM to MP4 using RecordRTC's built-in converter
  const convertWebMToMP4 = async (blob) => {
    return new Promise((resolve, reject) => {
      try {
        setIsConverting(true);
        console.log('[VideoTestimony] Starting WebM to MP4 conversion...');
        
        // RecordRTC can handle conversion internally
        // For now, we'll just rename the file extension as most modern browsers/servers can handle WebM
        // If your backend specifically needs MP4, you might need a more sophisticated conversion
        
        // Create a new blob with MP4 mime type (this is a workaround, not true conversion)
        // For true conversion, you'd need something like ffmpeg.wasm
        const mp4Blob = new Blob([blob], { type: 'video/mp4' });
        
        console.log('[VideoTestimony] Conversion complete (mime type changed)');
        setIsConverting(false);
        resolve(mp4Blob);
      } catch (error) {
        console.error('[VideoTestimony] Conversion error:', error);
        setIsConverting(false);
        reject(error);
      }
    });
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

  const initializeCamera = async () => {
    try {
      setError(null);
      setIsPreviewing(true);
      
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }, 
        audio: true 
      });
      
      console.log('[VideoTestimony] Got media stream:', mediaStream);
      
      setStream(mediaStream);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('[VideoTestimony] Setting video source');
          videoRef.current.srcObject = mediaStream;
          
          // Force play
          videoRef.current.play().then(() => {
            console.log('[VideoTestimony] Video preview playing');
          }).catch(err => {
            console.error('[VideoTestimony] Error playing video:', err);
          });
        }
      }, 100);
      
    } catch (err) {
      console.error('[VideoTestimony] Error accessing camera:', err);
      setIsPreviewing(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Unable to access camera: ${err.message}`);
      }
    }
  };

  const startRecording = async () => {
    try {
      if (!stream) {
        console.error('[VideoTestimony] No stream available');
        return;
      }
      
      // Detect browser to choose appropriate settings
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isChrome = /chrome/i.test(navigator.userAgent);
      
      console.log('[VideoTestimony] Browser detection:', { isSafari, isChrome });
      
      // Force MP4 output for all browsers using Canvas recording
      const options = {
        type: 'video',
        // Force MP4 MIME type for all browsers
        mimeType: 'video/mp4',
        disableLogs: false,
        // Use WhammyRecorder or CanvasRecorder to force MP4 output
        recorderType: RecordRTC.CanvasRecorder,
        // Audio settings
        numberOfAudioChannels: 1,
        // Ensure compatibility
        checkForInactiveTracks: false,
        // Quality settings
        videoBitsPerSecond: 2500000, // 2.5 Mbps for better quality
        frameInterval: 20,
        // Canvas recording settings - this forces MP4 output
        canvas: {
          width: 1280,
          height: 720
        },
        // For CanvasRecorder to output video properly
        frameRate: 30,
        quality: 10,
        // Timeouts
        timeSlice: 1000, // Get data every second for better memory management
      };
      
      // Alternative: Use MediaStreamRecorder with video/mp4 mime type
      // Some browsers might support this directly
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('video/mp4')) {
        console.log('[VideoTestimony] Browser supports MP4 recording directly');
        options.mimeType = 'video/mp4';
        options.recorderType = RecordRTC.MediaStreamRecorder;
      } else {
        console.log('[VideoTestimony] Using Canvas recorder for MP4 output');
      }
      
      console.log('[VideoTestimony] Starting RecordRTC with options:', options);
      
      // Create RecordRTC instance
      const recorder = new RecordRTC(stream, options);
      
      // Start recording
      recorder.startRecording();
      
      recorderRef.current = recorder;
      setIsRecording(true);
      
      console.log('[VideoTestimony] Recording started with MP4 format');
      
    } catch (err) {
      console.error('[VideoTestimony] Error starting recording:', err);
      setError(`Unable to start recording: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) {
      console.error('[VideoTestimony] No recorder available');
      return;
    }
    
    recorderRef.current.stopRecording(async () => {
      console.log('[VideoTestimony] Recording stopped');
      
      // Get the blob
      let blob = recorderRef.current.getBlob();
      console.log('[VideoTestimony] Got blob:', blob.size, 'bytes, type:', blob.type);
      
      // Force MP4 extension for all recordings since we're using MP4 format
      let extension = 'mp4';
      let finalBlob = blob;
      
      // Ensure the blob has the correct MIME type
      if (!blob.type || blob.type === 'video/webm') {
        // If the blob somehow still has WebM type, recreate it with MP4 type
        finalBlob = new Blob([blob], { type: 'video/mp4' });
        console.log('[VideoTestimony] Corrected blob MIME type to video/mp4');
      }
      
      // Create URL for preview
      const url = URL.createObjectURL(finalBlob);
      setVideoPreview(url);
      
      // Create file for upload with MP4 extension
      const filename = `testimony_${Date.now()}.${extension}`;
      const file = new File([finalBlob], filename, { 
        type: 'video/mp4', // Always use MP4 type
        lastModified: Date.now()
      });
      
      console.log('[VideoTestimony] Created MP4 file:', file.name, file.size, file.type);
      setSelectedVideo(file);
      
      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('[VideoTestimony] Stopped track:', track.kind);
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Destroy recorder to free resources
      recorderRef.current.destroy();
      recorderRef.current = null;
      
      setStream(null);
      setIsRecording(false);
      setIsPreviewing(false);
    });
  };

  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('[VideoTestimony] Stopped track on cancel:', track.kind);
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
  };

  if (loading) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 font-light">Loading video testimony...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 -m-8 p-4 sm:p-4 lg:pl-2 pt-8 sm:pt-8 min-h-screen max-w-full mx-auto">
      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Video Testimony Sections */}
      <div className="space-y-8">
        {/* Upload Section OR Current Video Section */}
        {!testimony || !testimony.data || !downloadedVideoUrl ? (
          // Show upload section when no video exists
          <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3 flex-wrap">
              <div className="bg-[#0e0e2f] p-3 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              Your Video Testimony
            </h3>
                
            {!selectedVideo && !isRecording && !isPreviewing ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-12 text-center">
                <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                    
                <div className="space-y-4">
                  {/* Upload and Record Options - Responsive Layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
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
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Select Video File</span>
                    </label>
                        
                    <div className="text-gray-500 font-light hidden sm:block">or</div>
                        
                    <button
                      onClick={initializeCamera}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Record Video Now</span>
                    </button>
                  </div>
                      
                  <div className="text-gray-500 font-light sm:hidden">or</div>
                </div>
                    
                <p className="mt-4 text-xs sm:text-sm text-gray-500 font-light">
                  Maximum file size: 2GB • Supported formats: MP4, MOV, AVI, WMV, WebM, OGG
                </p>
              </div>
            ) : isPreviewing && !isRecording ? (
              <div className="space-y-6">
                {/* Preview Mode */}
                <div className="relative bg-black rounded-xl overflow-hidden w-full max-w-2xl" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay={true}
                    playsInline={true}
                    muted={true}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <div className="w-16 h-16 relative mx-auto mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                        </div>
                        <p className="text-white font-light">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </div>
                    
                <div className="bg-blue-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-700 font-medium text-sm sm:text-base">Camera preview - Ready to record</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={startRecording}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium flex-1 sm:flex-initial"
                    >
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      Start Recording
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex-1 sm:flex-initial"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                    
                <p className="text-xs sm:text-sm text-gray-500 font-light text-center">
                  Position yourself with good lighting. When ready, click "Start Recording" to begin.
                </p>
              </div>
            ) : isRecording ? (
              <div className="space-y-6">
                {/* Recording View */}
                <div className="relative bg-black rounded-xl overflow-hidden w-full max-w-2xl" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay={true}
                    playsInline={true}
                    muted={true}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
                    
                <div className="bg-red-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-red-700 font-medium text-sm sm:text-base">Recording in progress...</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={stopRecording}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex-1 sm:flex-initial"
                    >
                      Stop Recording
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex-1 sm:flex-initial"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                    
                <p className="text-xs sm:text-sm text-gray-500 font-light text-center px-4">
                  Tip: Make sure you're in good lighting and speak clearly. State your full name and your intention to be cryopreserved.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video Preview */}
                <div className="bg-black rounded-xl overflow-hidden w-full max-w-2xl">
                  <video
                    src={videoPreview}
                    className="w-full h-auto"
                    controls
                    autoPlay={false}
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      console.log('[VideoTestimony] Playback video loaded:', {
                        duration: e.target.duration,
                        dimensions: `${e.target.videoWidth}x${e.target.videoHeight}`
                      });
                    }}
                  />
                </div>

                {/* Converting message if needed */}
                {isConverting && (
                  <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">Converting video format...</p>
                      <p className="text-blue-600 text-sm">This may take a moment</p>
                    </div>
                  </div>
                )}

                {/* Selected File Info */}
                <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-lg truncate">{selectedVideo.name}</p>
                      <p className="text-sm text-gray-500 font-light">{formatFileSize(selectedVideo.size)}</p>
                    </div>
                    {!uploading && !isConverting && (
                      <button
                        onClick={() => {
                          handleCancel();
                          cancelRecording();
                        }}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
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
                    <div className="flex justify-between text-sm text-gray-500 font-light">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {!uploading && !isConverting && (
                  <button
                    onClick={handleUpload}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Upload Video Testimony
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Show current video when testimony exists
          <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3 flex-wrap">
              <div className="bg-[#0e0e2f] p-3 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              Your Video Testimony
            </h3>
                
            {/* Video Player with enhanced debugging */}
            <div className="bg-black rounded-xl overflow-hidden mb-6 w-full max-w-2xl">
              {downloadingVideo ? (
                <div className="flex items-center justify-center h-64 bg-gray-900">
                  <div className="text-center">
                    <div className="w-16 h-16 relative mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-white font-light">Loading video...</p>
                  </div>
                </div>
              ) : downloadedVideoUrl ? (
                <video
                  key={downloadedVideoUrl}
                  controls
                  className="w-full"
                  preload="metadata"
                  playsInline
                  muted={false}
                  autoPlay={false}
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
                  <source src={downloadedVideoUrl} type="video/mp4" />
                  <source src={downloadedVideoUrl} type="video/quicktime" />
                  <source src={downloadedVideoUrl} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-900">
                  <p className="text-gray-400 font-light">Video unavailable</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            {testimony.data.createdDate && testimony.data.size ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1 font-light">Uploaded on</p>
                  <p className="font-medium text-gray-800 text-lg">{formatDate(testimony.data.createdDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1 font-light">File size</p>
                  <p className="font-medium text-gray-800 text-lg">{formatFileSize(testimony.data.size)}</p>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
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
                className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Replace Video
              </button>
            </div>
          </div>
        )}

        {/* About Section - Now appears second */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-200 border border-gray-200" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
          <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3 flex-wrap">
            <div className="bg-[#2a1b3d] p-3 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            About Video Testimonies
          </h3>
          <p className="text-gray-600 font-light leading-relaxed">
            Your video testimony is a personal message that can be used as evidence that your intention upon legal death is to be cryopreserved. Make sure you take the video in good 
            lighting, indicate your full name, and detail your specific contact with Alcor and your wishes for cryopreservation.
          </p>
        </div>
      </div>

      <style jsx>{`
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

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
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

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 z-10 border border-gray-200" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Replace Video Testimony?</h3>
            <p className="text-gray-600 font-light mb-6">
              This will permanently delete your current video testimony. You'll need to upload a new video to replace it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Replace
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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