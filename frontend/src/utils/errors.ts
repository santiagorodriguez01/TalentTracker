/**
 * Extrae el mensaje de error de diferentes formatos de respuesta de API
 *
 * @param error - Error de axios o cualquier error
 * @param defaultMessage - Mensaje por defecto si no se puede extraer el error
 * @returns String con el mensaje de error
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Ha ocurrido un error'): string {
  // Si el error ya es un string, devolverlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Intentar extraer del formato de respuesta del backend
  // Backend devuelve: { error: { message: "...", status: ... } }
  if (error?.response?.data?.error) {
    const errorData = error.response.data.error;

    // Si error es un objeto con message
    if (typeof errorData === 'object' && errorData.message) {
      return errorData.message;
    }

    // Si error ya es un string
    if (typeof errorData === 'string') {
      return errorData;
    }
  }

  // Intentar extraer directamente de response.data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Intentar extraer del mensaje del error
  if (error?.message) {
    return error.message;
  }

  // Devolver mensaje por defecto
  return defaultMessage;
}
