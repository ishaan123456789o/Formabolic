#!/usr/bin/env python3
"""
Install Dependencies for Exercise Recognition

This script will install all the required dependencies for the exercise
recognition pipeline.
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    """Install all required dependencies."""
    print("🔧 Installing Exercise Recognition Dependencies")
    print("=" * 50)
    
    # Core dependencies
    core_packages = [
        "scikit-learn>=1.3.0",
        "numpy>=1.24.0", 
        "pandas>=2.0.0",
        "joblib>=1.3.0"
    ]
    
    # Optional deep learning dependencies
    optional_packages = [
        "tensorflow>=2.13.0",
        "matplotlib>=3.7.0",
        "seaborn>=0.12.0"
    ]
    
    print("Installing core dependencies...")
    failed_core = []
    
    for package in core_packages:
        print(f"Installing {package}...")
        if install_package(package):
            print(f"✓ {package} installed successfully")
        else:
            print(f"✗ Failed to install {package}")
            failed_core.append(package)
    
    if failed_core:
        print(f"\nFailed to install core packages: {', '.join(failed_core)}")
        print("Please install them manually:")
        for package in failed_core:
            print(f"  pip install {package}")
    
    print("\nInstalling optional dependencies...")
    failed_optional = []
    
    for package in optional_packages:
        print(f"Installing {package}...")
        if install_package(package):
            print(f"✓ {package} installed successfully")
        else:
            print(f"⚠ {package} failed to install (optional)")
            failed_optional.append(package)
    
    print("\n" + "=" * 50)
    print("Installation Summary:")
    
    if not failed_core:
        print("✓ All core dependencies installed successfully!")
    else:
        print(f"✗ {len(failed_core)} core dependencies failed to install")
    
    if not failed_optional:
        print("✓ All optional dependencies installed successfully!")
    else:
        print(f"⚠ {len(failed_optional)} optional dependencies failed to install")
    
    print("\nNext steps:")
    print("1. Organize your exercise videos in the videos/ directory")
    print("2. Run: python exercise_recognition/quick_start.py")
    print("3. Follow the guided setup process")

if __name__ == "__main__":
    main() 