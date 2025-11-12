import numpy as np

def check_blink(evidence: dict) -> bool:
    return evidence.get("blink", False)

def check_turn(evidence: dict) -> bool:
    yaw = abs(evidence.get("yaw", 0))
    return yaw > 20

def evaluate_liveness(challenge: str, evidence: dict) -> bool:
    if challenge == "blink":
        return check_blink(evidence)
    elif challenge in ["turn_left", "turn_right"]:
        return check_turn(evidence)
    return True
