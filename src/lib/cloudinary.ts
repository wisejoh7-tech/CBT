import { fileToCompressedDataUrl } from './utils/image';

/**
 * Uploads an image file to Cloudinary using standard REST API.
 * Falls back to compressed Data URL if Cloudinary environment parameters are not configured or upload fails.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url || data.url) {
          return data.secure_url || data.url;
        }
      } else {
        console.warn('Cloudinary upload endpoint returned non-OK response:', response.statusText);
      }
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local compressed Data URL:', error);
    }
  }

  // Fallback if Cloudinary environment variables are missing or upload fails
  return await fileToCompressedDataUrl(file);
}
