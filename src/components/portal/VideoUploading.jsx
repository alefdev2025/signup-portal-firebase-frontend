import React from 'react';
import { auth } from '../../services/firebase';
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

  const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

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
            
            // Update the flag to indicate video exists
            await updateVideoTestimonyStatus(true);
            
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

  if (selectedVideo) {
    return (
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
    );
  }

  return (
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
  );
};

export default VideoUploading;