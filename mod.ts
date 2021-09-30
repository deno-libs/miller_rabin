import { BN } from 'https://deno.land/x/bn_deno@1.0.0/lib/bn.js'

export class MillerRabin {
  #randbelow(n: BN) {
    const len = n.bitLength()
    const min_bytes = Math.ceil(len / 8)

    // Generage random bytes until a number less than n is found.
    // This ensures that 0..n-1 have an equal probability of being selected.
    let a: BN
    do {
      const arr = new Uint8Array(min_bytes)
      self.crypto.getRandomValues(arr)
      a = new BN(arr)
    } while (a.cmp(n) >= 0)

    return a
  }

  #randrange(start: BN, stop: BN): BN {
    // Generate a random number greater than or equal to start and less than stop.
    const size = stop.sub(start)
    return start.add(this.#randbelow(size))
  }

  test(n: BN, k?: number, cb?: (a: any) => void): boolean {
    const len = n.bitLength()
    const red = BN.mont(n)
    const rone = new BN(1).toRed(red)

    if (!k) k = Math.max(1, (len / 48) | 0)

    // Find d and s, (n - 1) = (2 ^ s) * d;
    const n1 = n.subn(1)
    for (var s = 0; !n1.testn(s); s++) {}
    const d = n.shrn(s)

    const rn1 = n1.toRed(red)

    const prime = true
    for (; k > 0; k--) {
      const a = this.#randrange(new BN(2), n1)
      if (cb) cb(a)

      let x = a.toRed(red).redPow(d)
      if (x.cmp(rone) === 0 || x.cmp(rn1) === 0) continue

      for (var i = 1; i < s; i++) {
        x = x.redSqr()

        if (x.cmp(rone) === 0) return false
        if (x.cmp(rn1) === 0) break
      }

      if (i === s) return false
    }

    return prime
  }

  getDivisor(n: BN, k: number): BN | boolean {
    const len = n.bitLength()
    const red = BN.mont(n)
    const rone = new BN(1).toRed(red)

    if (!k) k = Math.max(1, (len / 48) | 0)

    // Find d and s, (n - 1) = (2 ^ s) * d;
    const n1 = n.subn(1)
    for (var s = 0; !n1.testn(s); s++) {}
    const d = n.shrn(s)

    const rn1 = n1.toRed(red)

    for (; k > 0; k--) {
      const a = this.#randrange(new BN(2), n1)

      const g = n.gcd(a)
      if (g.cmpn(1) !== 0) return g

      let x = a.toRed(red).redPow(d)
      if (x.cmp(rone) === 0 || x.cmp(rn1) === 0) continue

      for (var i = 1; i < s; i++) {
        x = x.redSqr()

        if (x.cmp(rone) === 0) return x.fromRed().subn(1).gcd(n)
        if (x.cmp(rn1) === 0) break
      }

      if (i === s) {
        x = x.redSqr()
        return x.fromRed().subn(1).gcd(n)
      }
    }

    return false
  }
}
