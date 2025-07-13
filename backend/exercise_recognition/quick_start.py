#!/usr/bin/env python3
"""
Quick Start Script for Exercise Recognition

This script will guide you through the entire process of setting up
exercise recognition from your videos.
"""

import os
import sys
from pathlib import Path
import subprocess

def print_step(step_num, title, description=""):
    """Print a formatted step header."""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*60}")
    if description:
        print(description)
    print()

def check_dependencies():
    """Check if required dependencies are installed."""
    print_step(0, "Checking Dependencies")
    
    required_packages = ['cv2', 'mediapipe', 'numpy', 'sklearn']
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'cv2':
                import cv2
            elif package == 'mediapipe':
                import mediapipe
            elif package == 'numpy':
                import numpy
            elif package == 'sklearn':
                import sklearn
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} - MISSING")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Please install them with:")
        print("pip install -r exercise_recognition/requirements.txt")
        return False
    
    print("\nAll dependencies are installed! ✓")
    return True

def setup_video_structure():
    """Help user set up the video directory structure."""
    print_step(1, "Setting Up Video Structure")
    
    print("You need to organize your exercise videos in the following structure:")
    print()
    print("videos/")
    print("├── squat/")
    print("│   ├── squat_001.mp4")
    print("│   ├── squat_002.mp4")
    print("│   └── ...")
    print("├── pushup/")
    print("│   ├── pushup_001.mp4")
    print("│   └── ...")
    print("└── deadlift/")
    print("    └── ...")
    print()
    
    # Check if videos directory exists
    videos_dir = Path("videos")
    if videos_dir.exists():
        print(f"Found existing videos directory: {videos_dir}")
        exercise_dirs = [d for d in videos_dir.iterdir() if d.is_dir()]
        if exercise_dirs:
            print("Found exercise directories:")
            for exercise_dir in exercise_dirs:
                video_count = len(list(exercise_dir.glob("*.mp4")))
                print(f"  - {exercise_dir.name}: {video_count} videos")
        else:
            print("No exercise directories found. Please create them.")
    else:
        print("No videos directory found. Please create it and add your videos.")
    
    print("\nPress Enter when you have your videos organized...")
    input()

def extract_landmarks():
    """Extract landmarks from videos."""
    print_step(2, "Extracting Pose Landmarks")
    
    videos_dir = Path("videos")
    if not videos_dir.exists():
        print("Error: videos directory not found!")
        print("Please create it and add your exercise videos first.")
        return False
    
    print("Extracting pose landmarks from your videos...")
    print("This may take a while depending on the number and length of your videos.")
    print()
    
    try:
        # Run the data extractor
        cmd = [
            sys.executable, 
            "exercise_recognition/data_extractor.py",
            "--videos_dir", "videos"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✓ Landmark extraction completed successfully!")
            print(result.stdout)
        else:
            print("✗ Landmark extraction failed!")
            print("Error:", result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error during extraction: {e}")
        return False
    
    return True

def preprocess_data():
    """Preprocess the extracted landmarks."""
    print_step(3, "Preprocessing Data")
    
    print("Preparing the extracted landmarks for training...")
    print()
    
    try:
        # Run the preprocessor
        cmd = [sys.executable, "exercise_recognition/data_preprocessor.py"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✓ Data preprocessing completed successfully!")
            print(result.stdout)
        else:
            print("✗ Data preprocessing failed!")
            print("Error:", result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error during preprocessing: {e}")
        return False
    
    return True

def train_model():
    """Train the exercise recognition model."""
    print_step(4, "Training Model")
    
    print("Training the exercise recognition model...")
    print("This will create a model that can recognize your exercises.")
    print()
    
    try:
        # Run the trainer
        cmd = [sys.executable, "exercise_recognition/simple_trainer.py"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✓ Model training completed successfully!")
            print(result.stdout)
        else:
            print("✗ Model training failed!")
            print("Error:", result.stderr)
            return False
            
    except Exception as e:
        print(f"✗ Error during training: {e}")
        return False
    
    return True

def show_results():
    """Show the results and next steps."""
    print_step(5, "Results and Next Steps")
    
    # Check what was created
    extracted_dir = Path("exercise_recognition/extracted_data")
    models_dir = Path("exercise_recognition/extracted_data/trained_models")
    
    print("Here's what was created:")
    print()
    
    if extracted_dir.exists():
        print("✓ Extracted landmarks:")
        for exercise_dir in extracted_dir.iterdir():
            if exercise_dir.is_dir() and exercise_dir.name != "trained_models":
                video_files = list(exercise_dir.glob("*_landmarks.json"))
                print(f"  - {exercise_dir.name}: {len(video_files)} videos processed")
    
    if models_dir.exists():
        print("✓ Trained models:")
        for model_dir in models_dir.iterdir():
            if model_dir.is_dir():
                print(f"  - {model_dir.name}")
    
    print()
    print("🎉 Congratulations! You now have a trained exercise recognition model!")
    print()
    print("Next steps:")
    print("1. Test your model with new videos")
    print("2. Add more training data to improve accuracy")
    print("3. Integrate the model into your main application")
    print("4. Fine-tune model parameters for better performance")
    print()
    print("To add more data later:")
    print("1. Add new videos to your videos/ directory")
    print("2. Re-run: python exercise_recognition/data_extractor.py --videos_dir videos")
    print("3. Re-run: python exercise_recognition/data_preprocessor.py")
    print("4. Re-run: python exercise_recognition/simple_trainer.py")

def main():
    """Main function to run the quick start process."""
    print("🚀 Exercise Recognition Quick Start")
    print("This script will guide you through creating an exercise recognition model.")
    print()
    
    # Check dependencies
    if not check_dependencies():
        print("\nPlease install the missing dependencies and run this script again.")
        return
    
    # Setup video structure
    setup_video_structure()
    
    # Extract landmarks
    if not extract_landmarks():
        print("\nLandmark extraction failed. Please check your videos and try again.")
        return
    
    # Preprocess data
    if not preprocess_data():
        print("\nData preprocessing failed. Please check the extracted data and try again.")
        return
    
    # Train model
    if not train_model():
        print("\nModel training failed. Please check the preprocessed data and try again.")
        return
    
    # Show results
    show_results()

if __name__ == "__main__":
    main() 