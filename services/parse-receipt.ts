import { startExpenseAnalysis, makeAwsClient, putToS3, type PutToS3Args } from "@/aws";
import { getEnv, type Env } from "@/env";
import { makeSupabaseClient, downloadImage } from "@/storage";
import { json, errorJson } from "@/http"
import { toAwsErr } from "@/errors";
import { type SupabaseClient } from "@supabase/supabase-js";

// type for callTextract
type TextractArgs = {
    bucket: string;
    path: string;
    s3Key?:string;
};


export const callTextract = async (req:Request, args:TextractArgs, env?:Env) => {
    const e = env ?? getEnv()
    
    // make clients
    const supa:SupabaseClient = makeSupabaseClient(req, e);
    const aws = makeAwsClient(e)    
    
    // download flow
    const got = await downloadImage(supa, args.bucket, args.path)
    if (!got.ok) return errorJson(got.error, 404);

    const key = args.s3Key ?? `${e.s3Prefix ? e.s3Prefix + "/":""}${args.path}`


    // put to s3
    const putArgs:PutToS3Args = {
        s3: aws.s3,
        bucket:e.s3Bucket,
        key:e.awsAccessKeyId,
        bytes:got.data,

    }
    const up = putToS3({
        s3: aws.s3,
        bucket:e.s3Bucket,
        key,
        bytes:got.data,
        contentType: got.contentType ?? "application/octet-stream"
    });

    if (!up.ok) return errorJson(up.error, 502);

}