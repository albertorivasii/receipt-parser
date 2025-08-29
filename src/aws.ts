import { Env, getEnv } from "./env.ts"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { StartExpenseAnalysisCommand, TextractClient } from "@aws-sdk/client-textract"
import { toAwsErr } from "./errors.ts";


export const withBackoff = async <T>(
    fn: () => Promise<T>,
    tries:number = 4
): Promise<T> => {
    let delayMs= 200;
    const MAX_DELAY_MS = 5000
    for (let i = 0; i < tries; i++) {
        try {
            return await fn();
        } catch (err:unknown) {
            if (err instanceof Error) {
                console.error("message:", err.message)
            } else {
                console.error("non-error thrown:", err)
            }
            const tagSource = err instanceof Error ? `${err.name}:${err.message}` : String(err);
            const retryable= ["ECONNRESET", "ETIMEDOUT", "429", "5xx", "Throttling", "ThrottlingException", "TooManyRequestsException"].some(
                tag => tagSource.includes(tag)
            );

            if (!retryable || i == tries - 1) throw err;

            const wait = Math.floor(Math.random() * delayMs)
            await new Promise(r => setTimeout(r, wait));
            delayMs = Math.min(delayMs * 2, MAX_DELAY_MS) // exponential
        }
    }

    throw new Error("withBackoff Exhausted");
};


type AwsClient = {
    s3:S3Client; 
    textract:TextractClient;
};

let cached: AwsClient | null = null;

export const makeAwsClient = (env:Env): AwsClient => {
    const e = env ?? getEnv()
    if (cached) {
        return cached
    } else {
        const credentials = {
            accessKeyId: e.awsAccessKeyId,
            secretAccessKey: e.awsSecretAccessKey
        };

        const s3 = new S3Client({
            region: e.awsRegion,
            credentials,
        });

        const textract = new TextractClient({
            region: e.awsRegion,
            credentials,
        });

        cached = {s3, textract};
        return cached
    }
}

// type for putToS3 args
export type PutToS3Args = {
    s3: S3Client;
    bucket: string;
    key: string;
    bytes: Uint8Array | ArrayBuffer;
    contentType?: string;
};

type PutImgOk = { ok: true; key: string };
type PutImgErr = { ok: false; error: string };
type PutImgResult = PutImgOk | PutImgErr


export const putToS3 = async (args: PutToS3Args): Promise<PutImgResult> => {
    // normalize bytes
    const body = args.bytes instanceof Uint8Array ? args.bytes : new Uint8Array(args.bytes)

    // build put command
    const cmd = new PutObjectCommand({
        Bucket: args.bucket,
        Key: args.key,
        Body: body,
        ContentType: args.contentType ?? "application/octet-stream",
    });

    try {
        // send with retry
        await withBackoff(() => args.s3.send(cmd));

        // send result
        return { ok: true, key: args.key};
    } catch (err:unknown) {
        // friendly error:
        const msg = err instanceof Error ? err.message: String(err);
        return { ok: false, error: msg };
    }
};

// args for startExpenseAnalysis
type ExpenseAnalysisArgs = {
    textract: TextractClient;
    bucket: string;
    key: string;
}

type ExpenseAnalysisOk = { ok: true; jobId: string };
type ExpenseAnalysisErr = {
    ok: false;
    error: string;          // stable-code e.g. "TextractStartFailed"
    message?: string;       // human-readable (from AWS)
    requestId?: string;     // from AWS $metadata
    status?: number;        // HTTP status code from AWS
    name?: string;          // AWS Error name (e.g. ThrottlingException)
};
type ExpenseAnalysisResult = ExpenseAnalysisOk | ExpenseAnalysisErr


export const startExpenseAnalysis = async (args:ExpenseAnalysisArgs): Promise<ExpenseAnalysisResult> => {
    // build textract command
    const cmd = new StartExpenseAnalysisCommand({
        DocumentLocation: {
            S3Object: { Bucket: args.bucket, Name: args.key }
        }
    });

    // send command with retries
    try {
        const resp = await withBackoff(() => args.textract.send(cmd));
        if (resp.JobId) {
            return { ok: true, jobId: resp.JobId };
        }
        // unexpected success with no JobId
        return toAwsErr(new Error("No JobId in Textract response."), "TextractNoJobId", "Textract call failed.");
    } catch (err:unknown) {
        // true aws failure
        return toAwsErr(err, "TextractStartFailed", "textract call failed.")
    }
};

