// API service for backend imaging system integration
import { handleSystemError } from '@/lib/errorHandler';

const getBaseUrl = () => {
  // Always use the proxy path in development to ensure consistent behavior
  // and avoid CORS issues. The Vite proxy handles routing to the correct backend IP.
  return '/legacy-imaging';
};

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
  limit?: number;
  sign_category?: string;
  docs: DocumentData[];
  relation_name?: string;
}

export interface EnquiryData {
  account_mandate: string;
  enq_details: EnqDetail[];
  account_name?: string;
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
      limit?: string;
      mandate?: string;
    };
    unapproved?: {
      photo?: string;
      accsign?: string;
      documents?: DocumentData[];
      thumbprint1?: string;
      thumbprint2?: string;
      limit?: string;
      mandate?: string;
    };
    name?: string;
    relation_no?: string;
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

export interface ChequeDetailResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    [x: string]: string;
    instrumentCode: string;
    rejectionReason: string;
    chequeNo: string;
    chequeStatus: string;
    payerBban: string;
    payerName: string;
    beneficiaryBban: string;
    beneficiaryName: string;
    chequeAmount: string;
    clearingDate: string;
    transCurrency: string;
    remittingParticipant: string;
    recepientParticipant: string;
    frontImage: string | null;
    backImage: string | null;
  };
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

export interface BiometricParams {
  relationNo?: string;
  custNo?: string;
  batch?: string;
  mandate?: string;
  limit?: string;
  capturedBy?: string;
  capturedDate?: string;
  approvedBy?: string;
  hostname?: string;
  terminalIp?: string;
}

/**
 * Parses parameters from the URL based on the strict patterns defined in .htaccess.
 * capture-([0-9a-zA-Z]+)-([0-9a-zA-Z_-]+)-([0-9]{4}-[0-9]{2}-[0-9]{2})
 * update-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-zA-Z_.]+)-([0-9a-zA-Z_-]+)-([0-9]{4}-[0-9]{2}-[0-9]{2})
 * image_approval_screen-([0-9a-zA-Z]+)-([0-9a-zA-Z]+)-([0-9a-zA-Z]+)-([0-9a-zA-Z_.]+)-([0-9a-zA-Z_-]+)-([0-9.]{7,15})
 */

const isValidDate = (dateString: string): boolean => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;  // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
};

