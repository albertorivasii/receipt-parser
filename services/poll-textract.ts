import { type TextractClient } from "@aws-sdk/client-textract";
import { type Env , getEnv} from "@/env"
import { makeAwsClient } from "@/aws" 
import { getExpenseAnalysis } from "@/aws"
// poller output
type TextractPollOk = { ok: true; raw:unknown };
type TextractPollErr = { ok: false; error:string; status?:number, requestId?:string };
type TextractPollResult= TextractPollOk | TextractPollErr

type ReceiptDoc = {
    pass:string;
}

// receipt parse outputs
type ReceiptParseOk = { ok: true; raw: ReceiptDoc };
type ReceiptParseErr = { ok: false, error: string; };
type ReceiptParseResult = ReceiptParseOk | ReceiptParseErr


export const getReceiptAnalysis = (jobId:string, env?:Env, client?:TextractClient, maxAttempts?:number, maxSeconds?:number): TextractPollResult => {
    const output = {ok: true, raw:"abc" }
    const e = env ?? getEnv();
    const textract = client ?? makeAwsClient(e).textract;

    let nextToken: string | undefined = undefined;

    const pages: unknown[] = [];
    const pageRes = await getExpenseAnalysis
    return output 
}

