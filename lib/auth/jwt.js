import { SignJWT, jwtVerify } from "jose";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "./constants";

const ISSUER = "nairobi-eats";

// Reads process.env directly so the proxy can use this file without loading
// the full server env schema.
function secret(name) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must be set and at least 32 characters`);
  return new TextEncoder().encode(value);
}

function sign(payload, { audience, envName, ttl }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(secret(envName));
}

async function verify(token, { audience, envName }) {
  try {
    const { payload } = await jwtVerify(token, secret(envName), {
      issuer: ISSUER,
      audience,
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// Access tokens carry only the user id and role. Sensitive checks still hit the database.
export function signAccessToken({ sub, role }, ttl = ACCESS_TTL_SECONDS) {
  return sign({ sub, role }, { audience: "access", envName: "JWT_SECRET", ttl });
}

export function verifyAccessToken(token) {
  return verify(token, { audience: "access", envName: "JWT_SECRET" });
}

export function signRefreshToken({ sub, fid, jti }, ttl = REFRESH_TTL_SECONDS) {
  return sign({ fid, jti, sub }, { audience: "refresh", envName: "JWT_REFRESH_SECRET", ttl });
}

export function verifyRefreshToken(token) {
  return verify(token, { audience: "refresh", envName: "JWT_REFRESH_SECRET" });
}
