import { API_URL } from "@env";

/**
 * Construye la URL completa de una imagen a partir de su ruta relativa o absoluta.
 * Si la ruta ya es una URL completa (http/https) o URI local (file://), la devuelve tal cual.
 * Si es una ruta relativa, la prefija con la API_URL del entorno.
 * @param imagePath - La ruta relativa (ej. 'uploads/imagen.jpg') o URL completa de la imagen.
 * @returns La URL completa y lista para usar, o null si la entrada es inválida.
 */
export const getImageUrl = (
  imagePath: string | null | undefined
): string | null => {
  if (!imagePath) {
    return null;
  }

  // Asegurarse de que API_URL esté definida y sea una cadena antes de usarla
  if (typeof API_URL !== 'string' || !API_URL) {
    console.error("API_URL no está definida o no es una cadena válida en el entorno.");
    // Devolver null es consistente con el manejo de imagePath inválido.
    return null;
  }
  const apiUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = imagePath.replace(/\\/g, "/");

  if (normalizedPath.startsWith("http")) {
    const urlObj = new URL(normalizedPath);
    const pathPart = urlObj.pathname;

    return `${apiUrl}${pathPart}`;
  }
  const formattedPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${apiUrl}${formattedPath}`;
};
