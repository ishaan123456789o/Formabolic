# Video Organizer Example

This example shows how the video organizer tool works with different types of video filenames.

## 🎥 How It Works

The video organizer will:
1. **Scan your videos** - Find all video files in your source directory
2. **Suggest exercise names** - Based on the filename, suggest what exercise it might be
3. **Let you confirm/change** - You can accept the suggestion or type a different name
4. **Organize automatically** - Copy videos to the correct folder structure

## 📝 Example Filenames

Here are examples of how different filenames will be handled:

### Automatic Recognition
| Original Filename | Suggested Exercise | Notes |
|------------------|-------------------|-------|
| `squat_001.mp4` | `squat` | Direct match |
| `pushup_video.mp4` | `pushup` | Contains keyword |
| `deadlift_training.mp4` | `deadlift` | Contains keyword |
| `bench_press_heavy.mp4` | `bench_press` | Contains keywords |
| `pull-up_workout.mp4` | `pullup` | Normalized name |
| `bicep_curl_light.mp4` | `bicep_curl` | Contains keywords |

### Manual Input
| Original Filename | Suggested Exercise | You Type | Final Exercise |
|------------------|-------------------|----------|----------------|
| `video_001.mp4` | `unknown_exercise` | `squat` | `squat` |
| `workout_002.mp4` | `unknown_exercise` | `pushup` | `pushup` |
| `exercise_003.mp4` | `unknown_exercise` | `deadlift` | `deadlift` |

## 🚀 How to Use

### Method 1: Interactive Mode (Recommended)
```bash
cd backend
python exercise_recognition/video_organizer.py
```

The tool will:
1. Ask for your source directory
2. Find all video files
3. For each video:
   - Show the filename
   - Suggest an exercise name
   - Let you accept, change, or skip

### Method 2: Command Line
```bash
cd backend
python exercise_recognition/video_organizer.py "/path/to/your/videos"
```

### Method 3: From the Menu
```bash
cd backend
python exercise_recognition/START_HERE.py
# Then choose option 3: Organize Videos
```

## 📁 Before and After

### Before Organization
```
My Videos/
├── squat_001.mp4
├── squat_002.mp4
├── pushup_001.mp4
├── deadlift_heavy.mp4
├── bench_press_workout.mp4
└── random_video.mp4
```

### After Organization
```
videos/
├── squat/
│   ├── squat_001.mp4
│   └── squat_002.mp4
├── pushup/
│   └── pushup_001.mp4
├── deadlift/
│   └── deadlift_heavy.mp4
├── bench_press/
│   └── bench_press_workout.mp4
└── unknown_exercise/
    └── random_video.mp4
```

## 💡 Tips for Best Results

### 1. Use Descriptive Filenames
**Good:**
- `squat_001.mp4`
- `pushup_workout.mp4`
- `deadlift_heavy.mp4`

**Avoid:**
- `video_001.mp4`
- `IMG_1234.mp4`
- `untitled.mp4`

### 2. Be Consistent with Exercise Names
Use the same exercise name for similar movements:
- `pushup` or `push-up` (both will be recognized)
- `pullup` or `pull-up` (both will be recognized)
- `deadlift` or `dead-lift` (both will be recognized)

### 3. Skip Irrelevant Videos
If a video doesn't show an exercise or is poor quality:
- Type `skip` when prompted
- The video will be ignored

## 🔧 Supported Video Formats

The organizer supports these video formats:
- `.mp4` (recommended)
- `.avi`
- `.mov`
- `.mkv`
- `.wmv`
- `.flv`

## 🎯 Next Steps

After organizing your videos:

1. **Review the structure** - Check that videos are in the right folders
2. **Run the pipeline** - Use the START_HERE.py menu
3. **Train your model** - The organized videos will be used for training

## ❓ Common Questions

**Q: What if I have videos with different names for the same exercise?**
A: The tool will suggest the same exercise name for similar keywords. You can also manually type the same name for consistency.

**Q: Can I organize videos from multiple folders?**
A: Yes! Just point the tool to a parent folder that contains all your video subfolders.

**Q: What if I make a mistake?**
A: You can run the organizer again. It will handle duplicate filenames automatically by adding numbers.

**Q: Will my original videos be moved or copied?**
A: Your original videos are copied to the new structure, so they remain safe in their original location. 