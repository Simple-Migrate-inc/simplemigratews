import { createHmac } from "crypto";

function base32Decode(input: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const clean = input.replace(/=+$/, "").toUpperCase();
    let bits = "";
    for (const ch of clean) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(bytes);
}

/** RFC 6238 TOTP (SHA-1, 6 digits, 30s). `offset` shifts by whole periods. */
export function totp(secret: string, offset = 0): string {
    const counter = Math.floor(Date.now() / 1000 / 30) + offset;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const h = createHmac("sha1", base32Decode(secret)).update(buf).digest();
    const o = h[h.length - 1] & 0xf;
    const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString();
    return code.padStart(6, "0");
}