export const parseBiometricParams = (currentPath?: string): { action: string; params: BiometricParams } | null => {
  const path = currentPath || window.location.pathname;
  
  // Capture Pattern: strict match at the end
  const captureMatch = path.match(/\/capture-([0-9a-zA-Z]+)-([0-9a-zA-Z_.-]+)-([0-9a-zA-Z_-]+)-([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
  if (captureMatch) {
    const dateStr = captureMatch[4];
    if (!isValidDate(dateStr)) return null;

    return {
      action: 'capture',
      params: {
        relationNo: captureMatch[1],
        batch: captureMatch[2],
        capturedBy: captureMatch[3],
        capturedDate: dateStr
      }
    };
  }

  // Update Pattern: strict match at the end
  const updateMatch = path.match(/\/update-([0-9a-zA-Z]*)-([0-9a-zA-Z]*)-([0-9a-zA-Z]*)-([0-9a-zA-Z_.]*)-([0-9a-zA-Z_-]*)-([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
  if (updateMatch) {
    const dateStr = updateMatch[6];
    if (!isValidDate(dateStr)) return null;

    return {
      action: 'update',
      params: {
        custNo: updateMatch[1],
        batch: updateMatch[2],
        mandate: updateMatch[3],
        limit: updateMatch[4],
        capturedBy: updateMatch[5],
        capturedDate: dateStr,
        relationNo: updateMatch[1]
      }
    };
  }

  // Approval Pattern: strict match at the end
  const approvalMatch = path.match(/\/image_approval_screen-([0-9a-zA-Z]+)-([0-9a-zA-Z]*)-([0-9a-zA-Z]+)-([0-9a-zA-Z_.]+)-([0-9a-zA-Z_-]+)-([0-9.]{7,15})$/);
  if (approvalMatch) {
    return {
      action: 'approval',
      params: {
        relationNo: approvalMatch[1],
        batch: approvalMatch[2],
        custNo: approvalMatch[3],
        approvedBy: approvalMatch[4],
        hostname: approvalMatch[5],
        terminalIp: approvalMatch[6]
      }
    };
  }

  return null;
};

// Updated function to extract relation number from URL path
export const getRelationNumber = (): string => {
  const parsed = parseBiometricParams();
  return parsed?.params.relationNo || '000001';
};

// Extract customer ID from URL path like /viewimage-232
export const getCustomerId = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/viewimage-([a-zA-Z0-9]+)/);
  return match ? match[1] : '000001';
};

// Extract encrypted account ID from URL path like /getimagescred-ABC123XYZ
export const getEncryptedAccountId = (): string => {
  const path = window.location.pathname;
  const match = path.match(/\/getimagescred-([a-zA-Z0-9]+)/);
  return match ? match[1] : 'fallback-encrypted';
};

// Convert image data to base64 string (remove data:image/... prefix if present)
const getBase64String = (imageData: string): string => {
  if (imageData.startsWith('data:')) {
    return imageData.split(',')[1];
  }
  return imageData;
};

// Helper functions for Standalone Local Storage operations
export interface StandaloneAccount {
  accountNumber: string;
  mandate: string;
  accountName: string;
}

export interface StandaloneRelation {
  accountNumber: string;
  relationNo: string;
  firstName: string;
  otherName?: string;
  surname: string;
  amtlimit?: number;
  signatoryLevel: string;
  photoCaptured?: boolean;
  signatureCaptured?: boolean;
  idCaptured?: boolean;
  fingerprintCaptured?: boolean;
  isApproved?: boolean;
  nationalId: string;
  isTemp?: boolean;
}

export const isStandaloneRelation = (relationNo: string): boolean => {
  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '::' ||
    window.location.hostname.includes('localhost')
  );
  if (isDev || relationNo === '000001') return true;

  const relsJson = localStorage.getItem('standalone_relations');
  if (!relsJson) return false;
  const rels = JSON.parse(relsJson);
  return !!rels[relationNo];
};

export const isStandaloneAccount = (accountNo: string): boolean => {
  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '::' ||
    window.location.hostname.includes('localhost')
  );
  if (isDev || accountNo === '000001') return true;

  const accsJson = localStorage.getItem('standalone_accounts');
  if (!accsJson) return false;
  const accs = JSON.parse(accsJson);
  const cleanAcc = accountNo.replace(/\D/g, '');
  return !!(accs[accountNo] || accs[cleanAcc]);
};

export const updateRelationCaptureStatus = (
  relationNo: string,
  field: 'photo' | 'signature' | 'id' | 'fingerprint',
  val: boolean
) => {
  const relsJson = localStorage.getItem('standalone_relations');
  if (relsJson) {
    const rels = JSON.parse(relsJson);
    if (rels[relationNo]) {
      if (field === 'photo') rels[relationNo].photoCaptured = val;
      if (field === 'signature') rels[relationNo].signatureCaptured = val;
      if (field === 'id') rels[relationNo].idCaptured = val;
      if (field === 'fingerprint') rels[relationNo].fingerprintCaptured = val;
      localStorage.setItem('standalone_relations', JSON.stringify(rels));
    }
  }
};

export const getStandaloneAccountDetails = (accountNumber: string) => {
  const relsJson = localStorage.getItem('standalone_relations');
  const accountsJson = localStorage.getItem('standalone_accounts');
  if (accountsJson && relsJson) {
    const accounts = JSON.parse(accountsJson);
    const rels = JSON.parse(relsJson);
    const rawAccount = accountNumber.replace(/\D/g, '');
    const acc = accounts[accountNumber] || accounts[rawAccount] || Object.values(accounts).find((a: StandaloneAccount) => a.accountNumber === accountNumber || a.accountNumber.replace(/\D/g, '') === rawAccount);
    
    if (acc) {
      const enq_details: EnqDetail[] = [];
      const accRelations = (Object.values(rels) as StandaloneRelation[]).filter((r: StandaloneRelation) => r.accountNumber === acc.accountNumber);
      
      for (const rel of accRelations) {
        const rId = rel.relationNo;
        const biometricsJson = localStorage.getItem(`standalone_biometrics_${rId}`);
        const biometrics = biometricsJson ? JSON.parse(biometricsJson) : {};
        enq_details.push({
          relation_no: rId,
          relation_name: `${rel.firstName} ${rel.otherName ? rel.otherName + ' ' : ''}${rel.surname}`.trim(),
          pix: biometrics.photo || undefined,
          signature: biometrics.signature || undefined,
          fingerprint_one: biometrics.thumbprint1 || undefined,
          fingerprint_two: biometrics.thumbprint2 || undefined,
          limit: rel.amtlimit,
          sign_category: rel.signatoryLevel,
          docs: (biometrics.idFront || biometrics.idBack) ? [
            {
              type: 'national_id',
              sides: {
                front: biometrics.idFront || undefined,
                back: biometrics.idBack || undefined
              }
            }
          ] : []
        });
      }
      return {
        account_name: acc.accountName,
        account_mandate: acc.mandate,
        enq_details
      };
    }
  }
  return null;
};

// Immediate save for photo/signature captures
export const captureBrowse = async (
  imageData: string, 
  type: number, // 1 for photo, 2 for signature
  cus_no?: string
): Promise<CaptureResponse> => {
  const relationNumber = cus_no || getRelationNumber();
  const base64Data = getBase64String(imageData);
  
  // Standalone: cache local data
  const cached = localStorage.getItem(`standalone_biometrics_${relationNumber}`);
  const bioData = cached ? JSON.parse(cached) : {};
  if (type === 1) bioData.photo = base64Data;
  else if (type === 2) bioData.signature = base64Data;
  localStorage.setItem(`standalone_biometrics_${relationNumber}`, JSON.stringify(bioData));
  
  updateRelationCaptureStatus(relationNumber, type === 1 ? 'photo' : 'signature', true);

  try {
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

    const response = await fetch(`${getBaseUrl()}/capture_browse`, {
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
    const uiError = handleSystemError(error, 'api.captureBrowse');
    if (isStandaloneRelation(relationNumber)) {
      return { success: true, message: 'Saved locally in standalone mode' };
    }
    return { 
      success: false, 
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Prefetch captured images from the server if they exist (for persistence on refresh)
export const prefetchCapturedImages = async (relationNo: string): Promise<{ photo?: string; signature?: string }> => {
  const result: { photo?: string; signature?: string } = {};
  const baseUrl = `${getBaseUrl()}/captured`;

  try {
    // Check for photo
    const photoRes = await fetch(`${baseUrl}/p${relationNo}.jpg`, { method: 'HEAD' });
    if (photoRes.ok) {
      const blob = await fetch(`${baseUrl}/p${relationNo}.jpg`).then(r => r.blob());
      result.photo = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    // Check for signature
    const sigRes = await fetch(`${baseUrl}/s${relationNo}.jpg`, { method: 'HEAD' });
    if (sigRes.ok) {
      const blob = await fetch(`${baseUrl}/s${relationNo}.jpg`).then(r => r.blob());
      result.signature = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.warn('Failed to prefetch images:', error);
  }

  return result;
};

// Capture identification details
export const captureIdentification = async (
  documents: DocumentData[],
  cus_no?: string
): Promise<CaptureResponse> => {
  const relationNumber = cus_no || getRelationNumber();
  
  // Standalone cache
  const cached = localStorage.getItem(`standalone_biometrics_${relationNumber}`);
  const bioData = cached ? JSON.parse(cached) : {};
  if (documents && documents.length > 0) {
    if (documents[0].sides.front) bioData.idFront = getBase64String(documents[0].sides.front);
    if (documents[0].sides.back) bioData.idBack = getBase64String(documents[0].sides.back);
    localStorage.setItem(`standalone_biometrics_${relationNumber}`, JSON.stringify(bioData));
    updateRelationCaptureStatus(relationNumber, 'id', true);
  }

  try {
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
      `${getBaseUrl()}/capture_id_details-${relationNumber}`,
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
    const uiError = handleSystemError(error, 'api.captureIdentification');
    if (isStandaloneRelation(relationNumber)) {
      return {
        success: true,
        message: 'Saved locally in standalone mode',
      };
    }
    return {
      success: false,
      message: `${uiError.alert} ${uiError.action}`,
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
  capturedBy?: string;
  capturedDate?: string;
  limit?: string;
  mandate?: string;
  signname?: string;
  comment?: string;
}): Promise<CaptureResponse> => {
  const relationNumber = data.cus_no || getRelationNumber();
  const photoBase64 = getBase64String(data.photoData);
  const signatureBase64 = getBase64String(data.signatureData);

  // Standalone cache
  const cached = localStorage.getItem(`standalone_biometrics_${relationNumber}`);
  const bioData = cached ? JSON.parse(cached) : {};
  if (photoBase64) bioData.photo = photoBase64;
  if (signatureBase64) bioData.signature = signatureBase64;
  localStorage.setItem(`standalone_biometrics_${relationNumber}`, JSON.stringify(bioData));

  updateRelationCaptureStatus(relationNumber, 'photo', true);
  updateRelationCaptureStatus(relationNumber, 'signature', true);

  try {
    const formData = new FormData();
    formData.append("accno", "");
    formData.append("signname", data.signname || "");
    formData.append("id", "");
    formData.append("expirydate", "");
    formData.append("effectivedate", "");
    formData.append("sigcat", data.mandate || "");
    formData.append("comment1", data.comment || "");
    formData.append("type", data.action === 'AMEND' ? "capture" : "capture");
    formData.append("limit", data.limit || "");
    formData.append("pix", photoBase64);
    formData.append("photochange", "");
    formData.append("sigchange", signatureBase64);
    formData.append("relationid", relationNumber);
    formData.append("batchno", data.batchNumber);
    formData.append("customerno", data.cus_no || "");
    formData.append("action", data.action || "add");
    formData.append("capturedBy", data.capturedBy || "");
    formData.append("capturedDate", data.capturedDate || "");

    const endpoint = data.action === 'AMEND' ? 'saveupdate' : 'savedata';
    const response = await fetch(`${getBaseUrl()}/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return { success: true, message: result };
  } catch (error) {
    const uiError = handleSystemError(error, 'api.saveData');
    if (isStandaloneRelation(relationNumber)) {
      return { success: true, message: 'Saved locally in standalone mode' };
    }
    return { 
      success: false, 
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Wrapper for updating existing data
export const updateData = async (data: {
  photoData: string;
  signatureData: string;
  cus_no?: string;
  batchNumber: string;
  capturedBy?: string;
  capturedDate?: string;
  limit?: string;
  mandate?: string;
}): Promise<CaptureResponse> => {
  return saveData({
    ...data,
    action: 'AMEND'
  });
};

// Initialize fingerprint device
export const initFingerprint = async (): Promise<CaptureResponse> => {
  try {
    const response = await fetch('http://192.168.1.142:8080/init', {
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
    const uiError = handleSystemError(error, 'api.initFingerprint');
    return { 
      success: false, 
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Capture fingerprint
// Capture thumbprint for specific thumb (1 or 2)
export const captureThumbprint = async (thumb: "1" | "2", relationNumber?: string): Promise<FingerprintResponse> => {
  const relationNo = relationNumber || getRelationNumber();
  
  // Standalone cache with generic placeholder fingerprint
  const cached = localStorage.getItem(`standalone_biometrics_${relationNo}`);
  const bioData = cached ? JSON.parse(cached) : {};
  const mockFp = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  if (thumb === "1") bioData.thumbprint1 = mockFp;
  if (thumb === "2") bioData.thumbprint2 = mockFp;
  localStorage.setItem(`standalone_biometrics_${relationNo}`, JSON.stringify(bioData));
  updateRelationCaptureStatus(relationNo, 'fingerprint', true);

  try {
    const formData = new FormData();
    formData.append('relation_no', relationNo);
    formData.append('thumbprint', thumb);  // Payload: '1' for thumbprint 1 (right), '2' for thumbprint 2 (left)

    const response = await fetch('http://192.168.1.142:8080/capture', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    const uiError = handleSystemError(error, 'api.captureThumbprint');
    if (isStandaloneRelation(relationNo)) {
      return {
        response_code: 0,
        response_msg: 'Captured locally in standalone mode',
        image: mockFp
      };
    }
    return {
      response_code: -1,
      response_msg: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Search for customer images (approval phase)
export const searchImages = async (relationno: string): Promise<SearchImagesResponse> => {
  try {
    let localData: any = null;
    let rel: any = null;
    let acc: any = null;

    if (isStandaloneRelation(relationno)) {
      const relsJson = localStorage.getItem('standalone_relations');
      const accountsJson = localStorage.getItem('standalone_accounts');
      if (relsJson && accountsJson) {
        const rels = JSON.parse(relsJson);
        const accounts = JSON.parse(accountsJson);
        rel = rels[relationno];
        if (rel) {
          acc = accounts[rel.accountNumber];
          const biometricsJson = localStorage.getItem(`standalone_biometrics_${relationno}`);
          localData = biometricsJson ? JSON.parse(biometricsJson) : {};
        }
      }
    }

    // Try to fetch from backend as fallback/sync
    let backendData: any = null;
    try {
      const response = await fetch(`${getBaseUrl()}/get_temp_image-${relationno}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result && (result.approved || result.unapproved)) {
          backendData = result;
        }
      }
    } catch (e) {
      console.warn('Backend fetch failed in searchImages:', e);
    }

    if (rel) {
      const biometrics = localData || {};
      const approved = backendData?.approved || {};
      const unapproved = backendData?.unapproved || {};

      const photo = biometrics.photo || unapproved.photo || approved.photo || undefined;
      const signature = biometrics.signature || unapproved.accsign || approved.accsign || undefined;
      const thumbprint1 = biometrics.thumbprint1 || unapproved.thumbprint1 || approved.thumbprint1 || undefined;
      const thumbprint2 = biometrics.thumbprint2 || unapproved.thumbprint2 || approved.thumbprint2 || undefined;

      const apiDocFront = unapproved.documents?.[0]?.sides?.front || approved.documents?.[0]?.sides?.front;
      const apiDocBack = unapproved.documents?.[0]?.sides?.back || approved.documents?.[0]?.sides?.back;
      const idFront = biometrics.idFront || apiDocFront || undefined;
      const idBack = biometrics.idBack || apiDocBack || undefined;

      // Update local storage cache
      const updatedBio = {
        ...biometrics,
        photo: photo || null,
        signature: signature || null,
        thumbprint1: thumbprint1 || null,
        thumbprint2: thumbprint2 || null,
        idFront: idFront || null,
        idBack: idBack || null,
      };
      localStorage.setItem(`standalone_biometrics_${relationno}`, JSON.stringify(updatedBio));

      // Update relation status
      let statusChanged = false;
      if (photo && !rel.photoCaptured) { rel.photoCaptured = true; statusChanged = true; }
      if (signature && !rel.signatureCaptured) { rel.signatureCaptured = true; statusChanged = true; }
      if ((idFront || idBack) && !rel.idCaptured) { rel.idCaptured = true; statusChanged = true; }
      if ((thumbprint1 || thumbprint2) && !rel.fingerprintCaptured) { rel.fingerprintCaptured = true; statusChanged = true; }

      if (statusChanged) {
        const relsJson = localStorage.getItem('standalone_relations');
        if (relsJson) {
          const rels = JSON.parse(relsJson);
          if (rels[relationno]) {
            rels[relationno] = { ...rels[relationno], ...rel };
            localStorage.setItem('standalone_relations', JSON.stringify(rels));
          }
        }
      }

      const payload: Record<string, unknown> = {
        photo,
        accsign: signature,
        thumbprint1,
        thumbprint2,
        limit: rel.amtlimit?.toString(),
        mandate: acc?.mandate,
        documents: (idFront || idBack) ? [
          {
            type: 'national_id',
            sides: {
              front: idFront,
              back: idBack
            }
          }
        ] : []
      };

      const emptyBucket = {
        photo: '',
        accsign: '',
        thumbprint1: '',
        thumbprint2: '',
        documents: [] as DocumentData[],
        limit: '',
        mandate: ''
      };

      return {
        status: 'success',
        message: 'Images retrieved and synced',
        data: {
          name: `${rel.firstName} ${rel.otherName || ''} ${rel.surname}`.trim(),
          relation_no: relationno,
          approved: rel.isApproved ? payload : emptyBucket,
          unapproved: !rel.isApproved ? payload : emptyBucket
        }
      };
    }
   
    const response = await fetch(`${getBaseUrl()}/get_temp_image-${relationno}`, {
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
    const uiError = handleSystemError(error, 'api.searchImages');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Fetch customer images for enquiry phase
export const enquiryImages = async (customerId: string): Promise<EnquiryImagesResponse> => {
  try {
    if (isStandaloneRelation(customerId)) {
      try {
        await searchImages(customerId);
      } catch (e) {
        console.warn('searchImages sync failed inside enquiryImages:', e);
      }
      const relsJson = localStorage.getItem('standalone_relations');
      const accountsJson = localStorage.getItem('standalone_accounts');
      if (relsJson && accountsJson) {
        const rels = JSON.parse(relsJson);
        const accounts = JSON.parse(accountsJson);
        const rel = rels[customerId];
        if (rel) {
          const acc = accounts[rel.accountNumber];
          const biometricsJson = localStorage.getItem(`standalone_biometrics_${customerId}`);
          const biometrics = biometricsJson ? JSON.parse(biometricsJson) : {};
          
          return {
            status: 'success',
            message: 'Images retrieved from standalone store',
            data: {
              account_name: acc?.accountName || 'Unknown Account',
              account_mandate: acc?.mandate || 'SOLE SIGNATORY',
              enq_details: [
                {
                  relation_no: customerId,
                  relation_name: `${rel.firstName} ${rel.otherName ? rel.otherName + ' ' : ''}${rel.surname}`.trim(),
                  pix: biometrics.photo || undefined,
                  signature: biometrics.signature || undefined,
                  fingerprint_one: biometrics.thumbprint1 || undefined,
                  fingerprint_two: biometrics.thumbprint2 || undefined,
                  limit: rel.amtlimit,
                  sign_category: rel.signatoryLevel,
                  docs: (biometrics.idFront || biometrics.idBack) ? [
                    {
                      type: 'national_id',
                      sides: {
                        front: biometrics.idFront || undefined,
                        back: biometrics.idBack || undefined
                      }
                    }
                  ] : []
                }
              ]
            }
          };
        }
      }
    }

    const response = await fetch(`${getBaseUrl()}/api/view_relation_details-${customerId}`, {
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
    const uiError = handleSystemError(error, 'api.enquiryImages');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// NEW: Fetch images by plain account number (non-encrypted) via cash_enquiry endpoint
export const getImagesByAccount = async (account: string): Promise<EnquiryImagesResponse> => {
  try {
    const standaloneDetails = getStandaloneAccountDetails(account);
    if (standaloneDetails) {
      return {
        status: 'success',
        message: 'Images retrieved from standalone store',
        data: standaloneDetails
      };
    }

    const response = await fetch(`${getBaseUrl()}/api/cash_enquiry-${account}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'not_found',
          message: 'No images found for this account'
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
    const uiError = handleSystemError(error, 'api.getImagesByAccount');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Fetch relation details from encrypted account for new phase
export const viewRelationDetailsFromAccount = async (encryptedAcctNo: string): Promise<EnquiryImagesResponse> => {
  try {
    const standaloneDetails = getStandaloneAccountDetails(encryptedAcctNo);
    if (standaloneDetails) {
      return {
        status: 'success',
        message: 'Images retrieved from standalone store',
        data: standaloneDetails
      };
    }

    const response = await fetch(`${getBaseUrl()}/api/enquiry-${encryptedAcctNo}`, {
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
    const uiError = handleSystemError(error, 'api.viewRelationDetailsFromAccount');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// NEW: Fetch cheque details by parsing the HTML from the PHP view page
export const getChequeDetails = async (chequeNumber: string): Promise<ChequeDetailResponse> => {
  try {
    // We use a Vite proxy just for localhost because the original view_cheques.php lacks CORS headers
    // In production, we assume it's running behind the same origin or intranet without CORS enforcement
    const response = await fetch(`${getBaseUrl()}/view_cheques-${chequeNumber}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // In view_cheques.php, the Cheque details are laid out in a table format:
    // <tr><td>Field Name</td>...<td>:</td><td>Value</td></tr>
    // We search the document for the td matching the label, then traverse to find the corresponding value td.
    const tds = Array.from(doc.querySelectorAll('td'));
    const extractFieldValue = (label: string): string => {
        const exactMatchLabel = `${label}`;
        const labelTd = tds.find(td => td.textContent?.trim() === exactMatchLabel);
        if (labelTd) {
            // It's usually Label -> div spacer -> ':' -> value
            // Safe traversal: find next sibling td that contains text content that isn't ':' or empty spaces
            let next = labelTd.nextElementSibling;
            
            // Advance through spacer td and colon td
            if (next && next.querySelector('div')) {
                next = next.nextElementSibling; 
            }
            if (next && next.textContent?.trim() === ':') {
                next = next.nextElementSibling;
            }
            // If the structure matches:
            if (next) {
                return next.textContent?.trim() || '';
            }
        }
        return '';
    };

    // Extract images (src="data:image/...")
    const images = Array.from(doc.querySelectorAll('img[src^="data:image"]')) as HTMLImageElement[];
    const frontImage = images.length > 0 ? images[0].src : null;
    const backImage = images.length > 1 ? images[1].src : null;

    // Check if the page didn't actually return a cheque (e.g., fields are empty and no images).
    const chequeNo = extractFieldValue('Cheque No');
    if (!chequeNo && !frontImage) {
        return {
          status: 'error',
          message: 'Cheque record not found.',
        };
    }

    return {
      status: 'success',
      message: 'Cheque details retrieved successfully',
      data: {
        instrumentCode: extractFieldValue('Instrument Code'),
        rejectionReason: extractFieldValue('Rejection Reason'),
        chequeNo: extractFieldValue('Cheque No'),
        chequeStatus: extractFieldValue('Cheque Status'),
        payerBban: extractFieldValue('Payer BBAN'),
        payerName: extractFieldValue('Payer Name'),
        beneficiaryBban: extractFieldValue('Beneficiary BBAN'),
        beneficiaryName: extractFieldValue('Beneficiary Name'),
        chequeAmount: extractFieldValue('Cheque Amount'),
        clearingDate: extractFieldValue('Clearing Date'),
        transCurrency: extractFieldValue('Trans_Currency') || extractFieldValue('Trans Currency') || '010',
        remittingParticipant: extractFieldValue('Remitting_Participant'),
        recepientParticipant: extractFieldValue('Recepient_Participant'),
        frontImage,
        backImage
      }
    };

  } catch (error) {
    const uiError = handleSystemError(error, 'api.getChequeDetails');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

export interface AccountSignatureResponse {
  approved: Array<{
    photo: string;
    signature: string;
  }>;
}

// NEW: Fetch account signature by account number (Core Protocol - No Decryption)
export const getAccountSignatures = async (accountNumber: string): Promise<EnquiryData | null> => {
  try {
    const standaloneDetails = getStandaloneAccountDetails(accountNumber);
    if (standaloneDetails) {
      return standaloneDetails;
    }

    const rawAccount = accountNumber.replace(/\D/g, '');
    console.log(`[Protocol] Fetching signatures for sanitized account: ${rawAccount} (raw input: "${accountNumber}")`);
    const response = await fetch(`${getBaseUrl()}/api/core_enquiry-${rawAccount}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // System Security Headers for Core Access
        'X-API-KEY': '20171411891',
        'X-API-SECRET': '141116517P'
      },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleSystemError(error, 'api.getAccountSignatures');
    return null;
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
  posting_date?: string;
}): Promise<ApprovalResponse> => {
  try {
    const { relationno, batch, custno, approved_by, hostname, terminal_ip, posting_date } = params;
    
    if (isStandaloneRelation(relationno)) {
      const relsJson = localStorage.getItem('standalone_relations');
      if (relsJson) {
        const rels = JSON.parse(relsJson);
        if (rels[relationno]) {
          rels[relationno].isApproved = true;
          localStorage.setItem('standalone_relations', JSON.stringify(rels));
        }
      }
      return {
        status: 'success',
        message: 'Image approved successfully (standalone)',
        code: 0
      };
    }

    let url = `${getBaseUrl()}/api/approve_image-${relationno}-${batch}-${custno}-${approved_by}-${hostname}-${terminal_ip}`;
    if (posting_date) {
      url += `-${posting_date}`;
    }
    
    const response = await fetch(url, {
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
    const uiError = handleSystemError(error, 'api.approveCustomerImages');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
    };
  }
};

// Simulate rejection (placeholder)
export const rejectCustomerImages = async (relationno: string, reason: string, imageTypes: string[]): Promise<ApprovalResponse> => {
  try {
    if (isStandaloneRelation(relationno)) {
      const relsJson = localStorage.getItem('standalone_relations');
      if (relsJson) {
        const rels = JSON.parse(relsJson);
        if (rels[relationno]) {
          rels[relationno].isApproved = false;
          if (imageTypes.includes('photo')) rels[relationno].photoCaptured = false;
          if (imageTypes.includes('signature')) rels[relationno].signatureCaptured = false;
          localStorage.setItem('standalone_relations', JSON.stringify(rels));
        }
      }
      return {
        status: 'success',
        message: 'Image rejected successfully (standalone)'
      };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'success',
      message: 'Image rejected successfully'
    };
  } catch (error) {
    const uiError = handleSystemError(error, 'api.rejectCustomerImages');
    return {
      status: 'error',
      message: `${uiError.alert} ${uiError.action}`
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
  const parsed = parseBiometricParams();
  if (parsed && parsed.action === 'approval') {
    return {
      relationno: parsed.params.relationNo,
      batch: parsed.params.batch,
      custno: parsed.params.custNo,
      approved_by: parsed.params.approvedBy,
      hostname: parsed.params.hostname,
      terminal_ip: parsed.params.terminalIp,
    };
  }
  return {};
};


// === NEW: Fetch activity configuration to control enabled steps ===
export const fetchActivityConfig = async (): Promise<ActivityConfigResponse> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/activities`, {
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


// Save activity configuration

export const saveActivityConfig = async (config: ActivityConfig): Promise<ActivityConfigResponse> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Backend likely returns the saved config or a success message
    // We try to parse it similarly to fetchActivityConfig
    if (result && typeof result === 'object') {
      if (result.image && result.identification && result.fingerprint) {
        // Full config returned
        return { success: true, data: result as ActivityConfig };
      }

      // Might return { success: true, message: '...' } or similar
      if (result.success !== undefined) {
        return {
          success: result.success,
          message: result.message || (result.success ? 'Configuration saved' : 'Save failed'),
          data: result.data as ActivityConfig | undefined,
        };
      }
    }

    // Fallback: assume success if no error
    return { success: true, message: 'Configuration saved successfully' };
  } catch (error) {
    console.error('Failed to save activity config:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save configuration',
    };
  }
};

export interface SignatureVerificationResponse {
  score: number;
  is_match: boolean;
  status: string;
  message?: string;
}

// NEW: Fetch the current posting date from the legacy system
export const getPostingDate = async (): Promise<string> => {
  const relNo = getRelationNumber();
  if (isStandaloneRelation(relNo)) {
    return new Date().toISOString().split('T')[0];
  }

  try {
    const response = await fetch(`${getBaseUrl()}/api/get_posting_date`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    return result.posting_date || new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Failed to fetch posting date:', error);
    return new Date().toISOString().split('T')[0]; // Fallback
  }
};

/**
 * AI SIGNATURE VERIFICATION
 * Connects to the local Python backend (port 8000) to compare extracted cheque
 * signature against the mandate signature.
 */
export const verifySignature = async (
    chequeImage: string, 
    mandateImage: string,
    roi?: { x: number, y: number, w: number, h: number }
): Promise<SignatureVerificationResponse | null> => {
    try {
        const response = await fetch('http://127.0.0.1:8130/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cheque_image: chequeImage,
                mandate_image: mandateImage,
                roi: roi // Pass the crop coordinates
            }),
        });

        if (!response.ok) {
            throw new Error(`AI Engine Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Signature verification connection failed:', error);
        return null;
    }
};

export interface ChequeMandateResponse {
  success: boolean;
  output_code: string;
  output_msg: string;
  output: unknown;
}

export const verifyChequeMandate = async (
  chequeNo: string,
  acctNo: string,
  currency: string,
  chk: 'Y' | 'N',
  relationNo: string,
  postedBy: string = 'admin'
): Promise<ChequeMandateResponse> => {
  try {
    const rawAccount = acctNo.replace(/\D/g, '');
    console.log(`[Protocol] Verifying cheque mandate for sanitized account: ${rawAccount} (raw input: "${acctNo}")`);
    // Send a request to cheque_mandates-{cheque_no}-{acct_no}-{currency}-{posted_by}-{chk} matching the .htaccess rewrite rule
    const response = await fetch(`${getBaseUrl()}/api/cheque_mandates-${chequeNo}-${rawAccount}-${currency}-${postedBy}-${chk}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '20171411891',
        'x-api-secret': '141116517P'
      },
      body: JSON.stringify({
        relation_no: relationNo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const uiError = handleSystemError(error, 'api.verifyChequeMandate');
    throw new Error(`${uiError.alert} ${uiError.action}`);
  }
};