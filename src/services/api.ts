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
      signature?: string;
      id?: string;
      fingerprint?: string;
    };
    unapproved?: {
      photo?: string;
      signature?: string;
      id?: string;
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Normalize response based on backend returning code 0 for success
    if (result.code === 0 || result === 0) {
      return {
        status: 'success',
        message: 'Image approved successfully',
        code: 0
      };
    } else {
      return {
        status: 'error',
        message: result.message || 'Failed to approve image'
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
export const rejectCustomerImages = async (relationno: string, reason: string): Promise<ApprovalResponse> => {
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