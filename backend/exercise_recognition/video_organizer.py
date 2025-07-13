#!/usr/bin/env python3
"""
Video Organizer for Exercise Recognition

This tool helps you organize your exercise videos into the correct
directory structure for training the exercise recognition model.
"""

import os
import shutil
import sys
from pathlib import Path
from typing import List, Dict

# Define the allowed exercises and their keywords
ALLOWED_EXERCISES = [
    "Squat",
    "Push-up",
    "Lat Pulldown",
    "Tricep Pushdown",
    "Chest Fly",
    "Upper Back Row",
    "Preacher Curls",
    "Lateral Raises",
    "Shoulder Press",
    "Leg Extensions",
    "Rear Delt Flies"
]

# Map keywords to allowed exercises (all lowercased for matching)
EXERCISE_KEYWORDS = {
    "squat": "Squat",
    "pushup": "Push-up",
    "push-up": "Push-up",
    "lat pulldown": "Lat Pulldown",
    "lat_pulldown": "Lat Pulldown",
    "lat-pulldown": "Lat Pulldown",
    "tricep pushdown": "Tricep Pushdown",
    "tricep_pushdown": "Tricep Pushdown",
    "tricep-pushdown": "Tricep Pushdown",
    "chest fly": "Chest Fly",
    "chest_fly": "Chest Fly",
    "chest-fly": "Chest Fly",
    "upper back row": "Upper Back Row",
    "upper_back_row": "Upper Back Row",
    "upper-back-row": "Upper Back Row",
    "preacher curl": "Preacher Curls",
    "preacher curls": "Preacher Curls",
    "preacher_curl": "Preacher Curls",
    "preacher_curls": "Preacher Curls",
    "preacher-curl": "Preacher Curls",
    "preacher-curls": "Preacher Curls",
    "lateral raise": "Lateral Raises",
    "lateral raises": "Lateral Raises",
    "lateral_raise": "Lateral Raises",
    "lateral_raises": "Lateral Raises",
    "lateral-raise": "Lateral Raises",
    "lateral-raises": "Lateral Raises",
    "shoulder press": "Shoulder Press",
    "shoulder_press": "Shoulder Press",
    "shoulder-press": "Shoulder Press",
    "leg extension": "Leg Extensions",
    "leg extensions": "Leg Extensions",
    "leg_extension": "Leg Extensions",
    "leg_extensions": "Leg Extensions",
    "leg-extension": "Leg Extensions",
    "leg-extensions": "Leg Extensions",
    "rear delt fly": "Rear Delt Flies",
    "rear delt flies": "Rear Delt Flies",
    "rear_delt_fly": "Rear Delt Flies",
    "rear_delt_flies": "Rear Delt Flies",
    "rear-delt-fly": "Rear Delt Flies",
    "rear-delt-flies": "Rear Delt Flies"
}

def suggest_exercise_name(filename: str) -> str:
    """Suggest an exercise name from the allowed list based on the filename."""
    name = filename.lower().replace("_", " ").replace("-", " ")
    for keyword, exercise in EXERCISE_KEYWORDS.items():
        if keyword in name:
            return exercise
    return "Unknown"  # No match found, always return a string

