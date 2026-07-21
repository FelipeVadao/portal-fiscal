import "server-only";
import { randomInt } from "crypto";
import { hashPassword, verifyPassword } from "./password";

// Sem O/0/I/1 — evita confusão na hora de digitar/ditar o código por telefone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCodigoAcesso(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

// Reaproveita o mesmo hashing de senha (bcrypt) — mesma garantia de segurança,
// só que "esqueceu o código" só pode ser resolvido gerando um novo (ver decisão
// do usuário: hash irreversível, não criptografia reversível).
export const hashCodigoAcesso = hashPassword;
export const verifyCodigoAcesso = verifyPassword;
