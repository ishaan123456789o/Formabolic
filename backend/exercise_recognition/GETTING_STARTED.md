# Getting Started with Exercise Recognition

This guide will walk you through the complete process of creating an exercise recognition system using your own video data.

## 🎯 What You'll Build

You'll create a machine learning model that can:
- **Recognize exercises** from video input
- **Classify movements** like squats, push-ups, deadlifts, etc.
- **Provide confidence scores** for predictions
- **Integrate with your existing app** for automatic exercise detection

## 📋 Prerequisites

- Python 3.8+ with virtual environment
- Exercise videos (MP4 format)
- Basic understanding of machine learning concepts

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python exercise_recognition/install_dependencies.py
```

### Step 2: Test Your Setup
```bash
python exercise_recognition/test_setup.py
```

### Step 3: Organize Your Videos
Create this structure:
```
videos/
├── squat/
│   ├── squat_001.mp4
│   ├── squat_002.mp4
│   └── ...
├── pushup/
│   ├── pushup_001.mp4
│   └── ...
└── deadlift/
    └── ...
```

### Step 4: Run the Complete Pipeline
```bash
python exercise_recognition/quick_start.py
```

### Step 5: Test Your Model
```bash
python exercise_recognition/integration_example.py
```

## 🔧 Detailed Process

### Phase 1: Data Extraction
**What happens:** Your videos are processed to extract pose landmarks using MediaPipe.

**Input:** Exercise videos
**Output:** JSON files with pose data for each frame

**Files created:**
- `extracted_data/exercise_name/video_landmarks.json`
- `extracted_data/exercise_name/video_metadata.json`

### Phase 2: Data Preprocessing
**What happens:** Raw landmarks are converted into training-ready sequences.

**Input:** Extracted landmarks
**Output:** Preprocessed training data

**Files created:**
- `extracted_data/preprocessed_data.pkl`
- `extracted_data/label_encoder.pkl`

### Phase 3: Model Training
**What happens:** Machine learning models are trained on your data.

**Input:** Preprocessed data
**Output:** Trained models

**Files created:**
- `extracted_data/trained_models/model_name/`
- `extracted_data/trained_models/model_name/training_results.json`

## 📊 Understanding the Data

### Pose Landmarks
Each frame contains 33 body landmarks:
- **Head:** Nose, eyes, ears
- **Arms:** Shoulders, elbows, wrists
- **Torso:** Shoulders, hips
- **Legs:** Hips, knees, ankles

### Features Extracted
- **Position:** X, Y, Z coordinates
- **Visibility:** Confidence score (0-1)
- **Sequences:** 30-frame windows for temporal patterns

### Model Types
1. **Random Forest** (Recommended for starting)
   - Fast training and prediction
   - Good for small datasets
   - Easy to interpret

2. **LSTM** (Advanced)
   - Better for temporal patterns
   - Requires more data
   - Higher potential accuracy

## 🎥 Video Requirements

### Quality Guidelines
- **Resolution:** 720p or higher
- **Duration:** 5-30 seconds per exercise
- **Lighting:** Good, even lighting
- **Background:** Clean, uncluttered
- **Angle:** Side view or 45-degree angle
- **Movement:** Full range of motion visible

### Content Guidelines
- **One exercise per video**
- **Multiple repetitions** (3-5 reps)
- **Consistent form** throughout
- **No camera movement** during recording
- **Person fully visible** in frame

## 📈 Improving Results

### Data Collection Tips
1. **Start small:** 5-10 videos per exercise
2. **Add variety:** Different angles, speeds, people
3. **Quality over quantity:** Better videos > more videos
4. **Consistent labeling:** Use exact same exercise names

### Training Tips
1. **Monitor accuracy:** Aim for >80% on test set
2. **Check overfitting:** Training accuracy shouldn't be much higher than test
3. **Add more data:** If accuracy is low, collect more videos
4. **Try different models:** Compare Random Forest vs LSTM

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Low accuracy | Not enough data | Add more videos |
| Overfitting | Too much training data | Reduce model complexity |
| No pose detected | Poor video quality | Improve lighting/angle |
| Memory errors | Videos too long | Reduce sequence length |

## 🔄 Adding More Data

When you want to add more videos:

1. **Add videos** to your existing structure
2. **Re-run extraction:**
   ```bash
   python exercise_recognition/data_extractor.py --videos_dir videos
   ```
3. **Re-run preprocessing:**
   ```bash
   python exercise_recognition/data_preprocessor.py
   ```
4. **Re-train models:**
   ```bash
   python exercise_recognition/simple_trainer.py
   ```

The pipeline automatically:
- Includes new videos in the dataset
- Rebalances training/test splits
- Updates the label encoder
- Trains new models

## 🔗 Integration with Your App

Once you have a trained model, integrate it into your main backend:

```python
from exercise_recognition.integration_example import ExerciseRecognizer

# Initialize recognizer
recognizer = ExerciseRecognizer()

# Predict exercise from video
result = recognizer.predict_exercise("path/to/video.mp4")
print(f"Exercise: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2f}")
```

## 📝 Example Workflow

Here's a complete example of the process:

```bash
# 1. Set up environment
cd backend
source venv/bin/activate
python exercise_recognition/install_dependencies.py

# 2. Test setup
python exercise_recognition/test_setup.py

# 3. Organize videos (manually)
mkdir -p videos/squat videos/pushup
# Copy your videos to these folders

# 4. Run complete pipeline
python exercise_recognition/quick_start.py

# 5. Check results
ls exercise_recognition/extracted_data/trained_models/

# 6. Test with new video
python exercise_recognition/integration_example.py
```

## 🎯 Success Metrics

**Good results look like:**
- **Accuracy:** >80% on test set
- **Confidence:** >0.7 for correct predictions
- **Training time:** <5 minutes for Random Forest
- **Prediction time:** <1 second per video

**Red flags:**
- **Accuracy <60%:** Need more/better training data
- **Overfitting:** Training accuracy >> test accuracy
- **Low confidence:** Model uncertain about predictions

## 🆘 Getting Help

If you encounter issues:

1. **Check the test script:**
   ```bash
   python exercise_recognition/test_setup.py
   ```

2. **Verify video quality:**
   - Good lighting
   - Clear background
   - Full body visible

3. **Check file structure:**
   - Videos in correct folders
   - MP4 format
   - Proper naming

4. **Review error messages:**
   - Look for specific import errors
   - Check file paths
   - Verify dependencies

## 🚀 Next Steps

Once you have a working model:

1. **Improve accuracy** by collecting more data
2. **Add more exercises** to expand capabilities
3. **Optimize performance** for real-time use
4. **Add confidence thresholds** for better reliability
5. **Implement ensemble methods** for improved results

## 📚 Additional Resources

- **MediaPipe Documentation:** https://mediapipe.dev/
- **Scikit-learn Guide:** https://scikit-learn.org/stable/
- **Machine Learning Basics:** https://www.coursera.org/learn/machine-learning

---

**Remember:** Start small, iterate often, and focus on data quality over quantity. A good model with 50 high-quality videos is better than a poor model with 500 low-quality videos! 