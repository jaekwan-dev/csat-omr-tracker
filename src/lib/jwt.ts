import { SignJWT, jwtVerify, JWTPayload } from "jose";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || "default-secret-key-fallback";
  return new TextEncoder().encode(secret);
};

export async function signJwt(payload: JWTPayload, expiresIn: string = "7d"): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}
