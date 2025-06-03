import { uploadFile, FileUploadResponse } from '../../modules/menu/services/fileService';
import { ApiError } from './errors';
import { getImageUrl } from './imageUtils';

export interface ImageUploadResult {
    success: boolean;
    photoId?: string;
    error?: string;
}

export interface FileObject {
    uri: string;
    name: string;
    type: string;
}

export interface EntityWithOptionalPhoto {
    photo?: {
        id: string;
        path: string;
    } | null;
}

export class ImageUploadService {
    /**
     * Sube una imagen usando el fileService.
     * @param imageFile El objeto FileObject con uri, name, type.
     * @returns Un objeto ImageUploadResult indicando éxito/fallo y el ID de la foto.
     */
    static async uploadImage(
        imageFile: FileObject,
    ): Promise<ImageUploadResult> {
        if (!imageFile || !imageFile.uri) {
            console.warn("[ImageUploadService] Intento de subir imagen inválida:", imageFile);
            return { success: false, error: "No se proporcionó ninguna imagen válida" };
        }

        try {
            const uploadResult: FileUploadResponse = await uploadFile(imageFile);

            if (!uploadResult || !uploadResult.file || !uploadResult.file.id) {
                 console.error("[ImageUploadService] Respuesta inválida del fileService:", uploadResult);
                 return { success: false, error: "Respuesta inválida del servidor al subir imagen." };
            }

            return {
                success: true,
                photoId: uploadResult.file.id,
            };

        } catch (error) {
             console.error("Error en ImageUploadService.uploadImage:", error);
             let errorMessage = "Error desconocido al subir la imagen.";
             if (error instanceof ApiError) {
                errorMessage = `Error al subir: ${error.originalMessage || error.code}`;
             } else if (error instanceof Error) {
                errorMessage = error.message;
             }
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

     /**
      * Determina el valor de photoId a enviar al backend basado en el estado actual del formulario y la entidad existente.
      * @param formImageUri La URI de la imagen actual en el formulario (puede ser 'file://...', una URL remota, o null).
      * @param existingEntity La entidad actual (ej. Category) que podría tener una propiedad 'photo' con 'id' y 'path'.
      * @returns
      *   - `undefined`: No hay cambios en la foto O se va a subir una nueva. El DTO NO debe incluir `photoId`.
      *   - `null`: Se debe eliminar la foto existente en el backend. El DTO DEBE incluir `photoId: null`.
      */
     static determinePhotoId(
         formImageUri: string | null | undefined,
         existingEntity?: EntityWithOptionalPhoto,
     ): undefined | null {

         const existingPhotoPath = existingEntity?.photo?.path;
         const existingPhotoFullUrl = existingPhotoPath ? getImageUrl(existingPhotoPath) : null;

         if (formImageUri && formImageUri.startsWith('file://')) {
             return undefined;
         }
         else if ((formImageUri === null || formImageUri === undefined) && existingEntity?.photo) {
             return null;
         }
         else if (formImageUri && !formImageUri.startsWith('file://') && formImageUri === existingPhotoFullUrl) {
             return undefined;
         }
         else if (formImageUri && !formImageUri.startsWith('file://') && formImageUri !== existingPhotoFullUrl) {
             return undefined;
         }
         else if ((formImageUri === null || formImageUri === undefined) && !existingEntity?.photo) {
             return undefined;
         }

         return undefined;
     }
}