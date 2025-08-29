// helpers for handling json objects.

export function json(data:unknown, status:number = 200, headers?:Headers): Response {
    const h = headers ?? new Headers();
    h.set("Content-Type", "application/json");

    const body= JSON.stringify(data);
    const r =  new Response(body, { status, headers: h });
    return r
}

export const errorJson = (message:string, status: number = 500): Response =>
    json({ ok: false, error: message }, status);

