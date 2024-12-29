import algosdk from "algosdk";
import { resolverAppId, vnsTokenAppId } from "./config";
import { PUBLIC_ALGORAND_INDEXER_URL } from "$env/static/public";
import { PRIVATE_ALGORAND_INDEXER_TOKEN } from "$env/static/private";

interface EnvoiResolver {
  getNameFromAddress: (address: string) => Promise<string>;
}

function init(): EnvoiResolver {
  const indexerClient = new algosdk.Indexer(
    PRIVATE_ALGORAND_INDEXER_TOKEN,
    PUBLIC_ALGORAND_INDEXER_URL,
    443
  );

  return {
    getNameFromAddress: async (address: string): Promise<string> => {
      if (!isAlgorandAddress(address)) {
        return '';
      }

      const lookup = await getBoxKeyForAddress(address);

      try {
        const response = await indexerClient.lookupApplicationBoxByIDandName(resolverAppId, lookup).do();
        if (response && response.value) {
          // Box values are base64 encoded
          const decodedValue = new TextDecoder().decode(Buffer.from(response.value, 'base64'));
          return stripNullBytes(decodedValue);
        }
      } catch (error) {
        console.error('Error fetching box data:', error);
      }
      return '';
    },
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
  
function isAlgorandAddress(value: string): boolean {
    try {
        algosdk.decodeAddress(value);
        return true;
    } catch {
        return false;
    }
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
  
  async function getBoxKeyForAddress(address: string): Promise<Uint8Array> {
    // Get the namehash of the full name
    const fullName = `${address}.addr.reverse`;
    const nameHash = await namehash(fullName);
    
    // Create the 46-byte result array (6 for "names_" + 8 for version + 32 for nameHash)
    const result = new Uint8Array(46);
    
    // Set the "names_" prefix
    const prefix = new TextEncoder().encode("names_");
    result.set(prefix);
    
    // Set version (UInt64(0)) - 8 bytes representing 0 in big-endian format
    const versionBytes = new Uint8Array(8); // This creates 8 zero bytes
    result.set(versionBytes, prefix.length);
    
    // Set the node hash after the version bytes
    result.set(nameHash, prefix.length + 8);
    
    return result;
  }

  export default { init };