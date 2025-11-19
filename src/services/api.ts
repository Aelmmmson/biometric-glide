// API service for backend imaging system integration

export interface CaptureResponse {
  success: boolean;
  message?: string;
}

export interface IdCaptureResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface FingerprintResponse {
  response_code: number;
  response_msg: string;
  image?: string;
}

export interface DocumentData {
  type: 'national_id' | 'passport' | 'voter_id' | 'drivers_license' | string;
  sides: {
    front?: string;
    back?: string;
  };
}

export interface EnqDetail {
  relation_no: string;
  pix?: string;
  signature?: string;
  fingerprint_one?: string;
  fingerprint_two?: string;
  docs: DocumentData[];
}

export interface EnquiryData {
  account_mandate: string;
  enq_details: EnqDetail[];
}

export interface SearchImagesResponse {
  status: 'success' | 'error' | 'not_found';
  message: string;
  data?: {
    approved?: {
      photo?: string;
      accsign?: string;
      documents?: DocumentData[];
      thumbprint1?: string; // Right thumb
      thumbprint2?: string; // Left thumb
    };
    unapproved?: {
      photo?: string;
      accsign?: string;
      documents?: DocumentData[];
      thumbprint1?: string;
      thumbprint2?: string;
    };
  };
}

export interface EnquiryImagesResponse {
  status: 'success' | 'error' | 'not_found';
  message: string;
  data?: EnquiryData;
}

export interface ApprovalResponse {
  status: 'success' | 'error';
  message: string;
  code?: number;
}


// Activity configuration interfaces
export interface ActivityConfig {
  image: { id: number; status: boolean };
  identification: { id: number; status: boolean };
  fingerprint: { id: number; status: boolean };
}

export interface ActivityConfigResponse {
  success: boolean;
  data?: ActivityConfig;
  message?: string;
}

// Updated function to extract relation number from URL path for both capture and update modes
export const getRelationNumber = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/(capture|update)-(\d+)/);
  return match ? match[2] : '000001'; // Default fallback
};

// Extract customer ID from URL path like /viewimage-232
export const getCustomerId = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/viewimage-(\d+)/);
  return match ? match[1] : '000001'; // Default fallback
};

