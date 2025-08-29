import { type TextractClient } from "@aws-sdk/client-textract";



// poller output
type TextractPollOk = { ok: true; raw:unknown };
type TextractPollErr = { ok: false; error:string; status?:number, requestId?:string };
type TextractPollResult= TextractPollOk | TextractPollErr

type ReceiptDoc = {
    pass:string;
}

type ReceiptParseOk = { ok: true; data: ReceiptDoc };
type ReceiptParseErr = { ok: false, error: string; };
type ReceiptParseResult = ReceiptParseOk | ReceiptParseErr


export const getReceiptAnalysis = (client:TextractClient, jobId:string) => {

}