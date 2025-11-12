# services/metrics_accumulator.py
import numpy as np
from collections import defaultdict, deque

FPS = 30.0

class MetricsAccumulator:
    def __init__(self, buffer_size=150):
        self.history = defaultdict(lambda: deque(maxlen=buffer_size))

    def update_and_compute(self, alumno_id, keypoints):
        # Extraer caderas y hombros
        hips = np.mean(keypoints[11:13, :], axis=0)
        shoulders = np.mean(keypoints[5:7, :], axis=0)

        buf = self.history[alumno_id]
        buf.append(hips)

        n = len(buf)
        speed = 0.0
        accel = 0.0
        avg_speed = 0.0
        max_speed = 0.0

        if n >= 2:
            pts = np.array(buf, dtype=np.float32)
            diffs = np.diff(pts, axis=0)
            dists = np.linalg.norm(diffs, axis=1)
            speeds = dists * FPS  # m/s aprox
            speed = float(speeds[-1])
            avg_speed = float(np.mean(speeds))
            max_speed = float(np.max(speeds))
            if speeds.size >= 2:
                accel = float((speeds[-1] - speeds[-2]) * FPS)  # m/s^2

        posture = float(abs(shoulders[1] - hips[1]) / 100.0)
        balance = float(abs(shoulders[0] - hips[0]) / 100.0)

        # Jump height (px): baseline (y max) - current y (menor y es más alto)
        baseline_y = float(max(p[1] for p in buf)) if n else float(hips[1])
        jump_px = max(0.0, baseline_y - float(hips[1]))

        return {
            "speed_m_s": round(speed, 3),
            "avg_speed_m_s": round(avg_speed, 3),
            "max_speed_m_s": round(max_speed, 3),
            "acceleration_m_s2": round(accel, 3),
            "balance_score": round(balance, 3),
            "posture_score": round(posture, 3),
            "frames_buffered": n,
            "jump_height_px": round(jump_px, 1),
        }
