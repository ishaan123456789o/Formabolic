import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import mediapipe as mp
import tempfile
import base64
from fastapi.middleware.cors import CORSMiddleware
from exercise_recognition.integration_example import ExerciseRecognizer

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recognizer = ExerciseRecognizer()

def is_joint_visible(landmark, threshold=0.3):  # More lenient
    return hasattr(landmark, 'visibility') and landmark.visibility > threshold

# Helper function to calculate angle between three points
def calculate_angle(a, b, c):
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

@app.post("/analyze_form")
async def analyze_form(
    video: UploadFile = File(...),
    exercise: str = Form(...)
):
    # Save video to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(await video.read())
        video_path = tmp.name

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5)
    cap = cv2.VideoCapture(video_path)
    feedback = set()
    frame_count = 0
    pose_detected = False
    all_frames = []
    all_landmarks = []
    overlay_img_full = []
    ex = exercise.lower().replace("-", "").replace(" ", "")

    # Helper for feedback
    def add_feedback(msg):
        if msg:
            feedback.add(msg)

    # Per-exercise state for movement validation
    min_knee_angle, max_knee_angle = 180, 0
    min_elbow_angle, max_elbow_angle = 180, 0
    min_wrist_y, max_wrist_y = 1, 0
    min_wrist_x, max_wrist_x = 1, 0
    min_elbow_x, max_elbow_x = 1, 0
    min_dist, max_dist = None, None
    min_idx, max_idx = None, None
    frame_idx = -1
    valid_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if frame_count % 2 != 0:
            continue  # Process every 2nd frame for speed
        frame_idx += 1
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)
        all_frames.append(frame.copy())
        all_landmarks.append(results.pose_landmarks if results.pose_landmarks else None)
        if not results.pose_landmarks:
            continue
        landmarks = results.pose_landmarks.landmark
        pose_detected = True
        valid_frames += 1
        # --- SQUAT ---
        if ex == "squat":
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
            ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            # Visibility
            if not (is_joint_visible(hip) and is_joint_visible(knee) and is_joint_visible(ankle) and is_joint_visible(shoulder)):
                continue
            # Angles
            hip_pt = np.array([hip.x, hip.y])
            knee_pt = np.array([knee.x, knee.y])
            ankle_pt = np.array([ankle.x, ankle.y])
            shoulder_pt = np.array([shoulder.x, shoulder.y])
            knee_angle = calculate_angle(hip_pt, knee_pt, ankle_pt)
            torso_angle = calculate_angle(shoulder_pt, hip_pt, ankle_pt)
            # Depth
            if hip.y > knee.y + 0.02:
                add_feedback("Go deeper: hips should drop to at least knee level.")
            # Knee valgus
            if abs(knee.x - ankle.x) > 0.12 and (knee.x < ankle.x or knee.x > hip.x):
                add_feedback("Keep knees tracking over toes; avoid caving in/out.")
            # Torso lean
            if torso_angle < 160:
                add_feedback("Keep torso more upright and maintain a neutral spine.")
            # Heels flat
            if ankle.y < knee.y - 0.08:
                add_feedback("Keep heels flat on the ground; avoid rising onto toes.")
            # Knees not past toes
            if knee.y < ankle.y - 0.05:
                add_feedback("Don't let knees travel excessively past toes at the bottom.")
        # --- PUSH-UP ---
        elif ex == "pushup":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist) and is_joint_visible(hip) and is_joint_visible(ankle)):
                continue
            # Elbow angle
            shoulder_pt = np.array([shoulder.x, shoulder.y])
            elbow_pt = np.array([elbow.x, elbow.y])
            wrist_pt = np.array([wrist.x, wrist.y])
            elbow_angle = calculate_angle(shoulder_pt, elbow_pt, wrist_pt)
            if elbow_angle > 100 or elbow_angle < 70:
                add_feedback("Bend elbows to about 90° at the bottom.")
            # Body line
            body_line = np.array([shoulder.y, hip.y, ankle.y])
            if np.ptp(body_line) > 0.15:
                add_feedback("Keep body in a straight line from shoulders to ankles.")
            # Elbow flare
            upper_arm = np.array([elbow.x - shoulder.x, elbow.y - shoulder.y])
            torso_vec = np.array([hip.x - shoulder.x, hip.y - shoulder.y])
            angle = np.degrees(np.arccos(np.clip(np.dot(upper_arm, torso_vec) / (np.linalg.norm(upper_arm) * np.linalg.norm(torso_vec)), -1.0, 1.0)))
            if angle < 30 or angle > 60:
                add_feedback("Keep elbows at ~45° from torso (not flared out wide).")
            # Head position
            head = landmarks[mp_pose.PoseLandmark.NOSE]
            if is_joint_visible(head) and abs(head.y - shoulder.y) > 0.12:
                add_feedback("Keep head neutral; don't crane forward.")
            # Core/glutes
            if abs(hip.y - shoulder.y) > 0.12 or abs(hip.y - ankle.y) > 0.12:
                add_feedback("Engage core and glutes to keep body straight.")
        # --- LAT PULLDOWN ---
        elif ex == "latpulldown":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Bar path (wrist y)
            if wrist.y > shoulder.y + 0.15:
                add_feedback("Pull bar down to upper chest, not behind neck.")
            # Elbow path
            if elbow.x > shoulder.x + 0.10:
                add_feedback("Elbows should go down and slightly back, not forward.")
            # Scapular retraction
            if abs(shoulder.x - elbow.x) < 0.05:
                add_feedback("Retract shoulder blades fully at bottom.")
            # Lean
            if abs(shoulder.y - wrist.y) > 0.25:
                add_feedback("Avoid leaning back too far to cheat the movement.")
            # Wrist
            if abs(wrist.x - elbow.x) > 0.12:
                add_feedback("Keep wrists straight, not bent or curled.")
        # --- TRICEP PUSHDOWN ---
        elif ex == "triceppushdown":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Elbow position
            if abs(elbow.x - shoulder.x) > 0.08:
                add_feedback("Keep elbows pinned close to your sides.")
            # Upper arm still
            if abs(elbow.y - shoulder.y) > 0.10:
                add_feedback("Upper arms must stay still; only forearms should move.")
            # Full extension
            wrist_pt = np.array([wrist.x, wrist.y])
            elbow_pt = np.array([elbow.x, elbow.y])
            shoulder_pt = np.array([shoulder.x, shoulder.y])
            elbow_angle = calculate_angle(shoulder_pt, elbow_pt, wrist_pt)
            if elbow_angle < 160:
                add_feedback("Extend elbows fully at the bottom, but don't hyperextend.")
            # No momentum
            if abs(shoulder.y - wrist.y) > 0.25:
                add_feedback("Avoid using momentum or swinging torso.")
            # Wrist
            if abs(wrist.x - elbow.x) > 0.10:
                add_feedback("Keep wrists neutral, not bent or broken.")
        # --- CHEST FLY ---
        elif ex == "chestfly":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Elbow bend
            elbow_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([elbow.x, elbow.y]),
                np.array([wrist.x, wrist.y])
            )
            if elbow_angle < 160 and elbow_angle > 30:
                if elbow_angle < 10 or elbow_angle > 30:
                    add_feedback("Keep elbows slightly bent (~10–20°) throughout.")
            # Arc
            if abs(wrist.x - shoulder.x) > 0.45:
                add_feedback("Arms should move in a wide arc, not overstretched.")
            # Tension
            if abs(wrist.x - elbow.x) < 0.10:
                add_feedback("Maintain constant tension through the full range.")
            # Hands crash
            if abs(wrist.x - shoulder.x) < 0.05:
                add_feedback("Don't let hands crash together or touch at the top.")
            # Shoulders
            if shoulder.y > elbow.y + 0.10:
                add_feedback("Keep shoulders pressed back and down.")
        # --- UPPER BACK ROW ---
        elif ex == "upperbackrow":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist) and is_joint_visible(hip)):
                continue
            # Torso angle
            torso_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([hip.x, hip.y]),
                np.array([wrist.x, wrist.y])
            )
            if torso_angle < 120 or torso_angle > 160:
                add_feedback("Torso should be leaned forward but fixed; no bouncing or swinging.")
            # Elbow past torso
            if elbow.x < hip.x:
                add_feedback("Pull with elbows; elbows should go past the torso.")
            # Shoulder blades
            if abs(shoulder.x - elbow.x) < 0.05:
                add_feedback("Squeeze shoulder blades together at the top.")
            # Spine
            if abs(shoulder.y - hip.y) > 0.20:
                add_feedback("Keep spine neutral; no excessive rounding or arching.")
            # No shrug
            if shoulder.y < elbow.y - 0.10:
                add_feedback("Don't shrug shoulders; use lats and mid-back.")
        # --- PREACHER CURL ---
        elif ex == "preachercurl" or ex == "preachercurls":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Upper arm stability
            if abs(shoulder.x - elbow.x) > 0.08:
                add_feedback("Upper arms should stay glued to the pad; no movement at the shoulder.")
            # Full range
            elbow_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([elbow.x, elbow.y]),
                np.array([wrist.x, wrist.y])
            )
            if elbow_angle < 30 or elbow_angle > 160:
                add_feedback("Curl through full range (fully extend and contract).")
            # Wrists
            if abs(wrist.x - elbow.x) > 0.10:
                add_feedback("Wrists remain straight; don't let them break at the bottom.")
            # Control
            if abs(wrist.y - elbow.y) > 0.20:
                add_feedback("Control the negative; no dropping the weight.")
            # No jerking
            if abs(elbow.y - shoulder.y) > 0.10:
                add_feedback("Avoid jerking or using hips/back to lift.")
        # --- LATERAL RAISE ---
        elif ex == "lateralraise" or ex == "lateralraises":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Height
            if wrist.y < shoulder.y - 0.05:
                add_feedback("Raise arms just below shoulder level; not higher.")
            # Elbow bend
            elbow_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([elbow.x, elbow.y]),
                np.array([wrist.x, wrist.y])
            )
            if elbow_angle < 150:
                add_feedback("Maintain a slight bend at the elbows throughout.")
            # Wrist alignment
            if abs(wrist.y - elbow.y) > 0.08:
                add_feedback("Keep wrists in line with elbows; avoid tilting.")
            # No swinging
            if abs(shoulder.x - wrist.x) > 0.20:
                add_feedback("No swinging or momentum; slow and controlled lift.")
            # Lead with elbows
            if elbow.y > wrist.y:
                add_feedback("Focus on leading with the elbows, not the hands.")
        # --- SHOULDER PRESS ---
        elif ex == "shoulderpress":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist)):
                continue
            # Start position
            if elbow.y < wrist.y:
                add_feedback("Start with elbows below wrists, press straight up.")
            # Lockout
            if wrist.y > shoulder.y - 0.05:
                add_feedback("Lockout should be directly over shoulders, not behind head.")
            # Core
            if abs(shoulder.x - wrist.x) > 0.10:
                add_feedback("Avoid arching lower back; keep core tight.")
            # Elbow flare
            if abs(elbow.x - shoulder.x) > 0.10:
                add_feedback("Elbows should not flare excessively.")
            # Vertical path
            if abs(wrist.x - shoulder.x) > 0.10:
                add_feedback("Keep the bar/dumbbells moving in a vertical line.")
        # --- LEG EXTENSION ---
        elif ex == "legextension" or ex == "legextensions":
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
            ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
            if not (is_joint_visible(hip) and is_joint_visible(knee) and is_joint_visible(ankle)):
                continue
            # Hip lift
            if hip.y < knee.y - 0.05:
                add_feedback("Thighs should stay glued to the seat; no hip lift.")
            # Lockout
            knee_angle = calculate_angle(
                np.array([hip.x, hip.y]),
                np.array([knee.x, knee.y]),
                np.array([ankle.x, ankle.y])
            )
            if knee_angle < 160:
                add_feedback("Extend legs to full lockout without snapping.")
            # Control
            if abs(ankle.y - knee.y) > 0.20:
                add_feedback("Control the lowering phase; don't let the weight drop.")
            # Upright
            if hip.x < knee.x - 0.05:
                add_feedback("Sit upright with back against pad.")
            # No swinging
            if abs(ankle.x - knee.x) > 0.10:
                add_feedback("Avoid excessive swinging; isolate the quads.")
        # --- REAR DELT FLY ---
        elif ex == "reardeltfly" or ex == "reardeltflies":
            shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
            hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            if not (is_joint_visible(shoulder) and is_joint_visible(elbow) and is_joint_visible(wrist) and is_joint_visible(hip)):
                continue
            # Torso angle
            torso_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([hip.x, hip.y]),
                np.array([wrist.x, wrist.y])
            )
            if torso_angle < 45 or torso_angle > 90:
                add_feedback("Hinge at the hips and maintain a fixed torso angle (~45–90° bent over).")
            # Arm arc
            if abs(wrist.x - shoulder.x) < 0.10:
                add_feedback("Arms move outward in a reverse arc; don't swing up.")
            # Elbow bend
            elbow_angle = calculate_angle(
                np.array([shoulder.x, shoulder.y]),
                np.array([elbow.x, elbow.y]),
                np.array([wrist.x, wrist.y])
            )
            if elbow_angle < 150:
                add_feedback("Elbows slightly bent and stay fixed throughout.")
            # No momentum
            if abs(shoulder.x - wrist.x) > 0.20:
                add_feedback("No momentum; control both lifting and lowering.")
            # Squeeze
            if abs(shoulder.y - elbow.y) < 0.05:
                add_feedback("Squeeze rear delts at the top without shrugging.")
        # --- END EXERCISES ---
        # Draw pose overlay for every valid frame
        mp_drawing = mp.solutions.drawing_utils
        frame_overlay = frame.copy()
        mp_drawing.draw_landmarks(frame_overlay, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        _, buffer = cv2.imencode('.jpg', frame_overlay)
        overlay_img_full.append(base64.b64encode(buffer).decode('utf-8'))

    cap.release()
    pose.close()

    if not pose_detected or valid_frames < 5:
        feedback = [f"Could not detect a valid {exercise} in the video. Please try again."]
    elif not feedback:
        feedback = ["Good form!"]
    else:
        feedback = list(feedback)

    return JSONResponse({
        "feedback": feedback,
        "pose_overlay_burst": overlay_img_full
    })

@app.post("/predict-exercise")
async def predict_exercise(video: UploadFile = File(...)):
    # Save uploaded video temporarily
    temp_path = f"temp_{video.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await video.read())
    try:
        result = recognizer.predict_exercise(temp_path)
        os.remove(temp_path)
        if 'error' in result and result['error']:
            raise HTTPException(status_code=400, detail=result['error'])
        return {
            "prediction": result.get("prediction"),
            "confidence": result.get("confidence"),
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e)) 