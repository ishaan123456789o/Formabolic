# Exercise Recognition Pipeline

This directory contains a complete pipeline for training machine learning models to recognize exercises from video data using MediaPipe pose landmarks.

## Overview

The pipeline consists of three main stages:
1. **Data Extraction**: Extract pose landmarks from exercise videos
2. **Data Preprocessing**: Prepare the landmarks for machine learning
3. **Model Training**: Train classifiers to recognize exercises

## Directory Structure

```
exercise_recognition/
├── data_extractor.py          # Extract landmarks from videos
├── data_preprocessor.py       # Prepare data for training
├── simple_trainer.py          # Train ML models
├── requirements.txt           # ML dependencies
├── README.md                  # This file
├── extracted_data/            # Extracted landmarks (created after extraction)
│   ├── squat/
│   ├── pushup/
│   └── ...
└── trained_models/            # Trained models (created after training)
```

## Setup

### 1. Install Dependencies

First, activate your virtual environment and install the ML dependencies:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r exercise_recognition/requirements.txt
```

### 2. Prepare Your Videos

Organize your exercise videos in the following structure:

```
videos/
├── squat/
│   ├── squat_001.mp4
│   ├── squat_002.mp4
│   └── ...
├── pushup/
│   ├── pushup_001.mp4
│   ├── pushup_002.mp4
│   └── ...
└── deadlift/
    ├── deadlift_001.mp4
    └── ...
```

**Important**: 
- Use `.mp4` format for videos
- Each exercise should have its own folder
- Folder names will become the exercise labels
- Videos should show the full exercise movement clearly

## Usage

### Step 1: Extract Landmarks

Extract pose landmarks from your videos:

```bash
# Extract from a directory of videos
python exercise_recognition/data_extractor.py --videos_dir path/to/your/videos

# Or extract from a single video
python exercise_recognition/data_extractor.py --single_video path/to/video.mp4 --exercise_name squat
```

This will create:
- `extracted_data/exercise_name/video_name_landmarks.json` - Pose landmarks for each frame
- `extracted_data/exercise_name/video_name_metadata.json` - Video metadata
- `extracted_data/extraction_summary.json` - Summary of all extractions

### Step 2: Preprocess Data

Prepare the extracted landmarks for training:

```bash
python exercise_recognition/data_preprocessor.py
```

This will create:
- `extracted_data/preprocessed_data.pkl` - Training-ready data
- `extracted_data/label_encoder.pkl` - Label encoder for exercise names

### Step 3: Train Models

Train machine learning models:

```bash
python exercise_recognition/simple_trainer.py
```

This will create:
- `extracted_data/trained_models/model_name/` - Trained model files
- `extracted_data/trained_models/model_name/training_results.json` - Training results

## Data Format

### Extracted Landmarks

Each frame's landmarks are stored as:
```json
{
  "frame": 0,
  "timestamp": 0.0,
  "landmarks": [
    {
      "x": 0.5,
      "y": 0.3,
      "z": 0.1,
      "visibility": 0.9
    },
    // ... 33 landmarks total
  ]
}
```

### Preprocessed Data

The preprocessor creates sequences of frames for training:
- **Sequence Length**: 30 frames (configurable)
- **Features**: 132 values per frame (33 landmarks × 4 values)
- **Labels**: Exercise names encoded as integers

## Model Types

### 1. Random Forest (Recommended for starting)
- Fast training and prediction
- Good for small datasets
- Easy to interpret
- Works well with the current feature set

### 2. LSTM (For advanced users)
- Better for temporal patterns
- Requires more data
- Slower training but potentially better accuracy
- Good for complex movement patterns

## Adding More Data

To add more videos to your dataset:

1. **Add new videos** to your videos directory structure
2. **Re-run extraction**: `python data_extractor.py --videos_dir path/to/videos`
3. **Re-run preprocessing**: `python data_preprocessor.py`
4. **Re-train models**: `python simple_trainer.py`

The pipeline will automatically:
- Include new videos in the dataset
- Rebalance training/test splits
- Update the label encoder with new exercises
- Train new models with the expanded dataset

## Integration with Backend

Once you have trained models, you can integrate them into your main backend:

1. **Load the trained model** in your main.py
2. **Extract landmarks** from incoming videos
3. **Preprocess** the landmarks (same as training)
4. **Predict** the exercise type

Example integration:
```python
# Load trained model
with open('exercise_recognition/extracted_data/trained_models/best_model/model.pkl', 'rb') as f:
    model = joblib.load(f)

# Extract landmarks from video
landmarks = extract_landmarks(video)

# Preprocess (same as training)
features = preprocess_landmarks(landmarks)

# Predict
exercise = model.predict(features)
```

## Tips for Better Results

### Video Quality
- **Good lighting**: Ensure the person is well-lit
- **Clear background**: Avoid cluttered backgrounds
- **Full body visible**: Make sure the entire person is in frame
- **Consistent angle**: Record from the same angle for each exercise

### Data Collection
- **Multiple angles**: Record each exercise from different angles
- **Different people**: Include various body types and heights
- **Different speeds**: Include slow and fast repetitions
- **Variations**: Include slight variations in form

### Training
- **Start small**: Begin with 2-3 exercises and 5-10 videos each
- **Iterate**: Add more data and retrain
- **Validate**: Always test on unseen videos
- **Monitor**: Watch for overfitting (high training accuracy, low test accuracy)

## Troubleshooting

### Common Issues

1. **"No pose detected" errors**
   - Check video quality and lighting
   - Ensure the person is fully visible
   - Try adjusting MediaPipe confidence thresholds

2. **Poor model accuracy**
   - Add more training data
   - Check for class imbalance
   - Try different model parameters
   - Ensure videos are properly labeled

3. **Memory issues**
   - Reduce sequence length
   - Process videos in smaller batches
   - Use smaller model architectures

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify your video format and quality
3. Ensure all dependencies are installed
4. Check that your directory structure is correct

## Next Steps

Once you have a working model:

1. **Improve accuracy** by collecting more data
2. **Add more exercises** to expand the model's capabilities
3. **Optimize performance** for real-time prediction
4. **Add confidence scores** to predictions
5. **Implement ensemble methods** combining multiple models

## Example Workflow

Here's a complete example workflow:

```bash
# 1. Set up your videos
mkdir -p videos/squat videos/pushup
# Copy your videos to these folders

# 2. Extract landmarks
python exercise_recognition/data_extractor.py --videos_dir videos

# 3. Preprocess data
python exercise_recognition/data_preprocessor.py

# 4. Train model
python exercise_recognition/simple_trainer.py

# 5. Check results
ls extracted_data/trained_models/
```

You should now have a trained model that can recognize exercises from video input! 