import * as secp from '@noble/secp256k1';
import { createHash, createHmac } from 'crypto-browserify';

secp.utils.hmacSha256Sync = (key, ...msgs) => {
  const h = createHmac('sha256', key);
  for (const m of msgs) h.update(m);
  return h.digest();
};
secp.utils.sha256Sync = (...msgs) => {
  const h = createHash('sha256');
  for (const m of msgs) h.update(m);
  return h.digest();
};

const { utils, Point, CURVE } = secp;

function bytesToBigIntBE(bytes) {
  let result = 0n;
  for (const b of bytes) result = (result << 8n) | BigInt(b);
  return result;
}

function bigIntToBytesBE(num, length = 32) {
  const bytes = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(num & 0xffn);
    num >>= 8n;
  }
  return bytes;
}

const ecc = {
  isPoint(bytes) {
    try {
      Point.fromHex(bytes);
      return true;
    } catch {
      return false;
    }
  },
  isPrivate(bytes) {
    return utils.isValidPrivateKey(bytes);
  },
  pointFromScalar(d, compressed) {
    return secp.getPublicKey(d, compressed);
  },
  pointCompress(p, compressed) {
    return Point.fromHex(p).toRawBytes(compressed);
  },
  privateAdd(d, tweak) {
    const a = bytesToBigIntBE(d);
    const b = bytesToBigIntBE(tweak);
    const sum = (a + b) % CURVE.n;
    if (sum === 0n) return null;
    return bigIntToBytesBE(sum, 32);
  },
  privateNegate(d) {
    const a = bytesToBigIntBE(d);
    const neg = (CURVE.n - a) % CURVE.n;
    return bigIntToBytesBE(neg, 32);
  },
  sign(hash, priv, extra) {
    if (extra !== undefined) {
      return secp.signSync(hash, priv, { extraEntropy: extra });
    }
    return secp.signSync(hash, priv);
  },
  signSchnorr(hash, priv, auxRand) {
    return secp.schnorr.signSync(hash, priv, auxRand);
  },
  verify(hash, pub, sig) {
    return secp.verify(sig, hash, pub);
  },
  verifySchnorr(hash, pub, sig) {
    return secp.schnorr.verifySync(sig, hash, pub);
  },
  xOnlyPointAddTweak(xOnlyPubkey, tweak) {
    let P;
    try {
      P = Point.fromHex(utils.concatBytes(Uint8Array.from([0x02]), xOnlyPubkey));
    } catch {
      return null;
    }
    const T = Point.fromPrivateKey(tweak);
    const Q = P.add(T);
    if (Q.equals(Point.ZERO)) return null;
    const parity = Number(Q.y & 1n);
    const xOnly = utils.numberToBytesBE(Q.x, 32);
    return { parity, xOnlyPubkey: xOnly };
  },
};

export default ecc;