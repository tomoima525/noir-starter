import { createPoseidonHash } from './poseidon.js';

export const genZeroHashes = (poseidon: any, depth: number) => {
  let zeroHash = 0n;
  // Generate zero hashes for insertion padding
  const zeroes: bigint[] = [];
  for (let level = 0; level < depth; level++) {
    zeroHash = level === 0 ? zeroHash : createPoseidonHash(poseidon, [zeroHash, zeroHash]);
    zeroes.push(zeroHash);
  }
  return zeroes;
};
