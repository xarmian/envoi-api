import algosdk from "algosdk";
import { CONTRACT } from "ulujs";
import { queryAddress, resolverAppId, algodUrl, vnsTokenAppId } from "./config";
import { PUBLIC_ALGORAND_NODE_URL } from "$env/static/public";
import { PRIVATE_ALGORAND_NODE_TOKEN } from "$env/static/private";

interface EnvoiResolver {
  getNameFromAddress: (address: string) => Promise<string>;
  getAddressFromName: (name: string) => Promise<string>;
}

function init(): EnvoiResolver {
  const algodClient = new algosdk.Algodv2(PRIVATE_ALGORAND_NODE_TOKEN, PUBLIC_ALGORAND_NODE_URL, 443);

  const ciResolver = new CONTRACT(
    resolverAppId,
    algodClient,
    null,
    {
      name: "resolver",
      description: "resolver",
      methods: [
        {
          name: "name",
          args: [
            { type: "byte[32]" }
          ],
          returns: { type: "byte[256]" }
        },
        {
          name: "arc72_ownerOf",
          args: [
            { type: "uint256" }
          ],
          returns: { type: "address" }
        }
      ],
      events: []
    },
    {
      addr: queryAddress,
      sk: new Uint8Array([])
    }
  );

  return {
    getNameFromAddress: async (address: string): Promise<string> => {
      if (!isAlgorandAddress(address)) {
        return '';
      }

      //@ts-expect-error setting contractId to resolverAppId
      ciResolver.contractId = resolverAppId;
      
      const lookup = await namehash(`${address}.addr.reverse`);
      const nameR = await ciResolver.name(lookup);

      if (nameR.success) {
        return stripNullBytes(nameR.returnValue);
      }
      return '';
    },
    getAddressFromName: async (name: string): Promise<string> => {
      //@ts-expect-error setting contractId to vnsTokenAppId
      ciResolver.contractId = vnsTokenAppId;

      const lookup = uint8ArrayToBigInt(await namehash(`${name}`));
      const nameR = await ciResolver.arc72_ownerOf(lookup);

      if (nameR.success) {
        return stripNullBytes(nameR.returnValue);
      }
      return '';
    }
  };
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

function stripNullBytes(string: string): string {
  return string.replace(/\0/g, '');
}

function uint8ArrayToBigInt(uint8Array: Uint8Array) {
  let result = BigInt(0); // Initialize the BigInt result
  for (let i = 0; i < uint8Array.length; i++) {
    result = (result << BigInt(8)) + BigInt(uint8Array[i]); // Shift 8 bits and add the current byte
  }
  return result;
}

function isAlgorandAddress(address: string): boolean {
  // Check if the address length is correct
  if (address.length !== 58) {
    return false;
  }

  // Check if the address uses valid Base32 characters
  const base32Regex = /^[A-Z2-7]+$/;
  if (!base32Regex.test(address)) {
    return false;
  }

  return true;
}

async function namehash(name: string): Promise<Uint8Array> {
  if (!name) {
    return new Uint8Array(32); // Return 32 bytes of zeros for empty name
  }

  // Split the name into labels and reverse them
  const labels = name.split(".").reverse();

  // Start with empty hash (32 bytes of zeros)
  let node = new Uint8Array(32);

  // Hash each label
  for (const label of labels) {
    if (label) {
      // Skip empty labels
      // Hash the label
      const labelBytes = new TextEncoder().encode(label);
      const labelHash = !isAlgorandAddress(label)
        ? await sha256(labelBytes)
        : await sha256(algosdk.decodeAddress(label).publicKey);

      // Concatenate current node hash with label hash and hash again
      const combined = new Uint8Array(labelHash.length + node.length);
      combined.set(node);
      combined.set(labelHash, node.length);
      node = await sha256(combined);
    }
  }

  return node;
}

export default { init };