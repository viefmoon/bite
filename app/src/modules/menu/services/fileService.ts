import apiClient from "../../../app/services/apiClient";
import { ApiError } from "../../../app/lib/errors";
import { Platform } from "react-native";
import { API_PATHS } from "../../../app/constants/apiPaths";


export interface FileUploadResponse {
  file: {
    id: string;
    path: string;
  };
  presignedUrl?: string;
}

export interface FileObject {
  uri: string;
  name: string;
  type: string;
}

export const uploadFile = async (
  fileToUpload: FileObject
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", {
    uri:
      Platform.OS === "android"
        ? fileToUpload.uri
        : fileToUpload.uri.replace("file://", ""),
    name: fileToUpload.name,
    type: fileToUpload.type,
  } as any);

  try {
    const response = await apiClient.post<FileUploadResponse>(
      API_PATHS.FILES_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (!response.ok || !response.data || !response.data.file) {
      console.error(
        "Respuesta inválida del servidor al subir archivo:",
        response
      );
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  } catch (error) {
    console.error("Error subiendo archivo con FormData:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "UPLOAD_FAILED",
      error instanceof Error ? error.message : "Error subiendo archivo",
      500
    );
  }
};

const fileService = {
  uploadFile,
  uploadImage: uploadFile,
};

export default fileService;
