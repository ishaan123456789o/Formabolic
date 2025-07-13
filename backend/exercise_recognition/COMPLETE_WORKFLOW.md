# Complete Exercise Recognition Workflow

This guide walks you through the **entire process** of creating an exercise recognition model, from organizing your videos to training and using the model.

## 🎯 What You'll Accomplish

By following this workflow, you'll:
1. **Organize your exercise videos** automatically
2. **Extract pose landmarks** from each video
3. **Train a machine learning model** to recognize exercises
4. **Test and integrate** the model into your application

## 📋 Prerequisites

- Python 3.8+ with virtual environment
- Exercise videos (any format: MP4, AVI, MOV, etc.)
- Basic understanding of machine learning concepts

## 🚀 Complete Workflow (Step by Step)

### Step 1: Set Up Your Environment

```bash
# Navigate to your project
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
python exercise_recognition/install_dependencies.py
```

### Step 2: Test Your Setup

```bash
# Verify everything is working
python exercise_recognition/test_setup.py
```

You should see: ✅ All tests passed!

### Step 3: Organize Your Videos

**This is where the new video organizer comes in!**

```bash
# Run the video organizer
python exercise_recognition/video_organizer.py
```

**What happens:**
1. Tool asks for your video directory
2. Scans for all video files
3. For each video:
   - Suggests an exercise name based on filename
   - You can accept, change, or skip
4. Automatically creates the correct folder structure

**Example interaction:**
```
Video: squat_001.mp4
Suggested exercise: squat
Exercise name (or 'skip'): [Press Enter to accept]

Video: pushup_workout.mp4
Suggested exercise: pushup
Exercise name (or 'skip'): [Press Enter to accept]

Video: random_video.mp4
Suggested exercise: unknown_exercise
Exercise name (or 'skip'): deadlift [You type this]
```

**Result:** Your videos are now organized in `videos/exercise_name/` folders!

### Step 4: Extract Pose Landmarks

```bash
# Extract landmarks from organized videos
python exercise_recognition/data_extractor.py --videos_dir videos
```

**What happens:**
- Processes each video frame by frame
- Extracts 33 body landmarks per frame
- Saves data as JSON files
- Creates metadata for each video

**Files created:**
- `extracted_data/exercise_name/video_landmarks.json`
- `extracted_data/exercise_name/video_metadata.json`

### Step 5: Preprocess Data

```bash
# Prepare data for machine learning
python exercise_recognition/data_preprocessor.py
```

**What happens:**
- Converts landmarks to training-ready sequences
- Creates 30-frame windows for temporal patterns
- Splits data into training and test sets
- Saves preprocessed data

**Files created:**
- `extracted_data/preprocessed_data.pkl`
- `extracted_data/label_encoder.pkl`

### Step 6: Train Your Model

```bash
# Train the exercise recognition model
python exercise_recognition/simple_trainer.py
```

**What happens:**
- Trains a Random Forest classifier
- Evaluates model performance
- Saves the trained model

**Files created:**
- `extracted_data/trained_models/model_name/`
- `extracted_data/trained_models/model_name/training_results.json`

### Step 7: Test Your Model

```bash
# Test the trained model
python exercise_recognition/integration_example.py
```

**What happens:**
- Loads your trained model
- Tests it with sample videos
- Shows prediction results and confidence scores

## 🎯 Expected Results

**Good results look like:**
- **Accuracy:** >80% on test set
- **Training time:** <5 minutes
- **Prediction time:** <1 second per video
- **Confidence scores:** >0.7 for correct predictions

## 🔄 Adding More Data Later

When you want to improve your model:

1. **Add new videos** to your existing `videos/` structure
2. **Re-run extraction:**
   ```bash
   python exercise_recognition/data_extractor.py --videos_dir videos
   ```
3. **Re-run preprocessing:**
   ```bash
   python exercise_recognition/data_preprocessor.py
   ```
4. **Re-train model:**
   ```bash
   python exercise_recognition/simple_trainer.py
   ```

The pipeline automatically includes new data and retrains!

## 🎥 Video Requirements for Best Results

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

### Naming Guidelines
- **Use descriptive names:** `squat_001.mp4`, `pushup_workout.mp4`
- **Be consistent:** Use same exercise names for similar movements
- **Avoid generic names:** `video_001.mp4`, `IMG_1234.mp4`

## 🛠️ Using the Menu Interface

For an even easier experience, use the menu interface:

```bash
python exercise_recognition/START_HERE.py
```

This gives you a menu with all options:
- Install Dependencies
- Test Setup
- **Organize Videos** (NEW!)
- Extract Landmarks
- Preprocess Data
- Train Model
- Run Complete Pipeline
- Test Integration
- View Documentation
- Getting Started Guide

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

## 📊 Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "No videos found" | Wrong directory path | Check your video folder location |
| "No pose detected" | Poor video quality | Improve lighting and angle |
| Low accuracy | Not enough data | Add more videos per exercise |
| Memory errors | Videos too long | Use shorter videos (5-30 seconds) |
| Import errors | Missing dependencies | Run install_dependencies.py |

## 🎉 Success Checklist

- [ ] Dependencies installed successfully
- [ ] Setup test passed
- [ ] Videos organized in correct structure
- [ ] Landmarks extracted from all videos
- [ ] Data preprocessed successfully
- [ ] Model trained with >80% accuracy
- [ ] Model tested with new videos
- [ ] Integration working in your app

## 🚀 Next Steps After Success

1. **Improve accuracy** by collecting more diverse videos
2. **Add more exercises** to expand model capabilities
3. **Optimize performance** for real-time prediction
4. **Add confidence thresholds** for better reliability
5. **Implement ensemble methods** for improved results

## 📚 Additional Resources

- **Video Organizer Guide:** `example_usage.md`
- **Technical Documentation:** `README.md`
- **Getting Started:** `GETTING_STARTED.md`
- **Menu Interface:** `START_HERE.py`

---

**Remember:** Start small with 2-3 exercises and 5-10 videos each. You can always add more data later to improve your model! 🏋️‍♂️ 