import { utils } from 'ethers';
import fs from 'fs';
import {
  BarretenbergApiAsync,
  Crs,
  newBarretenbergApiAsync,
  RawBuffer,
} from '@aztec/bb.js/dest/node/index.js';
import { decompressSync } from 'fflate';
import { executeCircuit, compressWitness } from '@noir-lang/acvm_js';

const circuit = JSON.parse(fs.readFileSync('./circuits/target/main.json', 'utf8'));

async function generateWitness(
  input: Map<number, string>,
  acirBuffer: Buffer,
): Promise<Uint8Array> {
  const witnessMap = await executeCircuit(acirBuffer, input, () => {
    throw Error('unexpected oracle');
  });

  const witnessBuff = compressWitness(witnessMap);
  return witnessBuff;
}

async function generateProof(api: BarretenbergApiAsync, acirBuffer: Buffer, witness: Uint8Array) {
  const acirBufferUncompressed = decompressSync(acirBuffer);

  const [, total] = await api.acirGetCircuitSizes(acirBufferUncompressed);
  const subgroupSize = Math.pow(2, Math.ceil(Math.log2(total)));
  const crs = await Crs.new(subgroupSize + 1);
  await api.commonInitSlabAllocator(subgroupSize);
  await api.srsInitSrs(
    new RawBuffer(crs.getG1Data()),
    crs.numPoints,
    new RawBuffer(crs.getG2Data()),
  );

  const acirComposer = await api.acirNewAcirComposer(subgroupSize);
  const proof = await api.acirCreateProof(
    acirComposer,
    acirBufferUncompressed,
    decompressSync(witness),
    false,
  );
  return proof;
}

async function verifyProof(api: BarretenbergApiAsync, acirBuffer: Buffer, proof: Uint8Array) {
  const acirBufferUncompressed = decompressSync(acirBuffer);

  const [, total] = await api.acirGetCircuitSizes(acirBufferUncompressed);
  const subgroupSize = Math.pow(2, Math.ceil(Math.log2(total)));
  const crs = await Crs.new(subgroupSize + 1);
  await api.commonInitSlabAllocator(subgroupSize);
  await api.srsInitSrs(
    new RawBuffer(crs.getG1Data()),
    crs.numPoints,
    new RawBuffer(crs.getG2Data()),
  );

  const acirComposer = await api.acirNewAcirComposer(subgroupSize);
  await api.acirInitProvingKey(acirComposer, acirBufferUncompressed);
  const verified = await api.acirVerifyProof(acirComposer, proof, false);
  return verified;
}

// Generate Solidity inputs for testing purpose
export default async function main() {
  console.log('Instantiating...');

  const api = await newBarretenbergApiAsync(4);
  const acirBuffer = Buffer.from(circuit.bytecode, 'base64');

  console.log('Generating inputs...');

  const witnessInputs = [3, 3]
    .flatMap(v => v)
    .reduce((acc: Map<number, string>, v, i) => {
      console.log(`witness input ${i}:`, v);
      acc.set(i + 1, utils.hexZeroPad(`0x${v.toString(16)}`, 32));
      return acc;
    }, new Map<number, string>());

  console.log('witness inputs:', witnessInputs);

  const witness = await generateWitness(witnessInputs, acirBuffer);

  console.log('Generating proof...');

  const proof = await generateProof(api, acirBuffer, witness);

  // console.log('proof', proof);
  console.log('Verify proof...');
  const verified = await verifyProof(api, acirBuffer, proof);
  console.log('Verified:', verified);

  const publicInputs = proof.slice(0, 32);
  const slicedProof = proof.slice(32);
  return { proof: slicedProof, publicInputs };
}
