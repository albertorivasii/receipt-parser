type ExpenseAnalysisErr = {
    ok: false;
    error: string;          // stable-code e.g. "TextractStartFailed"
    message?: string;       // human-readable (from AWS)
    requestId?: string;     // from AWS $metadata
    status?: number;        // HTTP status code from AWS
    name?: string;          // AWS Error name (e.g. ThrottlingException)
};


// helper type guards
type AwsMetadata = { $metadata: { requestId?: string; httpStatusCode?: number }};

const hasAwsMetadata = (x: unknown): x is AwsMetadata => {
    if (typeof x !== "object" || x == null) return false;

    const rec = x as Record<string, unknown>;

    if (!("$metadata" in rec) || typeof rec.$metadata !== "object" || rec.$metadata == null) {
        return false;
    }

    const m = rec.$metadata as Record<string, unknown>;
    const reqIdOk = !("requestId" in m) || typeof m.requestId === "string";
    const statusOk = !("httpStatusCode" in m) || typeof m.httpStatusCode === "number";

    return reqIdOk && statusOk
}


export function toAwsErr(err: unknown, code: string, fallback:string = "unknown_error"): ExpenseAnalysisErr {
   const out:ExpenseAnalysisErr = {
    ok:false as const,
    error: code,
    status: 500,
    message: fallback
   }

   if (err instanceof Error) {
    out.name = err.name;
    out.message = err.message;
   }

   if (hasAwsMetadata(err)) {
    out.requestId = err.$metadata.requestId;
    out.status = err.$metadata.httpStatusCode
   }

   return out
}

