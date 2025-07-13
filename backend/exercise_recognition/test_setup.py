#!/usr/bin/env python3
"""
Test Setup for Exercise Recognition

This script tests that all components of the exercise recognition
pipeline are working correctly.
"""

import sys
from pathlib import Path

def test_imports():
    """Test that all required packages can be imported."""
    print("Testing imports...")
    
    imports_to_test = [
        ("cv2", "OpenCV for video processing"),
        ("mediapipe", "MediaPipe for pose estimation"),
        ("numpy", "NumPy for numerical operations"),
        ("sklearn", "Scikit-learn for machine learning"),
        ("pandas", "Pandas for data manipulation"),
        ("pickle", "Pickle for model serialization"),
        ("json", "JSON for data storage"),
    ]
    
    failed_imports = []
    
    for module_name, description in imports_to_test:
        try:
            __import__(module_name)
            print(f"✓ {module_name} - {description}")
        except ImportError as e:
            print(f"✗ {module_name} - {description} (Error: {e})")
            failed_imports.append(module_name)
    
    return failed_imports

def test_mediapipe_pose():
    """Test MediaPipe pose estimation."""
    print("\nTesting MediaPipe pose estimation...")
    
    try:
        import mediapipe as mp
        import numpy as np
        
        # Initialize pose
        pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Create a dummy image (black image)
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Process the image
        results = pose.process(dummy_image)
        
        print("✓ MediaPipe pose estimation working")
        return True
        
    except Exception as e:
        print(f"✗ MediaPipe pose estimation failed: {e}")
        return False

def test_sklearn():
    """Test scikit-learn functionality."""
    print("\nTesting scikit-learn...")
    
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder
        import numpy as np
        
        # Create dummy data
        X = np.random.rand(100, 10)
        y = np.random.choice(['A', 'B', 'C'], 100)
        
        # Test label encoder
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        
        # Test train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42
        )
        
        # Test random forest
        rf = RandomForestClassifier(n_estimators=10, random_state=42)
        rf.fit(X_train, y_train)
        predictions = rf.predict(X_test)
        
        print("✓ Scikit-learn functionality working")
        return True
        
    except Exception as e:
        print(f"✗ Scikit-learn test failed: {e}")
        return False

def test_file_structure():
    """Test that the required files exist."""
    print("\nTesting file structure...")
    
    required_files = [
        "data_extractor.py",
        "data_preprocessor.py", 
        "simple_trainer.py",
        "requirements.txt",
        "README.md"
    ]
    
    missing_files = []
    
    for filename in required_files:
        if Path(filename).exists():
            print(f"✓ {filename}")
        else:
            print(f"✗ {filename} - Missing")
            missing_files.append(filename)
    
    return missing_files

def test_directory_creation():
    """Test that directories can be created."""
    print("\nTesting directory creation...")
    
    test_dirs = [
        "extracted_data",
        "extracted_data/test_exercise",
        "extracted_data/trained_models"
    ]
    
    for dir_path in test_dirs:
        try:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            print(f"✓ Created directory: {dir_path}")
        except Exception as e:
            print(f"✗ Failed to create directory {dir_path}: {e}")
            return False
    
    return True

def main():
    """Run all tests."""
    print("🧪 Testing Exercise Recognition Setup")
    print("=" * 50)
    
    # Test imports
    failed_imports = test_imports()
    
    # Test MediaPipe
    mediapipe_ok = test_mediapipe_pose()
    
    # Test scikit-learn
    sklearn_ok = test_sklearn()
    
    # Test file structure
    missing_files = test_file_structure()
    
    # Test directory creation
    dir_creation_ok = test_directory_creation()
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary:")
    
    if not failed_imports:
        print("✓ All imports successful")
    else:
        print(f"✗ {len(failed_imports)} import failures")
    
    if mediapipe_ok:
        print("✓ MediaPipe pose estimation working")
    else:
        print("✗ MediaPipe pose estimation failed")
    
    if sklearn_ok:
        print("✓ Scikit-learn functionality working")
    else:
        print("✗ Scikit-learn functionality failed")
    
    if not missing_files:
        print("✓ All required files present")
    else:
        print(f"✗ {len(missing_files)} files missing")
    
    if dir_creation_ok:
        print("✓ Directory creation working")
    else:
        print("✗ Directory creation failed")
    
    # Overall status
    all_tests_passed = (
        not failed_imports and 
        mediapipe_ok and 
        sklearn_ok and 
        not missing_files and 
        dir_creation_ok
    )
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! Your setup is ready for exercise recognition.")
        print("\nNext steps:")
        print("1. Organize your exercise videos in the videos/ directory")
        print("2. Run: python exercise_recognition/quick_start.py")
    else:
        print("⚠ Some tests failed. Please fix the issues above before proceeding.")
        print("\nCommon fixes:")
        if failed_imports:
            print("- Install missing packages: pip install -r requirements.txt")
        if not mediapipe_ok:
            print("- Reinstall MediaPipe: pip install --upgrade mediapipe")
        if not sklearn_ok:
            print("- Reinstall scikit-learn: pip install --upgrade scikit-learn")

if __name__ == "__main__":
    main() 