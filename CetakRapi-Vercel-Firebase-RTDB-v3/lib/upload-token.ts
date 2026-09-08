import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

export type UploadClaims = {
  exp: number;
  extension: string;
  id: string;
  key: string;
  mime: string;
  name: string;
  size: number;
};

export function createUploadToken(claims: UploadClaims): string {
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyUploadToken(token: string): UploadClaims {
  const [encoded, providedSignature, extra] = token.split('.');
  if (!encoded || !providedSignature || extra) throw new Error('Token upload tidak valid.');
  const expectedSignature = sign(encoded);
  const left = Buffer.from(providedSignature);
  const right = Buffer.from(expectedSignature);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error('Token upload tidak valid.');

  const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as UploadClaims;
  if (!claims.id || !claims.key || !claims.name || !claims.mime || !claims.extension || !Number.isInteger(claims.size) || claims.size <= 0 || claims.exp < Date.now()) {
    throw new Error('Token upload sudah kedaluwarsa atau tidak valid.');
  }
  return claims;
}

function sign(value: string) {
  const secret = process.env.UPLOAD_SIGNING_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error('Environment variable UPLOAD_SIGNING_SECRET belum dikonfigurasi dengan aman.');
  return createHmac('sha256', secret).update(value).digest('base64url');
}
