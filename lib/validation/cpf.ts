export function normalizeCpf(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Validação real do dígito verificador — o formulário antigo não fazia isso. */
export function isValidCpf(raw: string): boolean {
  const cpf = normalizeCpf(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(cpf[i]!, 10) * (len + 1 - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return digit(9) === parseInt(cpf[9]!, 10) && digit(10) === parseInt(cpf[10]!, 10);
}
