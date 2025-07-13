import cv2
import mediapipe as mp
import numpy as np
import json
import os
from pathlib import Path
from typing import List, Dict, Any
import argparse

class ExerciseDataExtractor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def extract_landmarks_from_video(self, video_path: str, exercise_name: str, 
                                   output_dir: str = "extracted_data") -> Dict[str, Any]:
        """
        Extract pose landmarks from a video and save them with metadata.
        
        Args:
            video_path: Path to the video file
            exercise_name: Name of the exercise being performed
            output_dir: Directory to save extracted data
            
        Returns:
            Dictionary containing metadata about the extraction
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        
        print(f"Processing {exercise_name}: {frame_count} frames, {duration:.2f}s duration")
        
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
                    'timestamp': frame_number / fps,
                    'landmarks': frame_landmarks
                })
            else:
                # No pose detected, add None to maintain frame alignment
                landmarks_data.append({
                    'frame': frame_number,
                    'timestamp': frame_number / fps,
                    'landmarks': None
                })
            
            frame_number += 1
            
            # Progress indicator
            if frame_number % 30 == 0:  # Every 30 frames
                print(f"  Processed {frame_number}/{frame_count} frames")
        
        cap.release()
        
        # Create metadata
        metadata = {
            'exercise_name': exercise_name,
            'video_path': video_path,
            'fps': fps,
            'frame_count': frame_count,
            'duration': duration,
            'frames_with_pose': len([f for f in landmarks_data if f['landmarks'] is not None]),
            'frames_without_pose': len([f for f in landmarks_data if f['landmarks'] is None]),
            'extraction_timestamp': str(np.datetime64('now'))
        }
        
        # Save the data
        self._save_extracted_data(landmarks_data, metadata, output_dir)
        
        return metadata
    
    def _save_extracted_data(self, landmarks_data: List[Dict], metadata: Dict, output_dir: str):
        """Save extracted landmarks and metadata to files."""
        # Create output directory structure
        exercise_dir = Path(output_dir) / metadata['exercise_name']
        exercise_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename based on video name
        video_name = Path(metadata['video_path']).stem
        timestamp = metadata['extraction_timestamp'].replace(':', '-').replace(' ', '_')
        
        # Save landmarks data
        landmarks_file = exercise_dir / f"{video_name}_landmarks.json"
        with open(landmarks_file, 'w') as f:
            json.dump(landmarks_data, f, indent=2)
        
        # Save metadata
        metadata_file = exercise_dir / f"{video_name}_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Saved data to: {landmarks_file}")
        print(f"Saved metadata to: {metadata_file}")
    
    def extract_from_directory(self, videos_dir: str, output_dir: str = "extracted_data"):
        """
        Extract landmarks from all videos in a directory.
        Expects directory structure: videos_dir/exercise_name/video_files
        """
        videos_path = Path(videos_dir)
        
        if not videos_path.exists():
            raise ValueError(f"Videos directory does not exist: {videos_dir}")
        
        all_metadata = []
        
        # Process each exercise subdirectory
        for exercise_dir in videos_path.iterdir():
            if exercise_dir.is_dir():
                exercise_name = exercise_dir.name
                print(f"\nProcessing exercise: {exercise_name}")
                # Process each video in the exercise directory (all supported formats, both cases)
                for ext in ['*.mp4', '*.MP4', '*.avi', '*.AVI', '*.mov', '*.MOV', '*.mkv', '*.MKV', '*.wmv', '*.WMV', '*.flv', '*.FLV']:
                    for video_file in exercise_dir.glob(ext):
                        try:
                            metadata = self.extract_landmarks_from_video(
                                str(video_file), 
                                exercise_name, 
                                output_dir
                            )
                            all_metadata.append(metadata)
                        except Exception as e:
                            print(f"Error processing {video_file}: {e}")
        
        # Save summary of all extractions
        summary_file = Path(output_dir) / "extraction_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(all_metadata, f, indent=2)
        
        print(f"\nExtraction complete! Summary saved to: {summary_file}")
        return all_metadata

def main():
    parser = argparse.ArgumentParser(description='Extract pose landmarks from exercise videos')
    parser.add_argument('--videos_dir', type=str, required=True,
                       help='Directory containing exercise videos organized by exercise name')
    parser.add_argument('--output_dir', type=str, default='extracted_data',
                       help='Output directory for extracted data')
    parser.add_argument('--single_video', type=str,
                       help='Process a single video file (requires --exercise_name)')
    parser.add_argument('--exercise_name', type=str,
                       help='Exercise name for single video processing')
    
    args = parser.parse_args()
    
    extractor = ExerciseDataExtractor()
    
    if args.single_video:
        if not args.exercise_name:
            print("Error: --exercise_name is required when using --single_video")
            return
        
        metadata = extractor.extract_landmarks_from_video(
            args.single_video, 
            args.exercise_name, 
            args.output_dir
        )
        print(f"Single video extraction complete: {metadata}")
    else:
        all_metadata = extractor.extract_from_directory(args.videos_dir, args.output_dir)
        print(f"Batch extraction complete. Processed {len(all_metadata)} videos.")

if __name__ == "__main__":
    main() 