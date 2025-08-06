import React, { useState, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc';
import { memberDataService } from './services/memberDataService';
import { auth } from '../../services/firebase'; // Add this if not already there

// Global configuration for video overlay
const SHOW_VIDEO_OVERLAY = false; // Set to false to disable overlay
const VIDEO_OVERLAY_GRADIENT = 'linear-gradient(to bottom right, rgba(18, 36, 60, 0.95) 0%, rgba(110, 67, 118, 0.9) 40%, rgba(156, 116, 144, 0.75) 70%, rgba(178, 138, 172, 0.65) 100%)';

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

  const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/ogg'];
  const MAX_RECORDING_TIME = 60; // 60 seconds max
  const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

  // Add Helvetica font styles
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
      .video-testimony-tab .font-thin {
        font-weight: 100 !important;
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
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
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
          //console.log('[VideoTestimony] Video download failed - showing upload view');
          setTestimony(null);
        }
      } else {
        // Only show error if it's not a "no testimony found" situation
        if (result.error && !result.error.includes('not found') && !result.error.includes('No video testimony')) {
          setError(result.error || 'Failed to load video testimony');
        }
        // If no video testimony found, that's okay - user can upload one
        //console.log('[VideoTestimony] No existing video testimony found for member');
        setTestimony(null);
      }
    } catch (err) {
      //console.error('Error loading testimony:', err);
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
      //console.log('[VideoTestimony] Downloading video for playback...');
      
      const result = await memberDataService.downloadVideoTestimony(contactId);
      
      if (result.success && result.data) {
        // Debug: Check what we received
        /*console.log('[VideoTestimony] Download result details:', {
          dataType: typeof result.data,
          dataLength: result.data.length || result.data.size,
          isBlob: result.data instanceof Blob,
          blobSize: result.data.size,
          blobType: result.data.type,
          contentType: result.contentType
        });*/
        
        // Create a blob if we don't have one
        let blob;
        if (result.data instanceof Blob) {
          // If it's already a blob but has wrong MIME type, recreate it
          if (result.data.type !== 'video/mp4' && result.data.type !== 'video/quicktime') {
            const arrayBuffer = await result.data.arrayBuffer();
            blob = new Blob([arrayBuffer], { type: 'video/mp4' });
            //console.log('[VideoTestimony] Recreated blob with video/mp4 type');
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
        
        /*console.log('[VideoTestimony] Created blob:', {
          size: blob.size,
          type: blob.type
        });*/
        
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
            //console.log('[VideoTestimony] Test video metadata loaded successfully');
            resolve(true);
          };
          
          testVideo.onerror = (e) => {
            clearTimeout(loadTimeout);
            //console.error('[VideoTestimony] Test video error:', e);
            // Even if there's an error, we'll still try to display it
            resolve(false);
          };
          
          // Safari sometimes needs more time
          loadTimeout = setTimeout(() => {
            //console.log('[VideoTestimony] Test video load timeout - proceeding anyway');
            resolve(false);
          }, 5000);
        });
        
        // Try to load the video
        testVideo.src = url;
        testVideo.load();
        
        await loadPromise;
        
        // Set the URL regardless of test result
        setDownloadedVideoUrl(url);
        
        //console.log('[VideoTestimony] Video URL set:', url);
        return true;
      } else {
        //console.error('[VideoTestimony] Failed to download video for playback');
        return false;
      }
    } catch (err) {
      //console.error('[VideoTestimony] Error downloading video for playback:', err);
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

  const handleVideoSelect = (event) => {
    const file = event.target.files[0];
    
    // Clear any existing error when file input is clicked
    setError(null);
    
    if (!file) return;
    
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

    // Create URL and check video duration
    const videoUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = function() {
      URL.revokeObjectURL(videoUrl);
      const duration = videoElement.duration;
      
      // Allow up to 65 seconds (5 second buffer)
      if (duration > MAX_RECORDING_TIME + 5) {
        setError(`Video must be 65 seconds or less. Your video is ${Math.round(duration)} seconds long.`);
        return;
      }
      
      // If all validations pass, set the video
      setSelectedVideo(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    };
    
    videoElement.onerror = function() {
      URL.revokeObjectURL(videoUrl);
      setError('Unable to read video file. Please ensure it is a valid video format.');
    };
    
    videoElement.src = videoUrl;
  };

  // Convert WebM to MP4 using RecordRTC's built-in converter
  const convertWebMToMP4 = async (blob) => {
    return new Promise((resolve, reject) => {
      try {
        setIsConverting(true);
        //console.log('[VideoTestimony] Starting WebM to MP4 conversion...');
        
        // RecordRTC can handle conversion internally
        // For now, we'll just rename the file extension as most modern browsers/servers can handle WebM
        // If your backend specifically needs MP4, you might need a more sophisticated conversion
        
        // Create a new blob with MP4 mime type (this is a workaround, not true conversion)
        // For true conversion, you'd need something like ffmpeg.wasm
        const mp4Blob = new Blob([blob], { type: 'video/mp4' });
        
        //console.log('[VideoTestimony] Conversion complete (mime type changed)');
        setIsConverting(false);
        resolve(mp4Blob);
      } catch (error) {
        //console.error('[VideoTestimony] Conversion error:', error);
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
  
      // GET AUTH TOKEN FIRST
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to upload video testimony');
        return;
      }
      const token = await currentUser.getIdToken();
  
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
                //console.error('Error reloading testimony after upload:', err);
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
      
      // ADD AUTH HEADER!
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.send(formData);
  
    } catch (err) {
      //console.error('Error uploading video:', err);
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
      //console.error('Error deleting testimony:', err);
      
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
      //console.error('Error downloading video:', err);
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
      // Don't set previewing to true yet
      
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }, 
        audio: true 
      });
      
      //console.log('[VideoTestimony] Got media stream:', mediaStream);
      
      // Only set previewing true if we successfully got the stream
      setIsPreviewing(true);
      setStream(mediaStream);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          //console.log('[VideoTestimony] Setting video source');
          videoRef.current.srcObject = mediaStream;
          
          // Force play
          videoRef.current.play().then(() => {
            //console.log('[VideoTestimony] Video preview playing');
          }).catch(err => {
            //console.error('[VideoTestimony] Error playing video:', err);
          });
        }
      }, 100);
      
    } catch (err) {
      //console.error('[VideoTestimony] Error accessing camera:', err);
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

  const startRecording = async () => {
    try {
      if (!stream) {
        //console.error('[VideoTestimony] No stream available');
        return;
      }
      
      // Reset recording time
      setRecordingTime(0);
      
      // Detect browser to choose appropriate settings
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isChrome = /chrome/i.test(navigator.userAgent);
      
      //console.log('[VideoTestimony] Browser detection:', { isSafari, isChrome });
      
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
        //console.log('[VideoTestimony] Browser supports MP4 recording directly');
        options.mimeType = 'video/mp4';
        options.recorderType = RecordRTC.MediaStreamRecorder;
      } else {
        //console.log('[VideoTestimony] Using Canvas recorder for MP4 output');
      }
      
      //console.log('[VideoTestimony] Starting RecordRTC with options:', options);
      
      // Create RecordRTC instance
      const recorder = new RecordRTC(stream, options);
      
      // Start recording
      recorder.startRecording();
      
      recorderRef.current = recorder;
      setIsRecording(true);
      
      // Start the timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 90 seconds
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
      
      //console.log('[VideoTestimony] Recording started with MP4 format');
      
    } catch (err) {
      //console.error('[VideoTestimony] Error starting recording:', err);
      setError(`Unable to start recording: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) {
      //console.error('[VideoTestimony] No recorder available');
      return;
    }
    
    // Clear the timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    recorderRef.current.stopRecording(async () => {
      //console.log('[VideoTestimony] Recording stopped');
      
      // Get the blob
      let blob = recorderRef.current.getBlob();
      //console.log('[VideoTestimony] Got blob:', blob.size, 'bytes, type:', blob.type);
      
      // Force MP4 extension for all recordings since we're using MP4 format
      let extension = 'mp4';
      let finalBlob = blob;
      
      // Ensure the blob has the correct MIME type
      if (!blob.type || blob.type === 'video/webm') {
        // If the blob somehow still has WebM type, recreate it with MP4 type
        finalBlob = new Blob([blob], { type: 'video/mp4' });
        //console.log('[VideoTestimony] Corrected blob MIME type to video/mp4');
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
      
      //console.log('[VideoTestimony] Created MP4 file:', file.name, file.size, file.type);
      setSelectedVideo(file);
      
      // Clean up
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          //console.log('[VideoTestimony] Stopped track:', track.kind);
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
      setRecordingTime(0);
    });
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
        //console.log('[VideoTestimony] Stopped track on cancel:', track.kind);
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
        <div className="px-4 md:px-0">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 relative mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
              </div>
              <p className="text-gray-500 font-light">Loading video testimony...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-testimony-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      {/* Small top padding */}
      <div className="h-8"></div>
      
      <div className="px-4 md:px-0">
      {/* Messages */}
      {error && (
                error === 'camera-permission-denied' ? (
                  <div className="mb-6 bg-gray-50 border border-gray-300 rounded-xl p-6">
                    <h3 className="text-gray-800 font-medium text-lg mb-3">Camera Access Needed</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Please allow camera access in your browser settings and refresh the page.
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                      >
                        Refresh Page
                      </button>
                      <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    <p className="font-medium">{error}</p>
                  </div>
                )
              )}

        {/* Video Testimony Sections */}
        <div className="space-y-8">
          {/* Upload Section OR Current Video Section */}
          {!testimony || !testimony.data || !downloadedVideoUrl ? (
            // Show upload section when no video exists
            <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              <h3 className="text-xl font-medium text-gray-800 mb-12 flex items-center gap-3 flex-wrap">
                <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
                  <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                Your Video Testimony
              </h3>
                  
              {!selectedVideo && !isRecording && !isPreviewing ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-14 text-center">
                  <svg className="mx-auto h-14 w-14 sm:h-18 sm:w-18 mb-6" fill="none" stroke="#6e4376" strokeWidth="0.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                      
                  <div className="space-y-6">
                    {/* Upload and Record Options - Responsive Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="video-upload"
                        className="hidden"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        onClick={(e) => {
                          setError(null); // Clear error when clicking to select new file
                          e.target.value = null; // Allow re-selecting the same file
                        }}
                      />
                          
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-yellow-500 text-yellow-600 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Select Video File</span>
                    </label>
                          
                      <div className="text-gray-500 font-light hidden sm:block">or</div>
                          
                      <button
                        onClick={initializeCamera}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-yellow-500 text-yellow-600 rounded-lg text-sm font-medium w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Record Video Now</span>
                      </button>
                    </div>
                        
                    <div className="text-gray-500 font-light sm:hidden">or</div>
                  </div>
                      
                  <p className="mt-6 text-xs sm:text-sm text-gray-500 font-light">
                    Maximum file size: 2GB • Maximum duration: 60 seconds • Supported formats: MP4, MOV, AVI, WMV, WebM, OGG
                  </p>
                </div>
              ) : isPreviewing && !isRecording ? (
                <div className="space-y-6">
                  {/* Preview Mode - Two Column Layout */}
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Video Preview Column */}
                    <div className="flex-1">
                      <div className="relative bg-black rounded-xl overflow-hidden w-full" style={{ aspectRatio: '16/9' }}>
                        <video
                          ref={videoRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover"
                        />
                        {!stream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                              <div className="w-16 h-16 relative mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                              </div>
                              <p className="text-white font-light mb-4">Initializing camera...</p>
                              
                              {/* Add a retry button */}
                              <button
                                onClick={() => {
                                  setError(null);
                                  initializeCamera();
                                }}
                                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                              >
                                Having trouble? Click to retry
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Script Guidance Panel - Visible on larger screens */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                      <div className="bg-white rounded-2xl border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2 rounded-lg shadow-md">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <h3 className="text-base font-medium text-gray-800">Speaking Points</h3>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">1. State Your Full Name</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"My name is [Your Full Legal Name]"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">2. Confirm Membership</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"I am a member of Alcor Life Extension Foundation"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">3. State Your Intention</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"It is my wish and intention to be cryopreserved upon my legal death"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">4. Confirm Arrangements</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"I have made arrangements with Alcor for this purpose"</p>
                          </div>
                          
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 font-light">
                              <span className="font-medium">Optional:</span> Share why cryopreservation is important to you
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                      
                  <div className="border border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">Camera preview - Ready to record</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={startRecording}
                        className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all flex items-center justify-center gap-2 text-sm font-medium flex-1 sm:flex-initial"
                      >
                        <div className="w-2 h-2 bg-[#6b5b7e] rounded-full flex-shrink-0"></div>
                        Start Recording
                      </button>
                      <button
                        onClick={cancelRecording}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium flex-1 sm:flex-initial"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                      
                  <p className="text-xs sm:text-sm text-gray-500 font-light text-center mt-6">
                    Position yourself with good lighting. When ready, click "Start Recording" to begin. <span className="font-medium">Maximum recording time: 60 seconds.</span>
                  </p>
                  
                  {/* Mobile Script Guide - Improved to match desktop style */}
                  <div className="lg:hidden bg-white rounded-2xl border border-gray-200 shadow-lg mt-8">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2 rounded-lg shadow-md">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium text-gray-800">Speaking Points</h3>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">1. State Your Full Name</p>
                        <p className="text-xs text-gray-600 font-light pl-4">"My name is [Your Full Legal Name]"</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-800">2. Confirm Membership</p>
                        <p className="text-xs text-gray-600 font-light pl-4">"I am a member of Alcor Life Extension Foundation"</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-800">3. State Your Intention</p>
                        <p className="text-xs text-gray-600 font-light pl-4">"It is my wish and intention to be cryopreserved upon my legal death"</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-800">4. Confirm Arrangements</p>
                        <p className="text-xs text-gray-600 font-light pl-4">"I have made arrangements with Alcor for this purpose"</p>
                      </div>
                      
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-light">
                          <span className="font-medium">Optional:</span> Share why cryopreservation is important to you
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isRecording ? (
                <div className="space-y-6">
                  {/* Recording View with Script Guidance */}
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Video Recording Box */}
                    <div className="flex-1">
                      <div className="relative bg-black rounded-xl overflow-hidden w-full" style={{ aspectRatio: '16/9' }}>
                        <video
                          ref={videoRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Script Guidance Panel - Visible on larger screens */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                      <div className="bg-white rounded-2xl border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2 rounded-lg shadow-md">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <h3 className="text-base font-medium text-gray-800">Speaking Points</h3>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">1. State Your Full Name</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"My name is [Your Full Legal Name]"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">2. Confirm Membership</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"I am a member of Alcor Life Extension Foundation"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">3. State Your Intention</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"It is my wish and intention to be cryopreserved upon my legal death"</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-800">4. Confirm Arrangements</p>
                            <p className="text-xs text-gray-600 font-light pl-4">"I have made arrangements with Alcor for this purpose"</p>
                          </div>
                          
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 font-light">
                              <span className="font-medium">Optional:</span> Share why cryopreservation is important to you
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                      
                  <div className="border border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse flex-shrink-0"></div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">Recording in progress...</span>
                      <span className="text-red-700 font-bold text-lg">
                        {formatTime(recordingTime)} / 1:00
                      </span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all text-sm font-medium flex-1 sm:flex-initial"
                      >
                        Stop Recording
                      </button>
                      <button
                        onClick={cancelRecording}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium flex-1 sm:flex-initial"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  
                </div>
              ) : (
                <div className="space-y-8">
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
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3 mt-6">
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
                  <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm mt-6">
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

                  {/* Checklist before upload */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-6" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-2 rounded-lg shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-gray-800">Before uploading, verify your video includes:</p>
                    </div>
                    <div className="space-y-2 pl-11">
                      <div>
                        <p className="text-sm font-medium text-gray-800">1. Your full legal name</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">2. Confirmation of your Alcor membership</p>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-800">3. Your intention to be cryopreserved</p>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-800">4. Confirmation of arrangements with Alcor</p>
                     </div>
                   </div>
                 </div>

                 {/* Upload Progress */}
                 {uploading && (
                   <div className="space-y-2 mt-6">
                     <div className="flex justify-between text-sm text-gray-500 font-light">
                       <span>Uploading...</span>
                       <span>{uploadProgress}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div
                         className="bg-gradient-to-r from-[#6b5b7e] to-[#4a4266] h-2 rounded-full transition-all duration-300"
                         style={{ width: `${uploadProgress}%` }}
                       />
                     </div>
                   </div>
                 )}

                 {/* Upload Button */}
                 {!uploading && !isConverting && (
                   <button
                     onClick={handleUpload}
                     className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all flex items-center justify-center gap-2 text-sm font-medium mt-6"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                     </svg>
                     Upload Video Testimony
                   </button>
                 )}
               </div>
             )}
           </div>
         ) : (
           // Show current video when testimony exists
           <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
             <h3 className="text-xl font-medium text-gray-800 mb-12 flex items-center gap-3 flex-wrap">
               <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
                 <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
               </div>
               Your Video Testimony
             </h3>
                 
             {/* Video Player with enhanced debugging */}
             <div className="bg-black rounded-xl overflow-hidden mb-12 w-full max-w-2xl relative">
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
                 <div className="relative">
                   <video
                     key={downloadedVideoUrl}
                     controls
                     className="w-full"
                     preload="metadata"
                     playsInline
                     muted={false}
                     autoPlay={false}
                     onPlay={() => {
                       // Hide overlay when video starts playing
                       if (SHOW_VIDEO_OVERLAY) {
                         const overlay = document.getElementById('video-overlay');
                         if (overlay) {
                           overlay.style.display = 'none';
                         }
                       }
                     }}
                     onPause={() => {
                       // Show overlay when video is paused
                       if (SHOW_VIDEO_OVERLAY) {
                         const overlay = document.getElementById('video-overlay');
                         if (overlay) {
                           overlay.style.display = 'flex';
                         }
                       }
                     }}
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
                         //console.error(`[Video] ${errorMessages[errorCode] || 'Unknown error'}`);
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
                   {/* Dark overlay with text */}
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
                         <p className="text-white text-xl font-medium">Your Current Video Testimony</p>
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex items-center justify-center h-64 bg-gray-900">
                   <p className="text-gray-400 font-light">Video unavailable</p>
                 </div>
               )}
             </div>

             {/* Video Info */}
             {testimony.data.createdDate && testimony.data.size ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
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
                 className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all flex items-center justify-center gap-2 text-sm font-medium"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 Download Video
               </button>
               <button
                 onClick={() => {
                   setError(null); // Clear any existing errors
                   setShowDeleteConfirm(true);
                 }}
                 className="px-4 py-2 bg-white border border-yellow-500 text-yellow-600 rounded-lg text-sm font-medium"
               >
                 Replace Video
               </button>
             </div>
           </div>
         )}

         {/* About Section - Now appears second */}
         <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-200 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
           <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3 flex-wrap">
             <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
               <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
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
         <div className="h-4 md:h-12"></div>
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
         <div className="relative bg-white rounded-2xl max-w-md w-full p-6 z-10 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
           <h3 className="text-lg font-medium text-gray-800 mb-4">Replace Video Testimony?</h3>
           <p className="text-gray-600 font-light mb-6">
             This will permanently delete your current video testimony. You'll need to upload a new video to replace it.
           </p>
           <div className="flex gap-3">
             <button
               onClick={handleDelete}
               className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all text-sm font-medium"
             >
               Yes, Replace
             </button>
             <button
               onClick={() => setShowDeleteConfirm(false)}
               className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
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
          <svg 
            className="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            viewBox="0 0 24 24"
          >
           <path 
             strokeLinecap="round" 
             strokeLinejoin="round" 
             d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
           />
         </svg>
       </button>

       {/* Help Popup */}
       {showHelpPopup && (
         <div className="fixed bottom-28 right-8 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50 animate-slideIn">
           <div className="bg-[#9f5fa6] text-white px-4 py-3 flex items-center justify-between">
             <h3 className="text-base" style={{ fontWeight: 500 }}>Video Testimony Help</h3>
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
                 <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Sample Script</h4>
                 <p className="text-sm text-gray-600 mb-2">Here's a recommended statement to include:</p>
                 <p className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                   "My name is [your full legal name]. I am a member of Alcor Life Extension Foundation. It is my wish and intention to be cryopreserved upon my legal death. I have made arrangements with Alcor for this purpose."
                 </p>
               </div>
               
               <div className="pb-4 border-b border-gray-100">
               <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Recording a Video</h4>
               <p className="text-sm text-gray-600">Click "Record Video Now" to use your device's camera. Make sure you're in a well-lit area and speak clearly.</p>
             </div>
             
             <div className="pb-4 border-b border-gray-100">
               <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Uploading a Video</h4>
               <p className="text-sm text-gray-600">Click "Select Video File" to upload a pre-recorded video. Maximum file size is 2GB. Supported formats: MP4, MOV, AVI, WMV, WebM, OGG.</p>
             </div>
             
             <div className="pb-4 border-b border-gray-100">
               <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>What to Include</h4>
               <p className="text-sm text-gray-600">State your full legal name, confirm your intention to be cryopreserved, and mention your membership with Alcor.</p>
             </div>
             
             <div className="pb-4 border-b border-gray-100">
               <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Why It's Important</h4>
               <p className="text-sm text-gray-600">Your video testimony serves as evidence of your wishes and can help ensure your cryopreservation arrangements are honored.</p>
             </div>
             
             <div>
               <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Need assistance?</h4>
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