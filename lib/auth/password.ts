import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compatível com hashes gerados tanto pelo bcryptjs quanto pelo pgcrypto (crypt/gen_salt('bf')) usado na migration de backfill. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
