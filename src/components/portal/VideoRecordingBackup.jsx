import React from 'react';
import RecordRTC from 'recordrtc';

const VideoRecording = ({
  isPreviewing,
  isRecording,
  stream,
  recordingTime,
  videoRef,
  recorderRef,
  recordingIntervalRef,
  setError,
  setIsPreviewing,
  setStream,
  setIsRecording,
  setRecordingTime,
  setSelectedVideo,
  setVideoPreview,
  initializeCamera,
  formatTime,
  MAX_RECORDING_TIME
}) => {

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

  const SpeakingPointsPanel = () => (
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
  );

  if (isPreviewing && !isRecording) {
    return (
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
            <SpeakingPointsPanel />
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
    );
  }

  if (isRecording) {
    return (
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
            <SpeakingPointsPanel />
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
    );
  }

  return null;
};

export default VideoRecording;

