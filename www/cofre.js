/* Meu Caixa: cofre dos dados.
   - Uma chave aleatória de 256 bits (DEK) criptografa todos os dados com AES-GCM.
   - A DEK fica guardada "embrulhada" por uma chave derivada do PIN (PBKDF2-SHA256, 310 mil iterações).
   - Com biometria ligada, uma cópia da DEK vai para o Keychain (iOS) / Keystore (Android),
     liberada só depois do Face ID / digital.
   Sem o PIN (ou a biometria), os dados gravados no celular são ilegíveis. */
(function (root) {
  const C = (typeof crypto !== 'undefined' ? crypto : require('crypto').webcrypto).subtle;
  const rnd = n => (typeof crypto !== 'undefined' ? crypto : require('crypto').webcrypto).getRandomValues(new Uint8Array(n));
  const ITER = 310000;
  const b64 = u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const te = new TextEncoder(), td = new TextDecoder();

  async function derivar(pin, salt, iter) {
    const base = await C.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return C.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const importar = raw => C.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

  // Cria o cofre: devolve { cofre (público, pode ser salvo), chave (CryptoKey), bruta (Uint8Array da DEK) }
  async function criar(pin) {
    const bruta = rnd(32), salt = rnd(16), iv = rnd(12);
    const kek = await derivar(pin, salt, ITER);
    const emb = await C.encrypt({ name: 'AES-GCM', iv }, kek, bruta);
    return { cofre: { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), dek: b64(emb) }, chave: await importar(bruta), bruta };
  }
  // Abre o cofre com o PIN. PIN errado lança erro.
  async function abrir(cofre, pin) {
    const kek = await derivar(pin, unb64(cofre.salt), cofre.iter || ITER);
    const bruta = new Uint8Array(await C.decrypt({ name: 'AES-GCM', iv: unb64(cofre.iv) }, kek, unb64(cofre.dek)));
    return { chave: await importar(bruta), bruta };
  }
  // Troca o PIN mantendo a mesma DEK (os dados não precisam ser recriptografados).
  async function trocarPin(bruta, novoPin) {
    const salt = rnd(16), iv = rnd(12);
    const kek = await derivar(novoPin, salt, ITER);
    const emb = await C.encrypt({ name: 'AES-GCM', iv }, kek, bruta);
    return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), dek: b64(emb) };
  }
  async function cifrar(chave, obj) {
    const iv = rnd(12);
    const ct = await C.encrypt({ name: 'AES-GCM', iv }, chave, te.encode(JSON.stringify(obj)));
    return 'mc1:' + b64(iv) + ':' + b64(ct);
  }
  async function decifrar(chave, txt) {
    const [tag, iv, ct] = String(txt).split(':');
    if (tag !== 'mc1') throw new Error('formato desconhecido');
    return JSON.parse(td.decode(await C.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, chave, unb64(ct))));
  }
  // PIN fraco: repetido (111111) ou sequência (123456 / 654321)
  function pinFraco(p) {
    if (/^(\d)\1+$/.test(p)) return true;
    const s = '01234567890', r = '09876543210';
    return s.includes(p) || r.includes(p);
  }
  const api = { criar, abrir, trocarPin, cifrar, decifrar, pinFraco, b64, unb64, importar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cofre = api;
})(this);
