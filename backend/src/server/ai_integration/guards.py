def require_coordinator(user) -> None:
    if user.role not in {"COORDINADOR", "ENTRENADOR"}:
        raise PermissionError("Rol no autorizado para análisis físico")

def require_reviewer(user) -> None:
    if user.role not in {"REVISOR_CUENTA"}:
        raise PermissionError("Rol no autorizado para aprobar egresos")
