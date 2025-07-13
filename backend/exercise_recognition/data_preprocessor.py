import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple, Any
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

class ExerciseDataPreprocessor:
    def __init__(self, data_dir: str = "extracted_data"):
        self.data_dir = Path(data_dir)
        self.label_encoder = LabelEncoder()
        
    def load_extracted_data(self) -> Dict[str, List[Dict]]:
        """Load all extracted landmark data from the data directory."""
        exercise_data = {}
        
        if not self.data_dir.exists():
            raise ValueError(f"Data directory does not exist: {self.data_dir}")
        
        # Iterate through exercise directories
        for exercise_dir in self.data_dir.iterdir():
            if exercise_dir.is_dir() and exercise_dir.name != "__pycache__":
                exercise_name = exercise_dir.name
                exercise_data[exercise_name] = []
                
                # Load all landmark files for this exercise
                for landmarks_file in exercise_dir.glob("*_landmarks.json"):
                    try:
                        with open(landmarks_file, 'r') as f:
                            landmarks_data = json.load(f)
                        
                        # Load corresponding metadata
                        metadata_file = landmarks_file.parent / landmarks_file.name.replace('_landmarks.json', '_metadata.json')
                        if metadata_file.exists():
                            with open(metadata_file, 'r') as f:
                                metadata = json.load(f)
                        else:
                            metadata = {}
                        
                        exercise_data[exercise_name].append({
                            'landmarks': landmarks_data,
                            'metadata': metadata
                        })
                        
                    except Exception as e:
                        print(f"Error loading {landmarks_file}: {e}")
        
        return exercise_data
    
    def extract_features_from_landmarks(self, landmarks_data: List[Dict]) -> np.ndarray:
        """
        Extract features from landmark data.
        Features include: joint angles, relative positions, velocities, etc.
        """
        features = []
        
        for frame_data in landmarks_data:
            if frame_data['landmarks'] is None:
                # No pose detected, use zeros
                frame_features = np.zeros(33 * 4)  # 33 landmarks * 4 values (x, y, z, visibility)
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
    
    def calculate_joint_angles(self, landmarks: List[Dict]) -> np.ndarray:
        """
        Calculate joint angles from landmarks.
        This is a simplified version - you can add more sophisticated angle calculations.
        """
        if not landmarks:
            return np.zeros(10)  # Return zeros if no landmarks
        
        # Convert landmarks to numpy array for easier calculation
        points = np.array([[lm['x'], lm['y'], lm['z']] for lm in landmarks])
        
        # Define key joint triplets for angle calculation
        # (shoulder, elbow, wrist), (hip, knee, ankle), etc.
        joint_triplets = [
            (11, 13, 15),  # Left shoulder, elbow, wrist
            (12, 14, 16),  # Right shoulder, elbow, wrist
            (23, 25, 27),  # Left hip, knee, ankle
            (24, 26, 28),  # Right hip, knee, ankle
            (11, 12, 14),  # Left shoulder, right shoulder, right elbow
        ]
        
        angles = []
        for triplet in joint_triplets:
            try:
                p1, p2, p3 = points[triplet]
                angle = self._calculate_angle(p1, p2, p3)
                angles.append(angle)
            except (IndexError, ValueError):
                angles.append(0.0)
        
        return np.array(angles)
    
    def _calculate_angle(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """Calculate angle between three points (p2 is the vertex)."""
        v1 = p1 - p2
        v2 = p3 - p2
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        cos_angle = np.clip(cos_angle, -1.0, 1.0)  # Clamp to avoid numerical issues
        
        return np.arccos(cos_angle) * 180 / np.pi  # Convert to degrees
    
    def create_sequences(self, features: np.ndarray, sequence_length: int = 30) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences from frame features for sequence-based models.
        Returns sequences and their labels.
        """
        sequences = []
        labels = []
        
        for i in range(len(features) - sequence_length + 1):
            sequence = features[i:i + sequence_length]
            sequences.append(sequence)
            labels.append(1)  # This will be replaced with actual labels
        
        return np.array(sequences), np.array(labels)
    
    def prepare_training_data(self, sequence_length: int = 30, test_size: float = 0.2) -> Dict[str, Any]:
        """
        Prepare training data from extracted landmarks.
        
        Returns:
            Dictionary containing training and test data
        """
        print("Loading extracted data...")
        exercise_data = self.load_extracted_data()
        
        if not exercise_data:
            raise ValueError("No exercise data found!")
        
        print(f"Found data for exercises: {list(exercise_data.keys())}")
        
        all_features = []
        all_labels = []
        all_sequences = []
        
        for exercise_name, videos in exercise_data.items():
            print(f"Processing {exercise_name}: {len(videos)} videos")
            
            for video_data in videos:
                landmarks_data = video_data['landmarks']
                
                # Extract basic features
                features = self.extract_features_from_landmarks(landmarks_data)
                
                # Create sequences
                if len(features) >= sequence_length:
                    sequences, _ = self.create_sequences(features, sequence_length)
                    
                    # Add sequences and labels
                    all_sequences.extend(sequences)
                    all_labels.extend([exercise_name] * len(sequences))
        
        if not all_sequences:
            raise ValueError("No valid sequences found! Check your data and sequence_length.")
        
        # Convert to numpy arrays
        X = np.array(all_sequences)
        y = np.array(all_labels)
        
        print(f"Total sequences: {len(X)}")
        print(f"Sequence shape: {X.shape}")
        print(f"Label distribution: {pd.Series(y).value_counts().to_dict()}")
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split into train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=test_size, random_state=42, stratify=y_encoded
        )
        
        # Save label encoder for later use
        with open(self.data_dir / "label_encoder.pkl", 'wb') as f:
            pickle.dump(self.label_encoder, f)
        
        return {
            'X_train': X_train,
            'X_test': X_test,
            'y_train': y_train,
            'y_test': y_test,
            'label_encoder': self.label_encoder,
            'class_names': self.label_encoder.classes_,
            'sequence_length': sequence_length,
            'feature_dim': X.shape[-1]
        }
    
    def save_preprocessed_data(self, data: Dict[str, Any], filename: str = "preprocessed_data.pkl"):
        """Save preprocessed data to file."""
        output_path = self.data_dir / filename
        with open(output_path, 'wb') as f:
            pickle.dump(data, f)
        print(f"Preprocessed data saved to: {output_path}")
    
    def load_preprocessed_data(self, filename: str = "preprocessed_data.pkl") -> Dict[str, Any]:
        """Load preprocessed data from file."""
        input_path = self.data_dir / filename
        with open(input_path, 'rb') as f:
            data = pickle.load(f)
        return data

def main():
    """Example usage of the preprocessor."""
    preprocessor = ExerciseDataPreprocessor()
    
    try:
        # Prepare training data
        data = preprocessor.prepare_training_data(sequence_length=30)
        
        # Save preprocessed data
        preprocessor.save_preprocessed_data(data)
        
        print("\nData preprocessing complete!")
        print(f"Training samples: {len(data['X_train'])}")
        print(f"Test samples: {len(data['X_test'])}")
        print(f"Classes: {data['class_names']}")
        
    except Exception as e:
        print(f"Error during preprocessing: {e}")

if __name__ == "__main__":
    main() 