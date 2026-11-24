import { check, clean, json } from "./security.js";
const localCookie = "mlh_session";

function sessionCookie(req) {
  const entry = (req.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(localCookie + "="));
  return entry ? entry.slice(localCookie.length + 1) : "";
}
async function callAuth(req, env, path, body) {
  check(env.NEON_AUTH_BASE_URL, 503, "Login sedang disediakan.");
  const token = sessionCookie(req);
  const h = new Headers({
    accept: "application/json",
    origin: new URL(req.url).origin,
  });
  if (token) {
    const match = /^([a-zA-Z0-9_.-]+)~([^;\s]+)$/.exec(token);
    if (
      match &&
      /^(?:__Secure-)?(?:neon-auth|better-auth)\.session_token$/.test(match[1])
    )
      h.set("cookie", match[1] + "=" + match[2]);
  }
  if (body) h.set("content-type", "application/json");
  const res = await fetch(
    env.NEON_AUTH_BASE_URL.replace(/\/$/, "") + "/" + path,
    {
      method: body ? "POST" : "GET",
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    },
  );
  let data = {};
  try {
    data = await res.json();
  } catch {}
  const setCookies = res.headers.getSetCookie?.() || [
    res.headers.get("set-cookie") || "",
  ];
  let stored = "";
  for (const raw of setCookies) {
    const m =
      /(?:^|,\s*)((?:__Secure-)?(?:better-auth|neon-auth)\.session_token)=([^;,\s]+)/.exec(
        raw,
      );
    if (m) stored = m[1] + "~" + m[2];
  }
  return { res, data, stored };
}
function cookie(req, value, age) {
  return (
    localCookie +
    "=" +
    value +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    age +
    (new URL(req.url).protocol === "https:" ? "; Secure" : "")
  );
}
export async function getUser(req, env, sql) {
  if (!sessionCookie(req)) return null;
  const { res, data } = await callAuth(req, env, "get-session");
  if (!res.ok && res.status >= 500)
    check(false, 503, "Sesi tidak dapat disemak sekarang.");
  if (!res.ok || !data?.user?.id) return null;
  const u = data.user;
  const [account] =
    await sql`INSERT INTO mylesenhub.accounts(id,name,email) VALUES(${u.id},${u.name || u.email},${u.email}) ON CONFLICT(id) DO UPDATE SET email=excluded.email WHERE mylesenhub.accounts.email<>excluded.email RETURNING id,name,email,role`;
  return (
    account ||
    (
      await sql`SELECT id,name,email,role FROM mylesenhub.accounts WHERE id=${u.id}`
    )[0]
  );
}
export async function authAction(req, env, sql, path, b) {
  const actions = {
    "/api/login": "sign-in/email",
    "/api/signup": "sign-up/email",
    "/api/logout": "sign-out",
    "/api/forgot": "request-password-reset",
    "/api/reset": "reset-password",
  };
  const email = clean(b.email, 254).toLowerCase(),
    origin = new URL(req.url).origin;
  if (["/api/signup", "/api/login", "/api/forgot"].includes(path))
    check(/^\S+@\S+\.\S+$/.test(email), 400, "Semak alamat e-mel.");
  if (["/api/signup", "/api/login", "/api/reset"].includes(path))
    check(
      typeof b.password === "string" &&
        b.password.length > 0 &&
        b.password.length <= 256,
      400,
      "Semak kata laluan.",
    );
  const payload =
    path === "/api/signup"
      ? {
          email,
          password: b.password,
          name: clean(b.name) || email.split("@")[0],
          callbackURL: origin + "/login",
        }
      : path === "/api/login"
        ? { email, password: b.password, rememberMe: b.rememberMe !== false }
        : path === "/api/forgot"
          ? { email, redirectTo: origin + "/reset-password" }
          : path === "/api/reset"
            ? { token: clean(b.token, 1024), newPassword: b.password }
            : {};
  const { res, data, stored } = await callAuth(
    req,
    env,
    actions[path],
    payload,
  );
  check(
    res.ok,
    res.status >= 500 ? 503 : res.status >= 400 ? res.status : 400,
    path === "/api/login"
      ? "Login gagal. Semak e-mel, kata laluan dan pengesahan akaun."
      : clean(data?.message) || "Permintaan tidak dapat diselesaikan.",
  );
  if (path === "/api/signup" && data.user?.id) {
    const role = b.accountType === "institut" ? "institut" : "instructor";
    await sql`INSERT INTO mylesenhub.accounts(id,name,email,role) VALUES(${data.user.id},${data.user.name || email},${email},${role}) ON CONFLICT DO NOTHING`;
  }
  const response = json({
    ok: true,
    redirect:
      path === "/api/logout" || path === "/api/reset"
        ? "/login"
        : stored
          ? "/dashboard"
          : undefined,
    message:
      path === "/api/forgot"
        ? "Semak peti masuk anda untuk langkah seterusnya."
        : path === "/api/signup" && !stored
          ? "Semak e-mel anda untuk mengesahkan akaun."
          : "Berjaya.",
  });
  if (stored) {
    const session = cookie(req, stored, 60 * 60 * 24 * 7);
    response.headers.set(
      "set-cookie",
      path === "/api/login" && b.rememberMe === false
        ? session.replace(/; Max-Age=\d+/, "")
        : session,
    );
  }
  if (path === "/api/logout")
    response.headers.set("set-cookie", cookie(req, "", 0));
  if (path === "/api/login")
    check(stored, 502, "Sesi login tidak dapat disimpan.");
  return response;
}
