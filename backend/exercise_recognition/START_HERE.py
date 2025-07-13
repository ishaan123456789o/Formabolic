#!/usr/bin/env python3
"""
Exercise Recognition - Start Here!

This is the main entry point for the exercise recognition pipeline.
Run this script to access all the tools and guides.
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header():
    """Print the application header."""
    print("🏋️  Exercise Recognition Pipeline")
    print("=" * 50)
    print("Build your own exercise recognition model!")
    print()

def print_menu():
    """Print the main menu."""
    print("Choose an option:")
    print()
    print("📦 SETUP:")
    print("  1. Install Dependencies")
    print("  2. Test Setup")
    print()
    print("🎥 DATA PROCESSING:")
    print("  3. Organize Videos (NEW!)")
    print("  4. Extract Landmarks from Videos")
    print("  5. Preprocess Data")
    print("  6. Train Model")
    print()
    print("🚀 QUICK START:")
    print("  7. Run Complete Pipeline (Guided)")
    print()
    print("🔧 UTILITIES:")
    print("  8. Test Model Integration")
    print("  9. View Documentation")
    print()
    print("❓ HELP:")
    print("  10. Getting Started Guide")
    print("  0. Exit")
    print()

def run_script(script_name, description=""):
    """Run a Python script."""
    # Always resolve script path relative to this file's directory
    script_path = Path(__file__).parent / script_name
    if not script_path.exists():
        print(f"Error: {script_path} not found!")
        return False
    
    print(f"Running {script_path}...")
    if description:
        print(f"Description: {description}")
    print()
    
    try:
        result = subprocess.run([sys.executable, str(script_path)], 
                              capture_output=False, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running {script_path}: {e}")
        return False

def install_dependencies():
    """Install required dependencies."""
    print("Installing dependencies...")
    return run_script("install_dependencies.py", 
                     "Install all required ML packages")

def test_setup():
    """Test the setup."""
    print("Testing setup...")
    return run_script("test_setup.py", 
                     "Verify all components are working")

def organize_videos():
    """Organize videos into the correct structure."""
    print("Organizing videos...")
    return run_script("video_organizer.py", 
                     "Organize your videos into the correct directory structure")

def extract_landmarks():
    """Extract landmarks from videos."""
    print("Extracting landmarks...")
    print("Make sure you have organized your videos in the videos/ directory first!")
    print()
    
    videos_dir = input("Enter path to your videos directory (or press Enter for 'videos'): ").strip()
    if not videos_dir:
        videos_dir = "videos"
    
    if not Path(videos_dir).exists():
        print(f"Error: Directory '{videos_dir}' not found!")
        print("Please create it and add your exercise videos first.")
        return False
    
    cmd = [sys.executable, "data_extractor.py", "--videos_dir", videos_dir]
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Error: {e}")
        return False

def preprocess_data():
    """Preprocess the extracted data."""
    print("Preprocessing data...")
    return run_script("data_preprocessor.py", 
                     "Prepare landmarks for training")

def train_model():
    """Train the model."""
    print("Training model...")
    return run_script("simple_trainer.py", 
                     "Train exercise recognition model")

def run_quick_start():
    """Run the complete guided pipeline."""
    print("Running complete pipeline...")
    return run_script("quick_start.py", 
                     "Guided setup for the entire process")

def test_integration():
    """Test model integration."""
    print("Testing model integration...")
    return run_script("integration_example.py", 
                     "Test the trained model")

def view_documentation():
    """View the documentation."""
    docs = [
        ("README.md", "Main documentation"),
        ("GETTING_STARTED.md", "Getting started guide")
    ]
    
    print("Available documentation:")
    print()
    for i, (doc_file, description) in enumerate(docs, 1):
        print(f"{i}. {doc_file} - {description}")
    print()
    
    try:
        choice = int(input("Choose document to view (or 0 to go back): "))
        if choice == 0:
            return True
        elif 1 <= choice <= len(docs):
            doc_file, description = docs[choice - 1]
            if Path(doc_file).exists():
                print(f"\n{'='*60}")
                print(f"Viewing: {doc_file}")
                print(f"{'='*60}\n")
                with open(doc_file, 'r') as f:
                    print(f.read())
                input("\nPress Enter to continue...")
            else:
                print(f"Document {doc_file} not found!")
        else:
            print("Invalid choice!")
    except ValueError:
        print("Please enter a valid number!")
    
    return True

def show_getting_started():
    """Show the getting started guide."""
    print("Getting Started Guide")
    print("=" * 50)
    print()
    print("🎯 What You'll Build:")
    print("- Exercise recognition model from your videos")
    print("- Automatic classification of movements")
    print("- Integration with your existing app")
    print()
    print("📋 Prerequisites:")
    print("- Python 3.8+ with virtual environment")
    print("- Exercise videos (MP4 format)")
    print("- Basic understanding of ML concepts")
    print()
    print("🚀 Quick Start (5 Steps):")
    print("1. Install Dependencies (Option 1)")
    print("2. Test Setup (Option 2)")
    print("3. Organize your videos in videos/ directory")
    print("4. Run Complete Pipeline (Option 6)")
    print("5. Test your model (Option 7)")
    print()
    print("📁 Required Video Structure:")
    print("videos/")
    print("├── squat/")
    print("│   ├── squat_001.mp4")
    print("│   └── ...")
    print("├── pushup/")
    print("│   ├── pushup_001.mp4")
    print("│   └── ...")
    print("└── ...")
    print()
    print("🎥 Video Requirements:")
    print("- MP4 format")
    print("- Good lighting")
    print("- Clear background")
    print("- Full body visible")
    print("- 5-30 seconds duration")
    print("- Multiple repetitions (3-5 reps)")
    print()
    print("📈 Expected Results:")
    print("- Accuracy: >80% on test set")
    print("- Training time: <5 minutes")
    print("- Prediction time: <1 second")
    print()
    print("For detailed information, choose Option 8 to view documentation.")
    print()

def main():
    """Main function."""
    while True:
        print_header()
        print_menu()
        
        try:
            choice = input("Enter your choice (0-9): ").strip()
            
            if choice == "0":
                print("Goodbye! 👋")
                break
            elif choice == "1":
                install_dependencies()
            elif choice == "2":
                test_setup()
            elif choice == "3":
                organize_videos()
            elif choice == "4":
                extract_landmarks()
            elif choice == "5":
                preprocess_data()
            elif choice == "6":
                train_model()
            elif choice == "7":
                run_quick_start()
            elif choice == "8":
                test_integration()
            elif choice == "9":
                view_documentation()
            elif choice == "10":
                show_getting_started()
            else:
                print("Invalid choice! Please enter a number between 0-10.")
            
            if choice != "0":
                input("\nPress Enter to continue...")
                print("\n" + "="*50 + "\n")
                
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"Error: {e}")
            input("Press Enter to continue...")

if __name__ == "__main__":
    main() 