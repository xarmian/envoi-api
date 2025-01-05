# enVoi Naming Service API

A resolver service for VOI (.voi) names and addresses, available at `https://api.envoi.sh`.

## API Endpoints

### Name Resolution

#### Get Name from Address
```
GET https://api.envoi.sh/api/name/[address]
```

Resolves an Algorand address to its corresponding VOI name. For multiple addresses, use comma-separated values.

**Parameters:**
- `address` (string): The Algorand address to resolve, or multiple comma-separated addresses (max 50)

**Examples:**
```bash
# Single address lookup
curl https://api.envoi.sh/api/name/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

# Multiple addresses
curl https://api.envoi.sh/api/name/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
```

**Response:**
```json
{
  "results": [
    {
      "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "name": "example.voi",
      "metadata": {
        "url": "https://example.com",
        "avatar": "https://example.com/avatar.webp",
        "com.twitter": "example",
        "com.github": "example"
      },
      "cached": false
    }
  ]
}
```

#### Batch Address Resolution (POST)
```
POST https://api.envoi.sh/api/name
```

**Request Body:**
```json
{
  "addresses": [
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
  ]
}
```

**Example:**
```bash
curl -X POST https://api.envoi.sh/api/name \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"]}'
```

### Address Resolution

#### Get Address from Name
```
GET https://api.envoi.sh/api/address/[name]
```

Resolves a VOI name to its corresponding Algorand address. For multiple names, use comma-separated values.

**Parameters:**
- `name` (string): The VOI name to resolve (must end in .voi), or multiple comma-separated names (max 50)

**Examples:**
```bash
# Single name lookup
curl https://api.envoi.sh/api/address/example.voi

# Multiple names
curl https://api.envoi.sh/api/address/example1.voi,example2.voi
```

**Response:**
```json
{
  "results": [
    {
      "name": "example.voi",
      "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "metadata": {
        "url": "https://example.com",
        "avatar": "https://example.com/avatar.webp",
        "com.twitter": "example",
        "com.github": "example"
      },
      "cached": false
    }
  ]
}
```

#### Batch Name Resolution (POST)
```
POST https://api.envoi.sh/api/address
```

**Request Body:**
```json
{
  "names": [
    "example1.voi",
    "example2.voi"
  ]
}
```

**Example:**
```bash
curl -X POST https://api.envoi.sh/api/address \
  -H "Content-Type: application/json" \
  -d '{"names": ["example.voi"]}'
```

### Name Search

Search for VOI names based on a pattern.

```
GET https://api.envoi.sh/api/search
```

**Parameters:**
- `pattern` (string, required): The search pattern to match against names
- `type` (string, optional): Search type - one of: 'contains', 'starts', 'ends' (default: 'contains')
- `limit` (number, optional): Maximum number of results to return (default: 100, max: 1000)
- `includes` (string, optional): Whether to include filtered results - one of: 'filtered', 'all' (default: 'filtered')

**Examples:**
```bash
# Basic search
curl https://api.envoi.sh/api/search?pattern=voi

# Advanced search
curl https://api.envoi.sh/api/search?pattern=test&type=starts&limit=50&includes=all
```

#### Batch Search (POST)
```
POST https://api.envoi.sh/api/search
```

**Request Body:**
```json
{
  "pattern": "voi",
  "type": "contains",
  "limit": 100,
  "includes": "filtered"
}
```

**Example:**
```bash
curl -X POST https://api.envoi.sh/api/search \
  -H "Content-Type: application/json" \
  -d '{"pattern": "abc", "type": "contains", "limit": 100}'
```

**Response Format:**
```json
{
  "results": [
    {
      "name": "example.voi",
      "address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "metadata": {
        "url": "https://example.com",
        "avatar": "https://example.com/avatar.webp",
        "com.twitter": "example",
        "com.github": "example"
      }
    }
  ]
}
```

Note: By default, the search excludes certain system addresses. Use `includes=all` to include all results.

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

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:
- Allowed Origins: `*` (all origins)
- Allowed Methods: `GET`, `POST`, `OPTIONS`
- Allowed Headers: `Content-Type`

## Rate Limiting

- Maximum 50 items per batch request for name and address resolution
- Search results are limited to 1000 items maximum per request