// Extract encrypted account ID from URL path like /getimagescred-ABC123XYZ
export const getEncryptedAccountId = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/getimagescred-([a-zA-Z0-9]+)/);
  return match ? match[1] : 'fallback-encrypted'; // Default fallback
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
    const relationNumber = cus_no || getRelationNumber();
    const base64Data = getBase64String(imageData);
    const typeStr = type;

    const formData = new FormData();
    formData.append("cus_no", relationNumber);
    formData.append("a", typeStr.toString());
    formData.append("imageData", imageData);

    if (type === 1) {
      formData.append("image", base64Data);
    } else if (type === 2) {
      formData.append("image", base64Data);
    }

    const response = await fetch('http://10.203.14.169/imaging/capture_browse', {
      method: 'POST',
      body: formData,
    });

    const contentType = response.headers.get('Content-Type');
    const responseText = await response.text();

    if (!response.ok) {
      console.error('captureBrowse server error:', responseText, 'Status:', response.status);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
    }

    if (responseText.trim() === 'Array ()') {
      console.warn('Received empty PHP array response, treating as empty JSON array');
      return {
        success: true,
        message: 'No data returned from server (empty array)'
      };
    }

    if (contentType?.includes('application/json')) {
      try {
        const result = JSON.parse(responseText);
        if (Array.isArray(result)) {
          const firstItem = result[0] || {};
          return {
            success: firstItem.success !== undefined ? firstItem.success : true,
            message: firstItem.message || 'Image processed successfully (array response)'
          };
        }
        return {
          success: result.success !== undefined ? result.success : true,
          message: result.message || 'Image processed successfully'
        };
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError, 'Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
    }

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

// Capture identification details
export const captureIdentification = async (
  documents: DocumentData[],
  cus_no?: string
): Promise<CaptureResponse> => {
  try {
    const relationNumber = cus_no || getRelationNumber();

    // Convert any base64 strings with data URL prefix to plain base64
    const processedDocuments = documents.map(doc => ({
      type: doc.type,
      sides: {
        front: doc.sides.front ? getBase64String(doc.sides.front) : undefined,
        back: doc.sides.back ? getBase64String(doc.sides.back) : undefined,
      },
    }));

    const payload = { documents: processedDocuments };

    const response = await fetch(
      `http://10.203.14.169/imaging/capture_id_details-${relationNumber}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const contentType = response.headers.get('Content-Type');
    const responseText = await response.text();

    if (!response.ok) {
      console.error('captureIdentification server error:', responseText, 'Status:', response.status);
      throw new Error(`HTTP error! status: ${response.status}, responseText}`);
    }

    if (responseText.trim() === 'Array ()') {
      return {
        success: true,
        message: 'No data returned from server (empty array)',
      };
    }

    let jsonResponse: IdCaptureResponse;
    try {
      const jsonStart = responseText.lastIndexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        jsonResponse = JSON.parse(responseText.substring(jsonStart, jsonEnd));
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError, 'Response text:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    if (jsonResponse.status === 'error') {
      return {
        success: false,
        message: jsonResponse.message || 'Failed to process identification',
      };
    }

    return {
      success: true,
      message: jsonResponse.message || 'Identification processed successfully',
    };
  } catch (error) {
    console.error('Error in captureIdentification:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to capture identification',
    };
  }
};

// Final submission for photo and signature
export const saveData = async (data: {
  photoData: string;
  signatureData: string;
  cus_no?: string;
  batchNumber: string;
  action?: 'add' | 'AMEND';
}): Promise<CaptureResponse> => {
  try {
    const relationNumber = data.cus_no || getRelationNumber();
    const photoBase64 = getBase64String(data.photoData);
    const signatureBase64 = getBase64String(data.signatureData);

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
    formData.append("action", data.action || "add");

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

// Wrapper for updating existing data
export const updateData = async (data: {
  photoData: string;
  signatureData: string;
  cus_no?: string;
  batchNumber: string;
}): Promise<CaptureResponse> => {
  return saveData({
    ...data,
    action: 'AMEND'
  });
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
// Capture thumbprint for specific thumb (1 or 2)
export const captureThumbprint = async (thumb: "1" | "2", relationNumber?: string): Promise<FingerprintResponse> => {
  try {
    const relationNo = relationNumber || getRelationNumber();
    
    const formData = new FormData();
    formData.append('relation_no', relationNo);
    formData.append('thumbprint', thumb);  // Payload: '1' for thumbprint 1 (right), '2' for thumbprint 2 (left)

    const response = await fetch('http://192.168.1.156:8080/capture', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error capturing thumbprint:', error);
    return {
      response_code: -1,
      response_msg: error instanceof Error ? error.message : 'Failed to capture thumbprint'
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

// Fetch customer images for enquiry phase
export const enquiryImages = async (customerId: string): Promise<EnquiryImagesResponse> => {
  try {
    const response = await fetch(`http://10.203.14.169/imaging/api/enquiry-${customerId}`, {
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
    console.error('Error in enquiryImages:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to retrieve images'
    };
  }
};

// Fetch relation details from encrypted account for new phase
export const viewRelationDetailsFromAccount = async (encryptedAcctNo: string): Promise<EnquiryImagesResponse> => {
  try {
    const response = await fetch(`http://10.203.14.169/imaging/api/view_relation_details-${encryptedAcctNo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'not_found',
          message: 'No images found for this account credential'
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
    console.error('Error in viewRelationDetailsFromAccount:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to retrieve images'
    };
  }
};

// Approve customer images - COMPREHENSIVE VERSION (handles both JSON and plain text)
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

    const contentType = response.headers.get('Content-Type');
    const responseText = await response.text();

    console.log('Approval response:', { contentType, responseText });

    const cleanResponse = responseText.trim().toLowerCase();
    
    if (cleanResponse === '1' || cleanResponse === 'success') {
      return {
        status: 'success',
        message: 'Image approved successfully',
        code: 0
      };
    }

    if (!contentType?.includes('application/json')) {
      if (cleanResponse.includes('success') || cleanResponse === '1') {
        return {
          status: 'success',
          message: 'Image approved successfully',
          code: 0
        };
      }
      
      if (cleanResponse.includes('error') || cleanResponse.includes('fail')) {
        return {
          status: 'error',
          message: responseText || 'Approval failed'
        };
      }

      return {
        status: 'error',
        message: `Unexpected response: ${responseText}`
      };
    }

    try {
      const result = JSON.parse(responseText);
      if (result.code === 0 || result.status === 'success') {
        return {
          status: 'success',
          message: result.message || 'Image approved successfully',
          code: result.code || 0
        };
      } else {
        return {
          status: 'error',
          message: result.message || 'Failed to approve image'
        };
      }
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError, 'Response text:', responseText);
      
      if (responseText.toLowerCase().includes('success') || responseText === '1') {
        return {
          status: 'success',
          message: 'Image approved successfully',
          code: 0
        };
      }
      
      return {
        status: 'error',
        message: 'Invalid response format from server'
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


// === NEW: Fetch activity configuration to control enabled steps ===
export const fetchActivityConfig = async (): Promise<ActivityConfigResponse> => {
  try {
    const response = await fetch('http://10.203.14.169/imaging/api/activities', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    if (result && result.image && result.identification && result.fingerprint) {
      return { success: true, data: result as ActivityConfig };
    }

    console.warn('Unexpected activities response format:', result);
    return { success: true, data: getDefaultActivityConfig() };
  } catch (error) {
    console.error('Failed to fetch activity config:', error);
    return { success: true, data: getDefaultActivityConfig() }; // safe fallback
  }
};

// Fallback when API fails or is unreachable
const getDefaultActivityConfig = (): ActivityConfig => ({
  image: { id: 4, status: true },
  identification: { id: 5, status: true },
  fingerprint: { id: 6, status: true },
});