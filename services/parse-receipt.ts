import { startExpenseAnalysis, makeAwsClient, putToS3 } from "@/aws";
import { getEnv, type Env } from "@/env";
import { makeSupabaseClient, downloadImage } from "@/storage";
import { json, errorJson } from "@/http"
import { type SupabaseClient } from "@supabase/supabase-js";

// type for callTextract
type TextractArgs = {
    bucket: string;
    path: string;
    s3Key?:string;
};

export const callTextract = async (req:Request, args:TextractArgs, env?:Env): Promise<Response> => {
    const e = env ?? getEnv()
    
    // make clients
    const supa:SupabaseClient = makeSupabaseClient(req, e);
    const aws = makeAwsClient(e)    
    
    // download flow
    const got = await downloadImage(supa, args.bucket, args.path)
    if (!got.ok) return errorJson(got.error, 404);

    const key = args.s3Key ?? `${e.s3Prefix ? e.s3Prefix + "/":""}${args.path}`;


    const up = await putToS3({
        s3: aws.s3,
        bucket: e.s3Bucket,
        key: key,
        bytes: got.data,
        contentType:got.contentType ?? "application/octet-stream",
    });

    if (!up.ok) return errorJson(up.error, 502);


    const start = await startExpenseAnalysis({
        textract: aws.textract,
        bucket: e.s3Bucket,
        key: up.key
    });

    if (!start.ok) return errorJson(start.error, 502);
    
    return json({ ok: true, jobId: start.jobId, s3Key: up.key }, 202);
};