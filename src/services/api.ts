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

export interface SearchImagesResponse {
  status: 'success' | 'error' | 'not_found';
  message: string;
  data?: {
    approved?: {
      photo?: string;
      accsign?: string;
      id?: string;
      id_front?: string;
      id_back?: string;
      fingerprint?: string;
    };
    unapproved?: {
      photo?: string;
      accsign?: string;
      id?: string;
      id_front?: string;
      id_back?: string;
      fingerprint?: string;
    };
  };
}

export interface ApprovalResponse {
  status: 'success' | 'error';
  message: string;
  code?: number;
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
  type: number, // 1 for photo, 2 for signature
  cus_no?: string
): Promise<CaptureResponse> => {
  try {

    // console.log("Starting captureBrowse...",getRelationNumber());
    const relationNumber = cus_no || getRelationNumber();
    const base64Data = getBase64String(imageData);
    const typeStr = type;

    // Log request payload for debugging
    // console.log('captureBrowse request payload:', {
    //   imageData: base64Data.slice(0, 50) + '...', // Truncate for readability
    //   typeStr,
    //   cus_no: relationNumber,
    // });

    // Create FormData to match server expectations
    const formData = new FormData();
    
    // Common fields similar to saveData
    formData.append("cus_no", relationNumber);
    formData.append("a", typeStr.toString());
    formData.append("imageData", imageData);

    // Append image based on type
    if (type === 1) {
      // Photo
      formData.append("image", base64Data);
    } else if (type === 2) {
      // Signature
      formData.append("image", base64Data);
    }

    const response = await fetch('http://10.203.14.169/imaging/capture_browse', {
      method: 'POST',
      body: formData, // Send as FormData
    });

    const contentType = response.headers.get('Content-Type');
    const responseText = await response.text();

    // Log response details
    // console.log('captureBrowse response:', {
    //   status: response.status,
    //   contentType,
    //   responseText,
    // });

    if (!response.ok) {
      console.error('captureBrowse server error:', responseText, 'Status:', response.status);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
    }

    // Handle PHP-style "Array ()" response
    if (responseText.trim() === 'Array ()') {
      console.warn('Received empty PHP array response, treating as empty JSON array');
      return {
        success: true, // Assume success for empty array, adjust based on server behavior
        message: 'No data returned from server (empty array)'
      };
    }

    // Check if response is JSON
    if (contentType?.includes('application/json')) {
      try {
        const result = JSON.parse(responseText);
        // Handle array response
        if (Array.isArray(result)) {
          const firstItem = result[0] || {};
          return {
            success: firstItem.success !== undefined ? firstItem.success : true,
            message: firstItem.message || 'Image processed successfully (array response)'
          };
        }
        // Handle object response
        return {
          success: result.success !== undefined ? result.success : true,
          message: result.message || 'Image processed successfully'
        };
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError, 'Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
    }

    // Handle non-JSON response
    console.warn('Non-JSON response received:', responseText);
    return {
      success: responseText.toLowerCase().includes('success'),
      message: responseText || 'Non-JSON response received from server'
    };

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
  cus_no?: string;
  batchNumber: string; // Added to match NextJS api.ts
}): Promise<CaptureResponse> => {
  try {
    const relationNumber = data.cus_no || getRelationNumber();
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
    const response = await fetch('http://192.168.1.156:8080/init', {
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

    const response = await fetch('http://192.168.1.156:8080/capture', {
      method: 'POST',
      body: formData,
    });

    // console.log('Fingerprint capture response status:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    

    const result = await response.json();
    // console.log('Fingerprint capture response status:', result);
    return result;
  } catch (error) {
    console.error('Error capturing fingerprint:', error);
    return {
      response_code: -1,
      response_msg: error instanceof Error ? error.message : 'Failed to capture fingerprint'
    };
  }
};

// Search for customer images (approval phase)
export const searchImages = async (relationno: string): Promise<SearchImagesResponse> => {
  try {
    const response = await fetch(`http://10.203.14.169/imaging/get_temp_image-${relationno}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'not_found',
          message: 'No images found for this customer'
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      status: 'success',
      message: 'Images retrieved successfully',
      data: result
    };
  } catch (error) {
    console.error('Error searching images:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to search images'
    };
  }
};

// Approve customer images
export const approveCustomerImages = async (params: {
  relationno: string;
  batch: string;
  custno: string;
  approved_by: string;
  hostname: string;
  terminal_ip: string;
}): Promise<ApprovalResponse> => {
  try {
    const { relationno, batch, custno, approved_by, hostname, terminal_ip } = params;
    
    const response = await fetch(
      `http://10.203.14.169/imaging/api/approve_image-${relationno}-${batch}-${custno}-${approved_by}-${hostname}-${terminal_ip}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    // console.log('Approve images response:',response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // const result = await response.json();
    const result = response;
    // console.log('Approve images result:',result);
    // Normalize response based on backend returning code 0 for success
    if (result.status === 200) {
      return {
        status: 'success',
        message: 'Image approved successfully',
        code: 0
      };
    } else {
      return {
        status: 'error',
        message: result.statusText || 'Failed to approve image'
      };
    }
  } catch (error) {
    console.error('Error approving images:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to approve images'
    };
  }
};

// Simulate rejection (placeholder)
export const rejectCustomerImages = async (relationno: string, reason: string, imageTypes: string[]): Promise<ApprovalResponse> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'success',
      message: 'Image rejected successfully'
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to reject image'
    };
  }
};

// Extract URL parameters for approval phase
export const getApprovalParams = (): {
  relationno?: string;
  batch?: string;
  custno?: string;
  approved_by?: string;
  hostname?: string;
  terminal_ip?: string;
} => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    relationno: urlParams.get('relationno') || undefined,
    batch: urlParams.get('batch') || undefined,
    custno: urlParams.get('custno') || undefined,
    approved_by: urlParams.get('approved_by') || undefined,
    hostname: urlParams.get('hostname') || undefined,
    terminal_ip: urlParams.get('terminal_ip') || undefined,
  };
};