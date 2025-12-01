# API Documentation

## REST API

Base URL: `http://localhost:4000` (development) or your deployed backend URL

All endpoints return JSON responses.

### Health Check

Check if the backend service is running.

```
GET /health
```

**Response**

Status: 200 OK

```json
{
  "status": "ok",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

**Example**

```bash
curl http://localhost:4000/health
```

### Get Registry Metadata

Fetch registry metadata for a given authority address.

```
GET /metadata/:authority
```

**Path Parameters**

- `authority` (required): Solana wallet address in base58 format (32-44 characters)

**Response**

Status: 200 OK

```json
{
  "authority": "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA",
  "version": 1,
  "metadataUri": "https://gist.githubusercontent.com/SemiuAdesina/b47e3bdc7fe3262decf1f481452eb217/raw/4c5259681f2996a4f5d26f0086bac701a6fcced8/gistfile1.txt",
  "metadataChecksum": [57, 29, 148, 111, 62, 37, 82, 55, 87, 58, 113, 226, 204, 210, 241, 158, 173, 29, 116, 181, 116, 184, 107, 110, 194, 192, 70, 172, 7, 130, 4, 235]
}
```

**Error Responses**

Status: 404 Not Found

```json
{
  "error": "RegistryNotFound"
}
```

Status: 500 Internal Server Error

```json
{
  "error": "MetadataLookupFailed",
  "details": "Error message details"
}
```

**Example**

```bash
curl http://localhost:4000/metadata/EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA
```

### Get CI Statuses

Retrieve recent CI/CD pipeline status records.

```
GET /ci/status?limit=10
```

**Query Parameters**

- `limit` (optional): Maximum number of statuses to return (default: 10, max: 500)

**Response**

Status: 200 OK

```json
[
  {
    "pipeline": "test-pipeline",
    "status": "success",
    "commit": "abc123def456",
    "runId": "run-123",
    "triggeredBy": "user",
    "timestamp": "2025-11-30T12:00:00.000Z"
  },
  {
    "pipeline": "deploy-pipeline",
    "status": "failure",
    "commit": "def456ghi789",
    "runId": "run-124",
    "triggeredBy": "push",
    "timestamp": "2025-11-30T11:00:00.000Z"
  }
]
```

**Example**

```bash
curl http://localhost:4000/ci/status?limit=5
```

### Submit CI Status

Submit a new CI/CD pipeline status update via webhook.

```
POST /ci/status/webhook
```

**Headers**

- `Content-Type: application/json` (required)
- `x-api-key: <API_KEY>` (required)

**Request Body**

```json
{
  "pipeline": "test-pipeline",
  "status": "success",
  "commit": "abc123def456",
  "runId": "run-123",
  "triggeredBy": "user",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

**Fields**

- `pipeline` (string, required): Name of the CI/CD pipeline
- `status` (string, required): Pipeline status (`success`, `failure`, `pending`, `cancelled`)
- `commit` (string, required): Git commit hash
- `runId` (string, required): Unique identifier for the CI run
- `triggeredBy` (string, required): Who or what triggered the pipeline
- `timestamp` (string, optional): ISO 8601 timestamp (defaults to current time)

**Response**

Status: 200 OK

```json
{
  "message": "CI status recorded",
  "runId": "run-123"
}
```

**Error Responses**

Status: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

Status: 400 Bad Request

```json
{
  "error": "Invalid request body"
}
```

**Example**

```bash
curl -X POST http://localhost:4000/ci/status/webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "pipeline": "test-pipeline",
    "status": "success",
    "commit": "abc123def456",
    "runId": "run-123",
    "triggeredBy": "user"
  }'
```

## GraphQL API

Base URL: `http://localhost:4000/graphql` (development) or your deployed backend URL

The GraphQL endpoint accepts POST requests with JSON bodies.

### Schema

```graphql
type RegistryMetadata {
  authority: String!
  version: Int!
  metadataUri: String
  metadataChecksum: [Int!]
}

type CiStatus {
  pipeline: String!
  status: String!
  commit: String!
  runId: String!
  triggeredBy: String!
  timestamp: String!
}

type Query {
  registry(authority: String!): RegistryMetadata
  ciStatuses(limit: Int = 10): [CiStatus!]!
  ciStatus(runId: String!): CiStatus
}
```

### Queries

#### Get Registry Metadata

Query registry metadata for a specific authority.

**Query**

```graphql
query GetRegistry($authority: String!) {
  registry(authority: $authority) {
    authority
    version
    metadataUri
    metadataChecksum
  }
}
```

**Variables**

```json
{
  "authority": "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA"
}
```

**Response**

```json
{
  "data": {
    "registry": {
      "authority": "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA",
      "version": 1,
      "metadataUri": "https://gist.githubusercontent.com/SemiuAdesina/b47e3bdc7fe3262decf1f481452eb217/raw/4c5259681f2996a4f5d26f0086bac701a6fcced8/gistfile1.txt",
      "metadataChecksum": [57, 29, 148, 111, 62, 37, 82, 55, 87, 58, 113, 226, 204, 210, 241, 158, 173, 29, 116, 181, 116, 184, 107, 110, 194, 192, 70, 172, 7, 130, 4, 235]
    }
  }
}
```

**Null Response**

If the registry doesn't exist:

```json
{
  "data": {
    "registry": null
  }
}
```

**Error Response**

If the authority address is invalid:

```json
{
  "errors": [
    {
      "message": "Invalid authority address: \"invalid-address\". Please provide a valid Solana address (base58 encoded, 32-44 characters). Example: \"EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA\""
    }
  ]
}
```

**Example**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { registry(authority: \"EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA\") { authority version metadataUri metadataChecksum } }"
  }'
```

#### Get Recent CI Statuses

Query recent CI/CD pipeline statuses.

**Query**

```graphql
query GetCiStatuses($limit: Int) {
  ciStatuses(limit: $limit) {
    pipeline
    status
    commit
    runId
    triggeredBy
    timestamp
  }
}
```

**Variables**

```json
{
  "limit": 5
}
```

**Response**

```json
{
  "data": {
    "ciStatuses": [
      {
        "pipeline": "test-pipeline",
        "status": "success",
        "commit": "abc123def456",
        "runId": "run-123",
        "triggeredBy": "user",
        "timestamp": "2025-11-30T12:00:00.000Z"
      }
    ]
  }
}
```

**Example**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { ciStatuses(limit: 5) { pipeline status commit runId triggeredBy timestamp } }"
  }'
```

#### Get Specific CI Status

Query a specific CI/CD pipeline status by run ID.

**Query**

```graphql
query GetCiStatus($runId: String!) {
  ciStatus(runId: $runId) {
    pipeline
    status
    commit
    runId
    triggeredBy
    timestamp
  }
}
```

**Variables**

```json
{
  "runId": "run-123"
}
```

**Response**

```json
{
  "data": {
    "ciStatus": {
      "pipeline": "test-pipeline",
      "status": "success",
      "commit": "abc123def456",
      "runId": "run-123",
      "triggeredBy": "user",
      "timestamp": "2025-11-30T12:00:00.000Z"
    }
  }
}
```

**Null Response**

If the status doesn't exist:

```json
{
  "data": {
    "ciStatus": null
  }
}
```

**Example**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { ciStatus(runId: \"run-123\") { pipeline status commit timestamp } }"
  }'
```

### Error Handling

All GraphQL errors follow the GraphQL error specification:

```json
{
  "errors": [
    {
      "message": "Error message",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

Common error codes:
- `INVALID_AUTHORITY`: Authority address is invalid
- `REGISTRY_NOT_FOUND`: Registry account not found
- `RPC_ERROR`: Error connecting to Solana RPC

## Rate Limiting

Currently, there are no rate limits implemented. For production deployments, consider:
- Implementing rate limiting per IP address
- Rate limiting per API key for webhooks
- Using a service like Redis for distributed rate limiting

## CORS

The API allows cross-origin requests from any origin. CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, x-api-key`

For production, restrict CORS to your frontend domain:
- Set `Access-Control-Allow-Origin` to your frontend URL
- Configure additional allowed headers as needed

## Authentication

Most endpoints are publicly accessible. The following endpoint requires authentication:
- `POST /ci/status/webhook`: Requires `x-api-key` header

Set the API key in your backend environment variables:
```
API_KEY=your-secure-api-key-minimum-16-characters
```

## Content Types

All endpoints accept and return JSON:
- Request Content-Type: `application/json`
- Response Content-Type: `application/json`

## Error Codes

### REST API Errors

- `RegistryNotFound`: Registry account doesn't exist for the given authority
- `MetadataLookupFailed`: Error fetching or decoding registry account
- `Unauthorized`: Missing or invalid API key
- `InvalidRequest`: Malformed request body

### GraphQL Errors

GraphQL errors are returned in the standard format with descriptive messages. Common errors:
- Invalid authority address format
- Registry account not found
- RPC connection errors

## Versioning

Currently, there is no API versioning. All endpoints are under the base path. For future versions, consider:
- URL-based versioning: `/v1/metadata/:authority`
- Header-based versioning: `Accept: application/vnd.api+json;version=1`
- GraphQL schema versioning via field deprecation

