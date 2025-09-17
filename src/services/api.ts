// API service for backend imaging system integration

export interface CaptureResponse {
  success: boolean;
  message?: string;
}

export interface FingerprintResponse {
  response_code: number;
  response_msg: string;
  image?: string;
}

// Extract relation number from URL path like /capture-111
export const getRelationNumber = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/capture-(\d+)/);
  return match ? match[1] : '000001'; // Default fallback
};

// Convert image data to base64 string (remove data:image/... prefix if present)
const getBase64String = (imageData: string): string => {
  if (imageData.startsWith('data:')) {
    return imageData.split(',')[1];
  }
  return imageData;
};

// Immediate save for photo/signature captures
export const captureBrowse = async (
  imageData: string, 
  type: 1 | 2, // 1 for photo, 2 for signature
  customerNumber?: string
): Promise<CaptureResponse> => {
  try {
    const relationNumber = customerNumber || getRelationNumber();
    const base64Data = getBase64String(imageData);

    const response = await fetch('http://10.203.14.169/imaging/capture_browse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64Data,
        type,
        customerNumber: relationNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, message: result.message };
  } catch (error) {
    console.error('Error in captureBrowse:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Final submission for photo and signature
export const saveData = async (data: {
  photoData: string;
  signatureData: string;
  customerNumber?: string;
  batchNumber: string; // Added to match NextJS api.ts
}): Promise<CaptureResponse> => {
  try {
    const relationNumber = data.customerNumber || getRelationNumber();
    const photoBase64 = getBase64String(data.photoData);
    const signatureBase64 = getBase64String(data.signatureData);

    // Create FormData
    const formData = new FormData();
    formData.append("accno", "");
    formData.append("signname", "");
    formData.append("id", "");
    formData.append("expirydate", "");
    formData.append("effectivedate", "");
    formData.append("sigcat", "");
    formData.append("comment1", "");
    formData.append("type", "capture");
    formData.append("limit", "");
    formData.append("pix", photoBase64);
    formData.append("photochange", "");
    formData.append("sigchange", signatureBase64);
    formData.append("relationid", relationNumber);
    formData.append("batchno", data.batchNumber);
    formData.append("customerno", "");
    formData.append("action", "add");

    // Make the API call with FormData
    const response = await fetch('http://10.203.14.169/imaging/savedata', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return { success: true, message: result };
  } catch (error) {
    console.error('Error in saveData:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Initialize fingerprint device
export const initFingerprint = async (): Promise<CaptureResponse> => {
  try {
    const response = await fetch('http://192.168.1.183:8080/init', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true, message: 'Fingerprint device initialized' };
  } catch (error) {
    console.error('Error initializing fingerprint device:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to initialize fingerprint device' 
    };
  }
};

// Capture fingerprint
export const captureFingerprint = async (relationNumber?: string): Promise<FingerprintResponse> => {
  try {
    const relationNo = relationNumber || getRelationNumber();
    
    const formData = new FormData();
    formData.append('relation_no', relationNo);

    const response = await fetch('http://192.168.1.183:8080/capture', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error capturing fingerprint:', error);
    return {
      response_code: -1,
      response_msg: error instanceof Error ? error.message : 'Failed to capture fingerprint'
    };
  }
};