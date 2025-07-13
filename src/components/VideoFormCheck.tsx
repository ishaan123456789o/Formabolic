import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Play, Square, RotateCcw, Brain } from 'lucide-react';

export default function VideoFormCheck() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [poseOverlayBurst, setPoseOverlayBurst] = useState<string[] | null>(null);
  const [burstAnimIdx, setBurstAnimIdx] = useState(0);
  const [burstPlaying, setBurstPlaying] = useState(true);
  const burstIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [exercise, setExercise] = useState('squat');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // New: handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoURL(url);
      setIsRecording(false);
      setFeedback(null);
      setPoseOverlayBurst(null);
    }
  };

  // Animate burst
  useEffect(() => {
    if (poseOverlayBurst && poseOverlayBurst.length > 1 && burstPlaying) {
      burstIntervalRef.current = setInterval(() => {
        setBurstAnimIdx(idx => (idx + 1) % poseOverlayBurst.length);
      }, 300);
      return () => {
        if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
      };
    } else if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current);
    }
    return () => {};
  }, [poseOverlayBurst, burstPlaying]);

  useEffect(() => {
    setBurstAnimIdx(0);
    setBurstPlaying(true);
  }, [poseOverlayBurst]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have given permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setFeedback(null);
    setPoseOverlayBurst(null);
    setIsAnalyzing(false);
  };

  const analyzeForm = async () => {
    if (!videoURL) return;
    setIsAnalyzing(true);
    setFeedback(null);
    setPoseOverlayBurst(null);
    setAnalyzeError(null);
    try {
      // Fetch the video blob
      const response = await fetch(videoURL);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('video', blob, 'form_check.webm');
      // 1. Predict exercise first
      const predictRes = await fetch('http://127.0.0.1:8000/predict-exercise', {
        method: 'POST',
        body: formData,
      });
      if (!predictRes.ok) {
        const err = await predictRes.json();
        throw new Error(err.detail || 'Prediction failed');
      }
      const predictData = await predictRes.json();
      setPrediction(predictData.prediction);
      setConfidence(predictData.confidence);
      // 2. Compare predicted exercise to selected
      if (predictData.prediction && predictData.prediction.toLowerCase().replace(/\s/g, '') !== exercise.toLowerCase().replace(/\s/g, '')) {
        setAnalyzeError(`Invalid: The movement in the video does not match the selected exercise. (Predicted: ${predictData.prediction}, Selected: ${exercise})`);
        setIsAnalyzing(false);
        return;
      }
      // 3. Proceed with form analysis
      const formCheckData = new FormData();
      formCheckData.append('video', blob, 'form_check.webm');
      formCheckData.append('exercise', exercise);
      const res = await fetch('http://127.0.0.1:8000/analyze_form', {
        method: 'POST',
        body: formCheckData,
      });
      if (!res.ok) throw new Error('Failed to analyze form');
      const data = await res.json();
      setFeedback(data.feedback);
      setPoseOverlayBurst(data.pose_overlay_burst || null);
    } catch (error: any) {
      setFeedback([`Error: ${error.message || error}`]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const predictExercise = async () => {
    if (!videoURL) return;
    setIsPredicting(true);
    setPrediction(null);
    setConfidence(null);
    setPredictError(null);
    try {
      const response = await fetch(videoURL);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('video', blob, 'predict_upload.webm');
      const res = await fetch('http://127.0.0.1:8000/predict-exercise', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Prediction failed');
      }
      const data = await res.json();
      setPrediction(data.prediction);
      setConfidence(data.confidence);
    } catch (error: any) {
      setPredictError(error.message || 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">AI Form Check</h2>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">Exercise</label>
          <select
            value={exercise}
            onChange={e => setExercise(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="squat">Squat</option>
            <option value="pushup">Push-up</option>
            <option value="latpulldown">Lat Pulldown</option>
            <option value="triceppushdown">Tricep Pushdown</option>
            <option value="chestfly">Chest Fly</option>
            <option value="upperbackrow">Upper Back Row</option>
            <option value="preachercurl">Preacher Curls</option>
            <option value="lateralraise">Lateral Raises</option>
            <option value="shoulderpress">Shoulder Press</option>
            <option value="legextension">Leg Extensions</option>
            <option value="reardeltfly">Rear Delt Flies</option>
          </select>
        </div>
        {/* Camera/Video Display */}
        <div className="bg-black rounded-xl overflow-hidden mb-6 border border-gray-600" style={{ aspectRatio: '16/9' }}>
          {videoURL ? (
            <video
              src={videoURL}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          {!isRecording && !videoURL && (
            <div className="flex flex-col items-center justify-center h-full text-white">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg opacity-75">Ready to record or upload your form</p>
            </div>
          )}
        </div>
        {/* Recording & Upload Controls */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
          <div className="flex gap-4">
            {!isRecording && !videoURL && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium btn-glow-orange"
              >
                <Camera className="w-5 h-5" />
                Start Recording
              </button>
            )}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>
            )}
            {videoURL && (
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5" />
                Record/Upload Again
              </button>
            )}
          </div>
          <div className="flex gap-4 items-center mt-4 md:mt-0">
            {!isRecording && !videoURL && (
              <label className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium btn-glow-purple cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {videoURL && (
            <button
              onClick={analyzeForm}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium btn-glow-green disabled:opacity-50 disabled:cursor-not-allowed mt-4 md:mt-0"
            >
              <Brain className="w-5 h-5" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Form'}
            </button>
          )}
          {/* Add Predict Exercise button */}
          {videoURL && (
            <button
              onClick={predictExercise}
              disabled={isPredicting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium btn-glow-blue disabled:opacity-50 disabled:cursor-not-allowed mt-4 md:mt-0"
            >
              <Brain className="w-5 h-5" />
              {isPredicting ? 'Predicting...' : 'Predict Exercise'}
            </button>
          )}
          {isPredicting && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3 text-blue-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="font-medium">AI is predicting the exercise...</span>
              </div>
            </div>
          )}
          {prediction && (
            <div className="bg-blue-700 border border-blue-600 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-300" />
                Predicted Exercise
              </h3>
              <div className="text-white text-xl font-semibold">{prediction}</div>
              <div className="text-blue-200 text-sm mt-1">Confidence: {(confidence! * 100).toFixed(1)}%</div>
            </div>
          )}
          {predictError && (
            <div className="bg-red-700 border border-red-600 rounded-lg p-4 mt-4 text-white">
              Error: {predictError}
            </div>
          )}
          {analyzeError && (
            <div className="bg-red-700 border border-red-600 rounded-lg p-4 mt-4 text-white">
              {analyzeError}
            </div>
          )}
        </div>
        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 text-green-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
              <span className="font-medium">AI is analyzing your form...</span>
            </div>
          </div>
        )}
        {/* Feedback Display */}
        {feedback && (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 mt-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-green-400" />
              AI Form Analysis
            </h3>
            <ul className="text-gray-300 leading-relaxed list-disc pl-6">
              {feedback.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            {poseOverlayBurst && poseOverlayBurst.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-2">Pose Overlay (Key Movement Burst)</h4>
                <div className="flex flex-col items-center gap-2">
                  {poseOverlayBurst.length === 1 ? (
                    <img
                      src={`data:image/jpeg;base64,${poseOverlayBurst[0]}`}
                      alt="Pose Overlay"
                      className="rounded-lg border border-gray-600 max-w-xs h-auto shadow-md"
                      style={{ minWidth: 180, maxWidth: 220 }}
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={`data:image/jpeg;base64,${poseOverlayBurst[burstAnimIdx]}`}
                        alt={`Pose Overlay Frame ${burstAnimIdx + 1}`}
                        className="rounded-lg border border-gray-600 max-w-xs h-auto shadow-md"
                        style={{ minWidth: 180, maxWidth: 220 }}
                      />
                      <button
                        onClick={() => setBurstPlaying(p => !p)}
                        className="absolute bottom-2 right-2 bg-gray-800/80 rounded-full p-2 border border-gray-600 hover:bg-gray-700 transition-all"
                        title={burstPlaying ? 'Pause' : 'Play'}
                      >
                        {burstPlaying ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="6" width="4" height="12" rx="1"/><rect x="14" y="6" width="4" height="12" rx="1"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="6,4 20,12 6,20 6,4"/></svg>
                        )}
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">{poseOverlayBurst.length > 1 ? `Animating ${poseOverlayBurst.length} frames around the main part of the movement.` : 'Showing the key frame of the movement.'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Tips Section */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📱 Recording Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-white">Full Body Visibility</h4>
                <p className="text-sm text-gray-400">Ensure your entire body is visible in the frame</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-white">Good Lighting</h4>
                <p className="text-sm text-gray-400">Record in well-lit area for better analysis</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-500/30">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-white">Side View</h4>
                <p className="text-sm text-gray-400">Profile view works best for most exercises</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-500/30">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-white">Multiple Reps</h4>
                <p className="text-sm text-gray-400">Record 3-5 reps for comprehensive analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}