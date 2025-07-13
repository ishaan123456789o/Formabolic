"""
Integration Example: Using Trained Exercise Recognition Model

This example shows how to integrate a trained exercise recognition model
into your main FastAPI backend application.
"""

import cv2
import mediapipe as mp
import numpy as np
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import joblib  # <-- Add this import

class ExerciseRecognizer:
    """Class to handle exercise recognition using trained models."""
    
    def __init__(self, model_path: str = "extracted_data/trained_models"):
        self.model_path = Path(model_path)
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.model = None
        self.label_encoder = None
        self.sequence_length = 30
        
        # Load the best available model
        self._load_model()
    
    def _load_model(self):
        """Load the best available trained model."""
        if not self.model_path.exists():
            print(f"Warning: Model directory not found: {self.model_path}")
            return
        
        # Find the most recent model
        model_dirs = [d for d in self.model_path.iterdir() if d.is_dir()]
        if not model_dirs:
            print("No trained models found!")
            return
        
        # For now, just use the first model found
        # In production, you might want to load the best performing model
        model_dir = model_dirs[0]
        print(f"Loading model from: {model_dir}")
        
        try:
            # Load model results
            results_file = model_dir / "training_results.json"
            with open(results_file, 'r') as f:
                results = json.load(f)
            
            # Load the actual model (this would depend on the model type)
            if results['model_type'] == 'random_forest':
                model_file = model_dir / "model.pkl"
                if model_file.exists():
                    self.model = joblib.load(model_file)  # <-- Use joblib.load instead of pickle.load
            
            # Load label encoder
            label_encoder_file = Path("extracted_data/label_encoder.pkl")
            if label_encoder_file.exists():
                with open(label_encoder_file, 'rb') as f:
                    self.label_encoder = pickle.load(f)
            
            print(f"✓ Model loaded successfully!")
            print(f"  - Type: {results['model_type']}")
            print(f"  - Accuracy: {results.get('accuracy', 'N/A')}")
            print(f"  - Classes: {results.get('class_names', [])}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
    
    def extract_landmarks_from_video(self, video_path: str) -> List[Dict]:
        """Extract pose landmarks from a video file."""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        landmarks_data = []
        frame_number = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process the frame
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Extract landmarks
                frame_landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    frame_landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    })
                
                landmarks_data.append({
                    'frame': frame_number,
                    'landmarks': frame_landmarks
                })
            else:
                # No pose detected, add None to maintain frame alignment
                landmarks_data.append({
                    'frame': frame_number,
                    'landmarks': None
                })
            
            frame_number += 1
        
        cap.release()
        return landmarks_data
    
    def preprocess_landmarks(self, landmarks_data: List[Dict]) -> np.ndarray:
        """Preprocess landmarks for model prediction."""
        features = []
        
        for frame_data in landmarks_data:
            if frame_data['landmarks'] is None:
                # No pose detected, use zeros
                frame_features = np.zeros(33 * 4)  # 33 landmarks * 4 values
            else:
                # Extract landmark coordinates and visibility
                frame_features = []
                for landmark in frame_data['landmarks']:
                    frame_features.extend([
                        landmark['x'], landmark['y'], landmark['z'], landmark['visibility']
                    ])
                frame_features = np.array(frame_features)
            
            features.append(frame_features)
        
        return np.array(features)
    
    def create_sequences(self, features: np.ndarray) -> np.ndarray:
        """Create sequences from frame features."""
        sequences = []
        
        for i in range(len(features) - self.sequence_length + 1):
            sequence = features[i:i + self.sequence_length]
            sequences.append(sequence)
        
        return np.array(sequences)
    
    def predict_exercise(self, video_path: str) -> Dict[str, Any]:
        """
        Predict the exercise type from a video.
        
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            return {
                'error': 'No trained model available',
                'prediction': None,
                'confidence': 0.0
            }
        
        try:
            # Extract landmarks
            print("Extracting landmarks from video...")
            landmarks_data = self.extract_landmarks_from_video(video_path)
            
            if not landmarks_data:
                return {
                    'error': 'No pose detected in video',
                    'prediction': None,
                    'confidence': 0.0
                }
            
            # Preprocess landmarks
            print("Preprocessing landmarks...")
            features = self.preprocess_landmarks(landmarks_data)
            
            if len(features) < self.sequence_length:
                return {
                    'error': f'Video too short. Need at least {self.sequence_length} frames',
                    'prediction': None,
                    'confidence': 0.0
                }
            
            # Create sequences
            sequences = self.create_sequences(features)
            
            # Make predictions
            print("Making predictions...")
            # Flatten input for RandomForest if needed
            if hasattr(self.model, 'predict_proba') and len(sequences.shape) == 3:
                sequences = sequences.reshape(sequences.shape[0], -1)
            if hasattr(self.model, 'predict_proba'):
                # For models that support probability predictions
                predictions = self.model.predict(sequences)
                probabilities = self.model.predict_proba(sequences)
                
                # Get the most common prediction and its confidence
                from collections import Counter
                pred_counts = Counter(predictions)
                most_common_pred = pred_counts.most_common(1)[0][0]
                confidence = pred_counts[most_common_pred] / len(predictions)
                
                # Get average probability for the most common prediction
                avg_prob = np.mean([prob[most_common_pred] for prob in probabilities])
                confidence = max(confidence, avg_prob)
                
            else:
                # For models that only support class predictions
                predictions = self.model.predict(sequences)
                from collections import Counter
                pred_counts = Counter(predictions)
                most_common_pred = pred_counts.most_common(1)[0][0]
                confidence = pred_counts[most_common_pred] / len(predictions)
            
            # Decode the prediction
            if self.label_encoder is not None:
                exercise_name = self.label_encoder.inverse_transform([most_common_pred])[0]
            else:
                exercise_name = f"class_{most_common_pred}"
            
            return {
                'prediction': exercise_name,
                'confidence': confidence,
                'num_sequences': len(sequences),
                'video_frames': len(landmarks_data)
            }
            
        except Exception as e:
            return {
                'error': f'Prediction failed: {str(e)}',
                'prediction': None,
                'confidence': 0.0
            }

# Example usage in FastAPI
def example_fastapi_integration():
    """
    Example of how to integrate this into your FastAPI backend.
    
    Add this to your main.py:
    """
    
    # Initialize the recognizer
    recognizer = ExerciseRecognizer()
    
    # Example endpoint
    """
    @app.post("/analyze-exercise")
    async def analyze_exercise(video: UploadFile = File(...)):
        # Save uploaded video temporarily
        temp_path = f"temp_{video.filename}"
        with open(temp_path, "wb") as buffer:
            buffer.write(await video.read())
        
        try:
            # Predict exercise
            result = recognizer.predict_exercise(temp_path)
            
            # Clean up
            os.remove(temp_path)
            
            return result
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=500, detail=str(e))
    """

def test_recognition():
    """Test the exercise recognition with a sample video."""
    recognizer = ExerciseRecognizer()
    
    # Test with a sample video (replace with your video path)
    test_video = "path/to/your/test/video.mp4"
    
    if not Path(test_video).exists():
        print(f"Test video not found: {test_video}")
        print("Please provide a valid video path to test the recognition.")
        return
    
    print("Testing exercise recognition...")
    result = recognizer.predict_exercise(test_video)
    
    print("\nResults:")
    print(f"Prediction: {result.get('prediction', 'N/A')}")
    print(f"Confidence: {result.get('confidence', 0.0):.3f}")
    print(f"Sequences: {result.get('num_sequences', 0)}")
    print(f"Frames: {result.get('video_frames', 0)}")
    
    if 'error' in result:
        print(f"Error: {result['error']}")

if __name__ == "__main__":
    # Test the recognition
    test_recognition() 