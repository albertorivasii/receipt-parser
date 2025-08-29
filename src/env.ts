// helper function to determine if a required var name is present
const requisite = (k: string) => {
    const v = Deno.env.get(k);
    if (!v) throw new Error(`Missing env var: ${k}`);
    return v;
};

// Env type denotes required and optional config vars for running textract
export type Env = {
    // supabase
    supabaseURL: string;
    supabaseAnonKey:string;
    supabaseServiceRoleKey:string;
    supabaseBucket:string;
    // AWS
    awsRegion:string;
    awsAccessKeyId:string;
    awsSecretAccessKey:string;
    s3Bucket:string;
    s3Prefix?:string;
};

let cached: Env | null = null;

// function to get required and optional variables
export function getEnv(): Env {
    if (cached) {
        return cached;
    }

    cached = {
        supabaseURL: requisite("SUPABASE_URL"),
        supabaseAnonKey: requisite("SUPABASE_ANON_KEY"),
        supabaseServiceRoleKey: requisite("SUPABASE_SERVICE_ROLE_KEY"),
        supabaseBucket: requisite("SUPABASE_BUCKET"),
        awsRegion: requisite("AWS_REGION"),
        awsAccessKeyId: requisite("AWS_ACCESS_KEY_ID"),
        awsSecretAccessKey: requisite("AWS_SECRET_ACCESS_KEY"),
        s3Bucket: requisite("S3_BUCKET"),
        s3Prefix: Deno.env.get("S3_PREFIX") ?? undefined
    };
    return cached
;}

