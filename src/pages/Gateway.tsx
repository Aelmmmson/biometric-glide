import { useEffect, useMemo } from 'react';
import Index from './Index';
import Update from './Update';
import Approval from './Approval';
import Enquiry from './Enquiry';
import ViewCheques from './ViewCheques';
import NotFound from './NotFound';
import { parseBiometricParams, getCustomerId, getEncryptedAccountId } from '@/services/api';
import { useBiometric } from '@/hooks/useBiometric';

const Gateway = () => {
  const { dispatch } = useBiometric();
  const path = window.location.pathname;

  const parsed = useMemo(() => parseBiometricParams(path), [path]);

  useEffect(() => {
    if (parsed) {
      dispatch({ type: 'SET_PARAMS', params: parsed.params });
    }
  }, [parsed, dispatch]);

  // Determine which page to show
  if (path.startsWith('/imaging/capture')) {
    if (!parsed || parsed.action !== 'capture') {
      return <NotFound message="<strong>Invalid capture URL format.</strong><br><br>Expected: /imaging/capture-[RELATION_NO]-[CAPTURED_BY]-[CAPTURED_DATE]<br>Date Format: YYYY-MM-DD<br><br>Example: /imaging/capture-123456-admin-2024-04-21" />;
    }
    return <Index />;
  }

  if (path.startsWith('/imaging/update')) {
    if (!parsed || parsed.action !== 'update') {
      return <NotFound message="<strong>Invalid update URL format.</strong><br><br>Expected: /imaging/update-[RELATION_NO]-[BATCH]-[MANDATE]-[LIMIT]-[CAPTURED_BY]-[CAPTURED_DATE]<br>(Note: Batch, Mandate, etc. can be empty, e.g., --)<br>Date Format: YYYY-MM-DD<br><br>Example: /imaging/update-123456-B001-M1-50000-admin-2024-04-21" />;
    }
    return <Update relationNo={parsed.params.relationNo || null} />;
  }

  if (path.startsWith('/imaging/account_image_approval_screen')) {
    const match = path.match(/\/account_image_approval_screen-([0-9a-zA-Z]+)-([0-9a-zA-Z]+)-([0-9a-zA-Z_.]+)-([0-9a-zA-Z_-]+)-([0-9.]{7,15})$/);
    if (!match) {
      return <NotFound message="<strong>Invalid account approval URL format.</strong><br><br>Expected: /imaging/account_image_approval_screen-[BATCH]-[ACCOUNT_NO]-[APPROVED_BY]-[HOSTNAME]-[TERMINAL_IP]<br><br>Example: /imaging/account_image_approval_screen-B001-123456-supervisor-MYPC-10.0.0.1" />;
    }
    return <Approval mode="account" accountParams={{
      batch: match[1],
      custNo: match[2],
      approvedBy: match[3],
      hostname: match[4],
      terminalIp: match[5]
    }} />;
  }

  if (path.startsWith('/imaging/image_approval_screen')) {
    if (!parsed || parsed.action !== 'approval') {
      return <NotFound message="<strong>Invalid approval URL format.</strong><br><br>Expected: /imaging/image_approval_screen-[RELATION_NO]-[BATCH]-[CUST_NO]-[APPROVED_BY]-[HOSTNAME]-[TERMINAL_IP]<br>(Note: Batch can be empty, e.g., --)<br><br>Example: /imaging/image_approval_screen-123456-B001-C001-supervisor-MYPC-10.0.0.1" />;
    }
    return <Approval />;
  }

  // Handle other routes
  if (path.includes('/viewimage-')) {
    const match = path.match(/\/viewimage-([a-zA-Z0-9]+)/);
    if (!match) {
      return <NotFound message="<strong>Invalid relation enquiry URL format.</strong><br><br>Expected: /viewimage-[RELATION_NO] or /imaging/viewimage-[RELATION_NO]<br><br>Example: /imaging/viewimage-000123" />;
    }
    return <Enquiry id={match[1]} fetchType="relation" />;
  }

  if (path.includes('/getimagescred-')) {
    const match = path.match(/\/getimagescred-([a-zA-Z0-9]+)/);
    if (!match) {
      return <NotFound message="<strong>Invalid credential enquiry URL format.</strong><br><br>Expected: /getimagescred-[CREDENTIAL] or /imaging/getimagescred-[CREDENTIAL]<br><br>Example: /imaging/getimagescred-ABC123XYZ" />;
    }
    return <Enquiry id={match[1]} fetchType="account" />;
  }

  if (path.includes('/getimages-')) {
    const match = path.match(/\/getimages-([a-zA-Z0-9]+)/);
    if (!match) {
      return <NotFound message="<strong>Invalid account enquiry URL format.</strong><br><br>Expected: /getimages-[ACCOUNT_NO] or /imaging/getimages-[ACCOUNT_NO]<br><br>Example: /imaging/getimages-123456" />;
    }
    return <Enquiry id={match[1]} fetchType="getimages" />;
  }

  if (path.includes('/view_cheques-')) {
    const match = path.match(/\/view_cheques-([a-zA-Z0-9]+)/);
    if (!match) {
      return <NotFound message="<strong>Invalid cheque view URL format.</strong><br><br>Expected: /view_cheques-[CHEQUE_NO] or /imaging/view_cheques-[CHEQUE_NO]<br><br>Example: /imaging/view_cheques-005001" />;
    }
    return <ViewCheques chequeNumber={match[1]} />;
  }

  return <NotFound message="<strong>The requested page could not be found.</strong><br><br>Please check the URL pattern and try again. Common patterns include /imaging/capture, /imaging/update, or /imaging/viewimage." />;
};

export default Gateway;