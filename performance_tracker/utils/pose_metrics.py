import numpy as np

def calculate_speed(positions, fps=30):
    distances = np.sqrt(np.sum(np.diff(positions, axis=0)**2, axis=1))
    total_distance = np.sum(distances)
    total_time = len(distances) / fps
    return total_distance / total_time if total_time > 0 else 0
