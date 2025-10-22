import { useParams } from "react-router-dom";
import Index from "./Index";
import Approval from "./Approval";
import Update from "./Update"; // Ensure Update accepts props (see below)
import Enquiry from "./Enquiry";

type Action = "capture" | "approve" | "update" | "enquiry" | null;

export default function Gateway() {
    const params = useParams()
    const isValidFormat = params["data"] ? /^[a-zA-Z]+-\d+$/.test(params.data) : false;

    const action = isValidFormat ? params.data.split('-').at(0) : null;
    const idNo = isValidFormat ? params.data.split('-').at(1) : null;

    if (!action && !idNo) {
        return <Index />
    }

    switch (action) {
        case "capture":
            return <Index />
        case "approve":
            return <Approval />
        case "update":
            return <Update relationNo={idNo} /> // Pass the parsed ID here
        case "viewimage":
            return <Enquiry />
        default:
            return <Index />
    }
}