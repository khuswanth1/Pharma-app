import apiClient from './apiClient';

/**
 * POST /api/prescriptions
 * Uploads a base64 prescription image to the server and persists it.
 * Returns { success, url, time, id } on success.
 */
export async function uploadPrescriptionToServer(fileBase64, filename = '') {
  try {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    const payload = {
      image: fileBase64,
      userId: user?.id || null,
      filename: filename || 'prescription.jpg',
    };

    const response = await apiClient.post('/api/prescriptions', payload);
    const data = response.data;

    if (data && data.success && data.data) {
      return {
        success: true,
        id: data.data.id,
        url: data.data.imageUrl,
        time: data.data.uploadedAt,
      };
    }
    return { success: false };
  } catch (error) {
    console.error('[prescriptionService] Upload failed:', error);
    return { success: false };
  }
}

/**
 * POST /api/prescriptions/analyze
 * Sends a base64 image to the backend for medicine extraction.
 * Returns a string[] of medicine names on success, [] on failure.
 */
export async function analyzePrescriptionAPI(fileBase64, filename = '') {
  try {
    const payload = {
      image: fileBase64,
      filename: filename || 'prescription.jpg',
    };

    const response = await apiClient.post('/api/prescriptions/analyze', payload);
    const data = response.data;

    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('[prescriptionService] Analyze failed:', error?.response?.status, error?.message);
    return [];
  }
}