class VideoOrganizer:
    def __init__(self, source_dir: str = "", target_dir: str = "videos"):
        # Always ensure source_dir is a string
        if not source_dir:
            while True:
                source_input = input("Source directory: ").strip().strip('"')
                if source_input:
                    self.source_dir = Path(source_input)
                    break
                print("Please enter a valid directory path.")
        else:
            self.source_dir = Path(source_dir)
        self.target_dir = Path(target_dir)
        
    def find_video_files(self, directory: Path) -> List[Path]:
        """Find all video files in a directory and subdirectories."""
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv'}
        video_files = []
        
        for file_path in directory.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in video_extensions:
                video_files.append(file_path)
        
        return video_files
    
    def organize_videos_interactive(self):
        """Organize videos interactively with user input."""
        print("🎥 Video Organizer for Exercise Recognition")
        print("=" * 50)
        
        # Get source directory
        if not self.source_dir:
            print("Where are your exercise videos located?")
            print("(You can drag and drop a folder here, or type the path)")
            source_input = input("Source directory: ").strip().strip('"')
            self.source_dir = Path(source_input)
        
        if not self.source_dir.exists():
            print(f"Error: Directory '{self.source_dir}' not found!")
            return False
        
        # Find all video files
        print(f"\nSearching for videos in: {self.source_dir}")
        video_files = self.find_video_files(self.source_dir)
        
        if not video_files:
            print("No video files found!")
            return False
        
        print(f"Found {len(video_files)} video files:")
        for i, video_file in enumerate(video_files, 1):
            print(f"  {i}. {video_file.name}")
        
        # Create target directory
        self.target_dir.mkdir(exist_ok=True)
        
        # Organize videos
        exercise_mapping = {}
        organized_count = 0
        
        print(f"\nOrganizing videos into: {self.target_dir}")
        print("For each video, I'll suggest an exercise name. You can:")
        print("- Press Enter to accept the suggestion")
        print("- Type a different exercise name")
        print("- Type 'skip' to skip this video")
        print()
        
        for video_file in video_files:
            suggested_name = suggest_exercise_name(video_file.stem)
            print(f"Video: {video_file.name}")
            if suggested_name != "Unknown":
                print(f"Suggested exercise: {suggested_name}")
            else:
                print("No exercise match found in filename.")
            print("Pick the correct exercise from the list below:")
            for idx, ex in enumerate(ALLOWED_EXERCISES, 1):
                print(f"  {idx}. {ex}")
            exercise_name = None
            while True:
                choice = input(f"Enter number (1-{len(ALLOWED_EXERCISES)}) or 'skip': ").strip()
                if choice.lower() == 'skip':
                    print("Skipped.")
                    exercise_name = None
                    break
                if choice.isdigit() and 1 <= int(choice) <= len(ALLOWED_EXERCISES):
                    exercise_name = ALLOWED_EXERCISES[int(choice)-1]
                    break
                print("Invalid choice. Please enter a valid number or 'skip'.")
            if exercise_name is None:
                continue
            
            # Create exercise directory
            exercise_dir = self.target_dir / exercise_name
            exercise_dir.mkdir(exist_ok=True)
            
            # Copy video file
            target_file = exercise_dir / video_file.name
            
            # Handle duplicate filenames
            counter = 1
            original_target = target_file
            while target_file.exists():
                stem = original_target.stem
                suffix = original_target.suffix
                target_file = exercise_dir / f"{stem}_{counter:03d}{suffix}"
                counter += 1
            
            try:
                shutil.copy2(video_file, target_file)
                print(f"✓ Copied to: {target_file}")
                organized_count += 1
                
                # Track mapping
                if exercise_name not in exercise_mapping:
                    exercise_mapping[exercise_name] = []
                exercise_mapping[exercise_name].append(video_file.name)
                
            except Exception as e:
                print(f"✗ Error copying {video_file.name}: {e}")
        
        # Summary
        print(f"\n{'='*50}")
        print("Organization Complete!")
        print(f"Organized {organized_count} videos into {len(exercise_mapping)} exercises:")
        
        for exercise_name, videos in exercise_mapping.items():
            print(f"  {exercise_name}: {len(videos)} videos")
        
        print(f"\nVideos are now organized in: {self.target_dir}")
        print("You can now run the exercise recognition pipeline!")
        
        return True
    
    def organize_videos_auto(self, exercise_mapping: Dict[str, List[str]]):
        """Organize videos automatically using a predefined mapping."""
        if not self.source_dir or not self.source_dir.exists():
            print("Error: Source directory not found!")
            return False
        
        # Find all video files
        video_files = self.find_video_files(self.source_dir)
        
        if not video_files:
            print("No video files found!")
            return False
        
        # Create target directory
        self.target_dir.mkdir(exist_ok=True)
        
        organized_count = 0
        
        for video_file in video_files:
            # Find which exercise this video belongs to
            matched_exercise = None
            for exercise_name, keywords in EXERCISE_KEYWORDS.items():
                for keyword in keywords:
                    if keyword.lower() in video_file.name.lower():
                        matched_exercise = exercise_name
                        break
                if matched_exercise:
                    break
            
            if not matched_exercise:
                print(f"Skipping {video_file.name} (no match found)")
                continue
            
            # Create exercise directory
            exercise_dir = self.target_dir / matched_exercise
            exercise_dir.mkdir(exist_ok=True)
            
            # Copy video file
            target_file = exercise_dir / video_file.name
            
            # Handle duplicate filenames
            counter = 1
            original_target = target_file
            while target_file.exists():
                stem = original_target.stem
                suffix = original_target.suffix
                target_file = exercise_dir / f"{stem}_{counter:03d}{suffix}"
                counter += 1
            
            try:
                shutil.copy2(video_file, target_file)
                print(f"✓ {video_file.name} → {matched_exercise}/")
                organized_count += 1
            except Exception as e:
                print(f"✗ Error copying {video_file.name}: {e}")
        
        print(f"\nOrganized {organized_count} videos automatically!")
        return True

def main():
    """Main function."""
    print("🎥 Video Organizer")
    print("=" * 30)
    print()
    print("This tool will help you organize your exercise videos")
    print("into the correct structure for training the exercise recognition model.")
    print()
    # Check if source directory was provided as argument
    source_dir = ""
    if len(sys.argv) > 1:
        source_dir = sys.argv[1]
    organizer = VideoOrganizer(source_dir)
    # Run interactive organization
    success = organizer.organize_videos_interactive()
    if success:
        print("\n🎉 Organization complete!")
        print("\nNext steps:")
        print("1. Review the organized videos in the 'videos' directory")
        print("2. Run: python exercise_recognition/START_HERE.py")
        print("3. Choose option 6 to run the complete pipeline")
    else:
        print("\n❌ Organization failed. Please check your input and try again.")

if __name__ == "__main__":
    main() 