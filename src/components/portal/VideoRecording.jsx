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
          // Clear any previous errors
          setError(null);
          
          // Add better error checking for stream
          if (!stream) {
            console.error('[VideoTestimony] No stream available when trying to start recording');
            setError('Camera not ready. Please wait for the preview to load, then try again.');
            return;
          }
          
          // Check if stream is still active
          const tracks = stream.getTracks();
          if (!tracks || tracks.length === 0) {
            console.error('[VideoTestimony] Stream has no tracks');
            setError('Camera disconnected. Please refresh the page and allow camera access when prompted.');
            return;
          }
          
          // Check for both video and audio tracks
          const videoTracks = tracks.filter(track => track.kind === 'video');
          const audioTracks = tracks.filter(track => track.kind === 'audio');
          
          if (videoTracks.length === 0) {
            console.error('[VideoTestimony] No video track found');
            setError('Camera not detected. Please check that your camera is connected and not being used by another application.');
            return;
          }
          
          if (audioTracks.length === 0) {
            console.error('[VideoTestimony] No audio track found');
            setError('Microphone not detected. Please check that your microphone is connected and allow microphone access in your browser.');
            return;
          }
          
          // Check if tracks are still active
          const inactiveTracks = tracks.filter(track => track.readyState !== 'live');
          if (inactiveTracks.length > 0) {
            console.error('[VideoTestimony] Some tracks are not active:', inactiveTracks);
            const trackTypes = inactiveTracks.map(t => t.kind).join(' and ');
            setError(`Your ${trackTypes} is not active. Please check your browser permissions:\n\n` +
                     `Chrome: Click the camera icon in the address bar and select "Allow"\n` +
                     `Then refresh this page.`);
            return;
          }
          
          // Reset recording time to zero when starting
          setRecordingTime(0);
          
          // Browser detection for logging
          const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
          const isEdge = /edg/i.test(navigator.userAgent);
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isFirefox = /firefox/i.test(navigator.userAgent);
          
          console.log('[VideoTestimony] Browser detection:', { 
            isChrome,
            isEdge,
            isSafari, 
            isFirefox,
            userAgent: navigator.userAgent 
          });
          
          // Log detailed track information
          console.log('[VideoTestimony] Stream tracks:', tracks.map(t => ({
            kind: t.kind,
            label: t.label,
            readyState: t.readyState,
            enabled: t.enabled,
            muted: t.muted
          })));
          
          // Check Chrome-specific permissions
          if (isChrome || isEdge) {
            try {
              const permissions = await navigator.permissions.query({ name: 'camera' });
              const micPermissions = await navigator.permissions.query({ name: 'microphone' });
              
              console.log('[VideoTestimony] Chrome/Edge Permissions:', {
                camera: permissions.state,
                microphone: micPermissions.state
              });
              
              if (permissions.state === 'denied' || micPermissions.state === 'denied') {
                setError(`Camera/Microphone access is blocked in your browser.\n\n` +
                        `To fix this:\n` +
                        `1. Click the lock icon in your address bar\n` +
                        `2. Find "Camera" and "Microphone" settings\n` +
                        `3. Change both to "Allow"\n` +
                        `4. Refresh this page`);
                return;
              }
            } catch (e) {
              console.log('[VideoTestimony] Could not check permissions:', e);
            }
          }
          
          // CRITICAL: Build options for RecordRTC
          const options = {
            type: 'video',
            mimeType: 'video/webm', // Simple webm, let browser choose codec
            disableLogs: false,
            numberOfAudioChannels: 1,
            checkForInactiveTracks: false,
            videoBitsPerSecond: 2500000,
            timeSlice: 1000,
            bitsPerSecond: 2500000,
            audioBitsPerSecond: 128000
          };
          
          // FORCE MediaStreamRecorder if MediaRecorder is available
          if (typeof MediaRecorder !== 'undefined') {
            options.recorderType = RecordRTC.MediaStreamRecorder;
            console.log('[VideoTestimony] Forcing MediaStreamRecorder');
            
            // Test which specific codec to use
            const codecs = [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=h264,opus',
              'video/webm'
            ];
            
            for (const codec of codecs) {
              if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(codec)) {
                options.mimeType = codec;
                console.log('[VideoTestimony] Using supported codec:', codec);
                break;
              }
            }
          } else {
            console.error('[VideoTestimony] MediaRecorder not available in this browser');
            setError('Your browser does not support MediaRecorder. Please update Chrome or try a different browser.');
            return;
          }
          
          console.log('[VideoTestimony] Final recording options:', options);
          
          // Initialize RecordRTC instance
          let recorder;
          try {
            recorder = new RecordRTC(stream, options);
            console.log('[VideoTestimony] Recorder created successfully');
            
            // VERIFY we got the right recorder type
            if (recorder.getInternalRecorder) {
              const internalRecorder = recorder.getInternalRecorder();
              if (internalRecorder) {
                const recorderName = internalRecorder.constructor.name;
                console.log('[VideoTestimony] Using internal recorder:', recorderName);
                
                // Check if we got the wrong recorder type
                if (recorderName === 'WhammyRecorder' || recorderName === 'GifRecorder' || recorderName === 'CanvasRecorder') {
                  console.error('[VideoTestimony] Wrong recorder type selected:', recorderName);
                  
                  // Destroy the wrong recorder
                  if (recorder.destroy) {
                    recorder.destroy();
                  }
                  
                  // Force create with MediaStreamRecorder explicitly
                  const forceOptions = {
                    type: 'video',
                    mimeType: 'video/webm',
                    recorderType: RecordRTC.MediaStreamRecorder,
                    disableLogs: false,
                    numberOfAudioChannels: 1,
                    checkForInactiveTracks: false,
                    videoBitsPerSecond: 2500000,
                    timeSlice: 1000
                  };
                  
                  recorder = new RecordRTC(stream, forceOptions);
                  console.log('[VideoTestimony] Recreated recorder with forced MediaStreamRecorder');
                  
                  // Check again
                  if (recorder.getInternalRecorder) {
                    const newInternalRecorder = recorder.getInternalRecorder();
                    if (newInternalRecorder) {
                      console.log('[VideoTestimony] New recorder type:', newInternalRecorder.constructor.name);
                    }
                  }
                }
              }
            }
          } catch (recorderError) {
            console.error('[VideoTestimony] Failed to create recorder:', recorderError);
            console.error('Error details:', {
              message: recorderError.message,
              stack: recorderError.stack,
              name: recorderError.name
            });
            
            // Provide specific error message
            if (isChrome || isEdge) {
              setError(`Failed to initialize recording in Chrome/Edge.\n\n` +
                      `Please try:\n` +
                      `1. Closing all other browser tabs\n` +
                      `2. Checking if camera is used by another app\n` +
                      `3. Refreshing this page\n` +
                      `4. Restarting Chrome if the issue persists`);
            } else {
              setError(`Failed to initialize recording. Please try refreshing the page or using Chrome/Edge browser.`);
            }
            return;
          }
          
          // Begin recording with error handling
          try {
            recorder.startRecording();
            console.log('[VideoTestimony] startRecording() called');
            
            // Verify recording actually started after a short delay
            setTimeout(() => {
              if (recorder.getState) {
                const state = recorder.getState();
                console.log('[VideoTestimony] Recorder state after 100ms:', state);
                
                if (state !== 'recording') {
                  console.error('[VideoTestimony] Recording did not start properly, state:', state);
                  setError('Recording failed to start. Please refresh the page and try again.');
                  
                  // Clean up
                  if (recorder.destroy) {
                    recorder.destroy();
                  }
                  recorderRef.current = null;
                  setIsRecording(false);
                  return;
                } else {
                  console.log('[VideoTestimony] Recording confirmed active');
                }
              }
            }, 100);
            
          } catch (startError) {
            console.error('[VideoTestimony] Failed to start recording:', startError);
            console.error('Start error details:', {
              message: startError.message,
              stack: startError.stack,
              name: startError.name
            });
            
            // Check for specific error types
            if (startError.name === 'NotAllowedError') {
              setError(`Recording permission was denied.\n\n` +
                      `Please click the camera icon in your address bar and select "Allow", then refresh the page.`);
            } else if (startError.name === 'NotFoundError') {
              setError(`No camera or microphone found.\n\n` +
                      `Please check that your devices are properly connected and not being used by another application.`);
            } else if (startError.name === 'NotReadableError') {
              setError(`Camera or microphone is already in use.\n\n` +
                      `Please close other applications or browser tabs that might be using your camera, then refresh this page.`);
            } else {
              setError(`Failed to start recording.\n\n` +
                      `Error: ${startError.message || 'Unknown error'}\n\n` +
                      `Please try refreshing the page or using a different browser.`);
            }
            
            // Clean up on error
            if (recorder && recorder.destroy) {
              recorder.destroy();
            }
            return;
          }
          
          // If we got here, recording started successfully
          recorderRef.current = recorder;
          setIsRecording(true);
          
          // Initialize recording timer
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => {
              const newTime = prev + 1;
              // Auto-stop at maximum time limit
              if (newTime >= MAX_RECORDING_TIME) {
                stopRecording();
                return MAX_RECORDING_TIME;
              }
              return newTime;
            });
          }, 1000);
          
          console.log('[VideoTestimony] Recording started successfully and timer initialized');
          
        } catch (err) {
          console.error('[VideoTestimony] Unexpected error starting recording:', err);
          console.error('Full error object:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            toString: err.toString()
          });
          setError(`Unable to start recording.\n\n` +
                  `Error details: ${err.message || 'Unknown error'}\n\n` +
                  `Please try:\n` +
                  `1. Refreshing the page\n` +
                  `2. Checking camera/microphone permissions\n` +
                  `3. Using Chrome or Edge browser\n` +
                  `4. Closing other applications using your camera`);
        }
       };

       const stopRecording = () => {
        if (!recorderRef.current) {
          console.error('[VideoTestimony] No recorder available');
          return;
        }
        
        // Stop and clear the timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        try {
          recorderRef.current.stopRecording(async () => {
            console.log('[VideoTestimony] Recording stopped');
            
            // Retrieve the recorded blob
            let blob = recorderRef.current.getBlob();
            console.log('[VideoTestimony] Got blob:', {
              size: blob.size,
              type: blob.type
            });
            
            // KEEP THE ORIGINAL BLOB BUT ENSURE IT HAS A TYPE
            let finalBlob = blob;
            
            // If blob has no type or wrong type, create new blob with video/webm
            if (!blob.type || blob.type === '' || !blob.type.startsWith('video/')) {
              console.log('[VideoTestimony] Fixing blob type from:', blob.type, 'to video/webm');
              // Keep the data but fix the MIME type
              finalBlob = new Blob([blob], { type: 'video/webm' });
            }
            
            console.log('[VideoTestimony] Final blob type:', finalBlob.type);
            
            // Generate preview URL
            const url = URL.createObjectURL(finalBlob);
            setVideoPreview(url);
            
            // Create file for upload - ENSURE MIME TYPE IS SET
            const filename = `testimony_${Date.now()}.webm`;
            
            // CRITICAL: Force the MIME type to be video/webm
            const file = new File([finalBlob], filename, { 
              type: 'video/webm', // Always force this to be video/webm
              lastModified: Date.now()
            });
            
            console.log('[VideoTestimony] Created file for upload:', {
              name: file.name,
              size: file.size,
              type: file.type
            });
            
            // Double-check the file type
            if (!file.type || file.type === '' || !file.type.startsWith('video/')) {
              console.error('[VideoTestimony] WARNING: File still has wrong type:', file.type);
            }
            
            setSelectedVideo(file);
            
            // Release camera and microphone
            if (stream) {
              stream.getTracks().forEach(track => {
                track.stop();
                console.log('[VideoTestimony] Stopped track:', track.kind);
              });
            }
            
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            
            // Clean up recorder resources
            if (recorderRef.current.destroy) {
              recorderRef.current.destroy();
            }
            recorderRef.current = null;
            
            setStream(null);
            setIsRecording(false);
            setIsPreviewing(false);
            setRecordingTime(0);
          });
        } catch (stopError) {
          console.error('[VideoTestimony] Error stopping recording:', stopError);
          setError(`Failed to stop recording: ${stopError.message || 'Unknown error'}`);
        }
      };

  const cancelRecording = () => {
    // Clear timer if active
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Destroy recorder if exists
    if (recorderRef.current) {
      try {
        if (recorderRef.current.destroy) {
          recorderRef.current.destroy();
        }
      } catch (e) {
        console.error('[VideoTestimony] Error destroying recorder:', e);
      }
      recorderRef.current = null;
    }
    
    // Stop all media tracks
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('[VideoTestimony] Stopped track on cancel:', track.kind);
        });
      } catch (e) {
        console.error('[VideoTestimony] Error stopping tracks:', e);
      }
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Reset all states
    setStream(null);
    setIsRecording(false);
    setIsPreviewing(false);
    setSelectedVideo(null);
    setVideoPreview(null);
    setRecordingTime(0);
    setError(null); // Clear any errors
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

  // Consistent video container styles for both preview and recording
  const videoContainerStyle = {
    aspectRatio: '9/16',
    maxHeight: '500px',
    width: '100%'
  };

  // Preview mode before recording starts
  if (isPreviewing && !isRecording) {
    return (
      <div className="w-full space-y-6">
        {/* Preview Mode - Two Column Layout on Desktop, Stacked on Mobile */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Preview and Controls Column */}
          <div className="flex-1 space-y-4">
            {/* Video Preview - Fixed sizing */}
            <div className="relative bg-black rounded-xl overflow-hidden max-w-md mx-auto lg:max-w-none lg:!aspect-video" style={videoContainerStyle}>
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
            
            {/* Recording Controls - Always directly under video */}
            <div className="border border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700 font-medium text-sm sm:text-base">Camera preview - Ready to record</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={startRecording}
                  disabled={!stream}
                  className="px-4 py-2 bg-transparent border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:border-[#5d4d70] hover:text-[#5d4d70] transition-all flex items-center justify-center gap-2 text-sm font-medium flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {/* Mobile Script Guide - Shows below controls on mobile */}
            <div className="lg:hidden">
              <SpeakingPointsPanel />
            </div>
            
            <p className="text-xs sm:text-sm text-gray-500 font-light text-center">
              Position yourself with good lighting. When ready, click "Start Recording" to begin. <span className="font-medium">Maximum recording time: 60 seconds.</span>
            </p>
          </div>
          
          {/* Script Guidance Panel - Desktop only, shown on the side */}
          <div className="hidden lg:block w-full lg:w-96 flex-shrink-0">
            <SpeakingPointsPanel />
          </div>
        </div>
      </div>
    );
  }

  // Recording mode with REC indicator
  if (isRecording) {
    return (
      <div className="w-full space-y-6">
        {/* Recording View with Script Guidance */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Recording Box */}
          <div className="flex-1 space-y-4">
            {/* Video container - Same sizing as preview */}
            <div className="relative bg-black rounded-xl overflow-hidden max-w-md mx-auto lg:max-w-none lg:!aspect-video lg:!max-h-none" style={videoContainerStyle}>
              <video
                ref={videoRef}
                autoPlay={true}
                playsInline={true}
                muted={true}
                className="w-full h-full object-cover"
              />
              
              {/* Small REC indicator in top left corner */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black bg-opacity-50 px-2 py-1 rounded">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-semibold text-sm">REC</span>
              </div>
            </div>
            
            {/* Recording controls directly below video */}
            <div className="border border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            
            {/* Mobile Script Guide - Shows below controls on mobile DURING RECORDING */}
            <div className="lg:hidden">
              <SpeakingPointsPanel />
            </div>
          </div>
          
          {/* Script Guidance Panel - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block w-full lg:w-96 flex-shrink-0">
            <SpeakingPointsPanel />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoRecording;