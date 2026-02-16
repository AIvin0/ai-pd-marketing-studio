export interface Env {
	PROXY_SECRET: string;
	ALLOWED_ORIGINS: string; // "http://localhost:5173,https://AIvin0.github.io"
	N8N_STEP1_UPLOAD_URL: string;
	N8N_CHECK_STATUS_URL: string;
	N8N_GEN_IMAGE_URL: string;
	N8N_GEN_VIDEO_URL: string;
	N8N_GEN_AUDIO_URL: string;
	N8N_FINAL_MERGE_URL: string;
  
	// assets 설정을 쓰는 경우 자동 바인딩될 수 있음(없으면 undefined)
	ASSETS?: { fetch: (req: Request) => Promise<Response> };
  }
  
  function corsHeaders(origin: string | null, env: Env) {
	const allowed = (env.ALLOWED_ORIGINS || "")
	  .split(",")
	  .map((s) => s.trim())
	  .filter(Boolean);
  
	const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] || "*";
  
	return {
	  "Access-Control-Allow-Origin": allowOrigin,
	  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	  "Access-Control-Allow-Headers": "Content-Type",
	  "Access-Control-Max-Age": "86400",
	};
  }
  
  function json(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
	  ...init,
	  headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
	});
  }
  
  function routeToUpstream(pathname: string, env: Env): string | null {
	switch (pathname) {
	  case "/api/step1/upload":
		return env.N8N_STEP1_UPLOAD_URL;
	  case "/api/check-status":
		return env.N8N_CHECK_STATUS_URL;
	  case "/api/gen-image":
		return env.N8N_GEN_IMAGE_URL;
	  case "/api/gen-video":
		return env.N8N_GEN_VIDEO_URL;
	  case "/api/gen-audio":
		return env.N8N_GEN_AUDIO_URL;
	  case "/api/final-merge":
		return env.N8N_FINAL_MERGE_URL;
	  case "/api/health":
		return "health";
	  default:
		return null;
	}
  }
  
  export default {
	async fetch(request: Request, env: Env): Promise<Response> {
	  const url = new URL(request.url);
	  const origin = request.headers.get("Origin");
	  const cors = corsHeaders(origin, env);
  
	  // Preflight
	  if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: cors });
	  }
  
	  const upstream = routeToUpstream(url.pathname, env);
  
	  // health check (로컬/배포 확인용)
	  if (upstream === "health") {
		return json({ ok: true }, { status: 200, headers: cors });
	  }
  
	  // API 라우트가 아니면 assets(있으면)로 넘기거나 404
	  if (!upstream) {
		if (env.ASSETS) return env.ASSETS.fetch(request);
		return new Response("Not Found", { status: 404, headers: cors });
	  }
  
	  // n8n으로 프록시 전달
	  const target = new URL(upstream);
  
	  // 쿼리스트링 전달(예: check-status?job_id=...)
	  target.search = url.search;
  
	  // body 전달 (GET/HEAD는 body 금지)
	  const body =
		request.method === "GET" || request.method === "HEAD" ? null : request.body;
  
	  const headers = new Headers(request.headers);
	  headers.set("x-proxy-secret", env.PROXY_SECRET);
  
	  // upstream에 맞는 host로 설정(필수는 아니지만 일부 서버에서 안정적)
	  headers.set("host", target.host);
  
	  const upstreamReq = new Request(target.toString(), {
		method: request.method,
		headers,
		body,
		redirect: "manual",
	  });
  
	  const upstreamRes = await fetch(upstreamReq);
  
	  // 응답에도 CORS 헤더 붙여서 반환
	  const resHeaders = new Headers(upstreamRes.headers);
	  Object.entries(cors).forEach(([k, v]) => resHeaders.set(k, v));
  
	  return new Response(upstreamRes.body, {
		status: upstreamRes.status,
		statusText: upstreamRes.statusText,
		headers: resHeaders,
	  });
	},
  };
  