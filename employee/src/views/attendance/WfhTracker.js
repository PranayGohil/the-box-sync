import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Webcam from 'react-webcam';
import axios from 'axios';

const WfhTracker = ({ staffId, date, wfhConfig }) => {
  const webcamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const idleTimerRef = useRef(null);
  const captureTimerRef = useRef(null);
  const activeRef = useRef(true);
  const streamRef = useRef(null);
  const latestFrameRef = useRef(null);

  // Dynamic Settings (Fallback to defaults if not provided)
  const minMins = wfhConfig?.min_interval || 3;
  const maxMins = wfhConfig?.max_interval || 15;
  const idleMins = wfhConfig?.idle_threshold || 5;

  const MIN_INTERVAL_MS = minMins * 60 * 1000;
  const MAX_INTERVAL_MS = maxMins * 60 * 1000;
  const IDLE_THRESHOLD_MS = idleMins * 60 * 1000;

  async function captureAndUpload() {
    if (!activeRef.current) return;

    try {
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Capture Webcam
      if (webcamRef.current) {
        const webcamBase64 = webcamRef.current.getScreenshot();
        if (webcamBase64) {
          await axios.post(`${process.env.REACT_APP_API}/attendance/wfh-upload`, {
            staff_id: staffId,
            date,
            type: 'webcam',
            image_base64: webcamBase64
          }, { headers }).catch(e => console.error("Webcam upload failed", e));
        }
      }

      // 2. Capture Screen
      if (screenStream && latestFrameRef.current) {
        try {
          await axios.post(`${process.env.REACT_APP_API}/attendance/wfh-upload`, {
            staff_id: staffId,
            date,
            type: 'screenshot',
            image_base64: latestFrameRef.current
          }, { headers }).catch(e => console.error("Screen upload failed", e));
        } catch (captureErr) {
          console.error("Screen capture failed", captureErr);
        }
      }
    } catch (err) {
      console.error("Error during capture and upload:", err);
    }
  }

  function scheduleNextCapture() {
    if (!activeRef.current) return;
    const randomMs = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
    captureTimerRef.current = setTimeout(() => {
      captureAndUpload();
      scheduleNextCapture(); // Schedule the next one recursively
    }, randomMs);
  }

  function setupIdleDetection() {
    let lastActivityTime = Date.now();
    let isIdle = false;

    const resetIdleTimer = () => {
      lastActivityTime = Date.now();
      isIdle = false;
    };

    // Track local activity (fallback if IdleDetector not supported)
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    // Periodically check idle time
    idleTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTime >= IDLE_THRESHOLD_MS) {
        if (!isIdle) {
          isIdle = true;
          // Report configured minutes of idle time
          axios.post(`${process.env.REACT_APP_API}/attendance/wfh-idle`, {
            staff_id: staffId,
            date,
            idle_minutes: idleMins
          }, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }).catch(e => console.error(e));
        } else {
          // Report 1 more minute of idle time
          axios.post(`${process.env.REACT_APP_API}/attendance/wfh-idle`, {
            staff_id: staffId,
            date,
            idle_minutes: 1
          }, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }).catch(e => console.error(e));
        }
        lastActivityTime = now; // reset so we log every minute thereafter
      }
    }, 60 * 1000); // Check every minute
  }

  useEffect(() => {
    let active = true;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Required for modern browsers to show the default warning
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const startTracking = async () => {
      try {
        // Request Screen Share
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' }
        });

        if (!active) {
          displayStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = displayStream;
        setScreenStream(displayStream);
        setHasPermissions(true);
        sessionStorage.setItem('wfh_active', 'true');

        // Schedule first capture
        scheduleNextCapture();
        setupIdleDetection();

        // If user stops sharing screen manually
        displayStream.getVideoTracks()[0].onended = () => {
          if (active) {
            alert("Warning: Screen sharing stopped. WFH Tracking is paused. Please refresh to restart.");
            setHasPermissions(false);
          }
        };

      } catch (err) {
        console.error("WFH Tracking permissions denied:", err);
        alert("Screen sharing is required for WFH mode. Tracking is disabled.");
      }
    };

    const initTimer = setTimeout(() => {
      startTracking();
    }, 500);

    return () => {
      active = false;
      activeRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      clearTimeout(idleTimerRef.current);
      clearTimeout(captureTimerRef.current);
      clearTimeout(initTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionStorage.removeItem('wfh_active');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Screen share stream is active regardless of tab visibility.
      if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
        const video = screenVideoRef.current;
        const canvas = document.createElement('canvas');
        
        const MAX_WIDTH = 1280;
        let width = video.videoWidth || MAX_WIDTH;
        let height = video.videoHeight || 720;
        
        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (canvas.width > 0) {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          latestFrameRef.current = canvas.toDataURL('image/webp', 0.5);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Securely bind the stream to the video element on every render cycle
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      if (screenVideoRef.current.srcObject !== screenStream) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(e => console.warn("Video play blocked", e));
      }
    }
  }, [screenStream]);

  if (!hasPermissions) return null;

  return (
    <>
      {/* Hidden Webcam for background capture */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0.01, zIndex: -9999, pointerEvents: 'none' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/webp"
          screenshotQuality={0.5}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
        />
        {/* Hidden Video element for screen capture stream */}
        <video ref={screenVideoRef} autoPlay playsInline muted width="1280" height="720" />
      </div>
    </>
  );
};

export default WfhTracker;
