import { useParams } from "react-router-dom";
import Index from "./Index";
import Approval from "./Approval";
import Update from "./Update"; // Ensure Update accepts props (see below)
import Enquiry from "./Enquiry";

type Action = "capture" | "approve" | "update" | "enquiry" | "getimagescred" | "getimages" | "viewimage" | "image_approval_screen" | null;

export default function Gateway() {
    const params = useParams()
    // const isValidFormat = params["data"] ? /^[a-zA-Z]+-\d+$/.test(params.data) : false;
    const isValidFormat = params["data"] && params["data"].includes('-');

    const action = isValidFormat ? params.data.split('-')[0] : null;
    const idNo = isValidFormat ? params.data.split('-').slice(1).join('-') : null;

    if (!action && !idNo) {
        return <Index />
    }

    switch (action) {
        case "capture":
            return <Index />
        case "image_approval_screen":
            return <Approval />
        case "update":
            return <Update relationNo={idNo} /> // Pass the parsed ID here
        case "getimagescred":
            return <Enquiry id={idNo} fetchType="relation" />
        case "getimages":
            return <Enquiry id={idNo} fetchType="getimages" />
        case "viewimage":
            return <Enquiry id={idNo} fetchType="account" />
        default:
            return <Index />
    }
}