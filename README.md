# VOI Name Service API

A caching resolver service for VOI (.voi) names and addresses.

## API Endpoints

### Single Name/Address Resolution

#### Get Name from Address
```
GET /api/name/[address]?ignoreCache=false
```

Resolves an Algorand address to its corresponding VOI name. For multiple addresses, use comma-separated values.

**Parameters:**
- `address` (string): The Algorand address to resolve, or multiple comma-separated addresses (max 50)
- `ignoreCache` (boolean, optional): Skip cache lookup (default: false)

**Examples:**
```
GET /api/name/ADDRESS1
GET /api/name/ADDRESS1,ADDRESS2,ADDRESS3
```

**Response:**
```json
{
  "results": [
    {
      "address": "ADDRESS1",
      "name": "example.voi",
      "cached": true
    }
  ]
}
```

#### Get Address from Name
```
GET /api/address/[name]?ignoreCache=false
```

Resolves a VOI name to its corresponding Algorand address. For multiple names, use comma-separated values.

**Parameters:**
- `name` (string): The VOI name to resolve (must end in .voi), or multiple comma-separated names (max 50)
- `ignoreCache` (boolean, optional): Skip cache lookup (default: false)

**Examples:**
```
GET /api/address/name1.voi
GET /api/address/name1.voi,name2.voi,name3.voi
```

**Response:**
```json
{
  "results": [
    {
      "name": "name1.voi",
      "address": "R7TBR3Y5QCM6Y2OPQP3BPNUQG7TLN75IOC2WTNRUKO4VPNSDQF52MZB4ZE",
      "cached": true
    }
  ]
}
```

### Batch Resolution

#### Resolve Multiple Addresses to Names
```
POST /api/name
```

**Request Body:**
```json
{
  "addresses": ["ADDRESS1", "ADDRESS2", ...],
  "ignoreCache": false
}
```

**Parameters:**
- `addresses` (string[]): Array of Algorand addresses (max 50)
- `ignoreCache` (boolean, optional): Skip cache lookup (default: false)

#### Resolve Multiple Names to Addresses
```
POST /api/address
```

**Request Body:**
```json
{
  "names": ["name1.voi", "name2.voi", ...],
  "ignoreCache": false
}
```

**Parameters:**
- `names` (string[]): Array of VOI names (max 50)
- `ignoreCache` (boolean, optional): Skip cache lookup (default: false)

**Batch Response Format:**
```json
{
  "results": [
    {
      "address": "...",  // or "name" for name lookups
      "name": "example.voi",  // or "address" for address lookups
      "cached": true
    }
    // ... more results
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name/Address parameter is required"
}
```

### 404 Not Found
```json
{
  "error": "Name/Address not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Caching

The API implements a dual-cache system with the following features:
- Separate caches for name-to-address and address-to-name lookups
- Results are cached for 1 hour by default
- Cache can be bypassed using `ignoreCache=true`
- When bypassing cache, the service will still update both caches with fresh values
- Bidirectional caching: when a name or address is resolved, both caches are updated
- Cache status is indicated in the `X-Cache` header:
  - `HIT`: Served from cache
  - `MISS`: Freshly resolved
  - `BYPASS`: Cache was ignored
  - `MIXED`: For batch requests with mixed cache results

### Cache Tables

#### name_cache
- Primary key: `name` (lowercase)
- Stores name-to-address mappings
- Handles multiple names pointing to the same address
- Schema:
  ```sql
  CREATE TABLE name_cache (
      name TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Constraints:
  - Name format: Must match `^[a-z0-9-]+\.voi$`
  - Address format: Must match `^[A-Z2-7]{58}$`
- Indexes:
  - Primary key on `name`
  - Secondary index on `address`

#### address_cache
- Primary key: `address`
- Stores address-to-name mappings
- Maintains the canonical name for each address
- Schema:
  ```sql
  CREATE TABLE address_cache (
      address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Constraints:
  - Address format: Must match `^[A-Z2-7]{58}$`
  - Name format: Must match `^[a-z0-9-]+\.voi$`
- Indexes:
  - Primary key on `address`
  - Secondary index on `name`

### Security

The API implements the following security measures:

#### CORS Policy
The API has a permissive CORS policy that allows:
- Origins: `*` (all origins)
- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`

#### Row Level Security
The cache tables implement Row Level Security (RLS) with the following policies:
- Public read access is allowed for all records
- Write access (insert/update) is restricted to the service role
- No delete access is provided

## Rate Limiting

- Batch requests are limited to 50 items per request
- Individual requests are processed sequentially

## Environment Variables

Required environment variables:
```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The API is designed to be deployed on Vercel using the SvelteKit adapter. Simply push to your repository and Vercel will handle the deployment automatically.