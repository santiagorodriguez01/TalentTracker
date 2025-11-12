# services/pose_estimator.py
from ultralytics import YOLO
import numpy as np, cv2

class PoseEstimator:
    def __init__(self, model_path="yolov8n-pose.pt"):
        self.model = YOLO(model_path)

    def detect_keypoints(self, frame):
        results = self.model(frame)
        if len(results) == 0 or not hasattr(results[0], "keypoints"):
            return None
        kpts = results[0].keypoints.xy[0].cpu().numpy()
        return kpts

    def process_video(self, path, fps=30):
        cap = cv2.VideoCapture(path)
        hip_positions = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            kpts = self.detect_keypoints(frame)
            if kpts is not None:
                hip = np.mean(kpts[11:13, :], axis=0)
                hip_positions.append(hip)
        cap.release()

        if len(hip_positions) < 2:
            return {"error": "No se detectaron suficientes frames válidos"}

        total_dist = np.sum(np.sqrt(np.sum(np.diff(np.array(hip_positions), axis=0)**2, axis=1)))
        total_time = len(hip_positions) / fps
        avg_speed = total_dist / total_time if total_time > 0 else 0
        return {"average_speed_m_s": round(avg_speed, 2)}
