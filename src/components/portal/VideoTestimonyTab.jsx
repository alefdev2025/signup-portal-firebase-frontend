import React, { useState, useEffect, useRef } from 'react';
import { memberDataService } from './services/memberDataService';

const VideoTestimonyTab = ({ contactId }) => {
  const [testimony, setTestimony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/ogg'];

  useEffect(() => {
    if (contactId) {
      loadTestimony();
    }
  }, [contactId]);

  const loadTestimony = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await memberDataService.getVideoTestimony(contactId);
      
      if (result.success) {
        setTestimony(result.data);
      } else {
        // Only show error if it's not a "no testimony found" situation
        if (result.error && !result.error.includes('not found') && !result.error.includes('No video testimony')) {
          setError(result.error || 'Failed to load video testimony');
        }
        // If no video testimony found, that's okay - user can upload one
        console.log('[VideoTestimony] No existing video testimony found for member');
      }
    } catch (err) {
      console.error('Error loading testimony:', err);
      // Only show error for actual failures, not missing testimony
      if (err.message && !err.message.includes('not found') && !err.message.includes('No video testimony')) {
        setError('Failed to load video testimony');
      }
    } finally {
      setLoading(false);
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
    setSuccessMessage(null);
    
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
      // Prepend the filename with member_video_testimony_
      const prependedFileName = `member_video_testimony_${selectedVideo.name}`;
      formData.append('file', selectedVideo);
      formData.append('name', prependedFileName);
      formData.append('description', `Video testimony recorded on ${new Date().toLocaleDateString()}`);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setSuccessMessage('Video testimony uploaded successfully!');
            setSelectedVideo(null);
            setVideoPreview(null);
            setUploadProgress(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            // Reload the testimony
            loadTestimony();
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

      const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
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
    try {
      setError(null);
      const result = await memberDataService.deleteVideoTestimony(contactId);
      
      if (result.success) {
        setTestimony(null);
        setSuccessMessage('Video testimony deleted successfully');
        setShowDeleteConfirm(false);
      } else {
        setError(result.error || 'Failed to delete video testimony');
      }
    } catch (err) {
      console.error('Error deleting testimony:', err);
      setError('Failed to delete video testimony');
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

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Video Testimony Sections */}
        <div className="space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
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
                    Your video testimony is a personal message that can be shared with your loved ones. 
                    This is your opportunity to express your thoughts, wishes, and feelings in your own words.
                    The video will be securely stored and can be updated at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section - Always show this second */}
          {!testimony || !testimony.data ? (
            <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{animationDelay: '150ms', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
              <div className="py-4">
                <h2 className="text-2xl font-thin text-[#2a2346] mb-8 tracking-wider">UPLOAD YOUR VIDEO TESTIMONY</h2>
                
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
                      className="cursor-pointer inline-flex items-center px-6 py-3 bg-[#6b5b7e] text-white rounded-lg hover:bg-[#5a4a6d] transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Select Video File
                    </label>
                    
                    <p className="mt-4 text-sm text-gray-600">
                      Maximum file size: 2GB • Supported formats: MP4, MOV, AVI, WMV, WebM, OGG
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Video Preview */}
                    <div className="bg-black rounded-lg overflow-hidden">
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
                        className="w-full py-3 bg-[#6b5b7e] text-white rounded-lg hover:bg-[#5a4a6d] transition-colors font-medium"
                      >
                        Upload Video Testimony
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Current Testimony Section - Show this second if video exists */
            <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{animationDelay: '150ms', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
              <div className="py-4">
                <h2 className="text-2xl font-thin text-[#2a2346] mb-8 tracking-wider">YOUR CURRENT VIDEO TESTIMONY</h2>
                
                {/* Video Preview */}
                <div className="bg-black rounded-lg overflow-hidden mb-6">
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-white opacity-50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-white text-lg mb-2">{testimony.data.title}</p>
                      <p className="text-gray-400">{formatFileSize(testimony.data.size)}</p>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-6 py-3 bg-[#6b5b7e] text-white rounded-lg hover:bg-[#5a4a6d] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Video
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Replace Video
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-white rounded-lg p-8 animate-fadeInUp" style={{animationDelay: '300ms', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
            <div className="py-4">
              <h3 className="text-2xl font-thin text-[#2a2346] mb-8 tracking-wider">RECORDING TIPS</h3>
              <ul className="space-y-3 text-base text-gray-600">
                <li>• Find a quiet, well-lit location for recording</li>
                <li>• Keep your video between 5-15 minutes for the best impact</li>
                <li>• Speak clearly and from the heart</li>
                <li>• Consider what message you want to leave for your loved ones</li>
                <li>• You can update your testimony at any time</li>
              </ul>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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