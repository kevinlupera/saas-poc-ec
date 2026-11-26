# Spec Delta

## Purpose

Defines the MCP endpoint that third-party AI agents use to call the platform: where it is served, how OAuth protects it, how a tool acts for the consenting user inside one tenant, and how the tool catalogue stays in step with the HTTP API.

## ADDED Requirements

### Requirement: MCP endpoint on the API origin
The API SHALL serve the MCP endpoint at `POST <API origin>/mcp` using Streamable HTTP in stateless mode with JSON responses. The canonical MCP resource URL SHALL be that endpoint URL, and no other host SHALL serve MCP.

#### Scenario: List tools with a valid token
- **WHEN** an MCP client posts a `tools/list` JSON-RPC request to `/mcp` with a valid access token for the MCP resource
- **THEN** the API responds 200 with a JSON-RPC result listing the registered tools

#### Scenario: Previous MCP host is gone
- **WHEN** the change is deployed
- **THEN** no MCP endpoint answers on the former standalone MCP host, and the configured MCP resource URL points at `<API origin>/mcp`

### Requirement: Bearer token protection
The MCP endpoint SHALL accept only bearer access tokens issued by this API's authorization server, unexpired, with a valid signature and an audience equal to the MCP resource URL. Any other request SHALL get 401 with an RFC 9728 `WWW-Authenticate` challenge that names the resource metadata URL, and no tool SHALL run.

#### Scenario: No token
- **WHEN** a client posts to `/mcp` without an `Authorization` header
- **THEN** the API responds 401 with a `WWW-Authenticate` header containing `resource_metadata=` and runs no tool

#### Scenario: Wrong audience, issuer or signature
- **WHEN** a client posts to `/mcp` with a token for another audience, from another issuer, expired, or with a bad signature
- **THEN** the API responds 401 and runs no tool

#### Scenario: Session cookie or API key is not enough
- **WHEN** a client posts to `/mcp` with only a session cookie or an `x-api-key` header
- **THEN** the API responds 401 and runs no tool

### Requirement: Authorization discovery
The API SHALL publish RFC 9728 protected-resource metadata for the MCP resource at `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp` on its origin, naming the MCP resource URL and this API's issuer as its authorization server. Unknown resource paths SHALL return 404.

#### Scenario: Client discovers the authorization server
- **WHEN** a client follows the `resource_metadata` URL from a 401 challenge
- **THEN** it receives JSON with `resource` equal to the MCP resource URL and `authorization_servers` containing the API issuer, whose RFC 8414 metadata is also served at the origin root

#### Scenario: Other resource path
- **WHEN** a client requests `/.well-known/oauth-protected-resource/other`
- **THEN** the API responds 404

### Requirement: Tools act for the consenting user in the token tenant
A tool SHALL act as an agent for the token subject inside the token's `tenant_id`, with that user's current role in that tenant. Every tenant action SHALL be authorized against current membership when the tool runs, and failures SHALL return the same tool error for wrong tenant, missing tenant claim, lost membership and missing permission.

#### Scenario: Member calls a tenant tool
- **WHEN** a user who is a member of tenant T authorized the client and the tool runs a tenant action T allows for that role
- **THEN** the tool returns the result for tenant T

#### Scenario: Membership revoked after issuance
- **WHEN** a token still carries `tenant_id` T but the user is no longer a member of T
- **THEN** the tool returns a forbidden error and no tenant data

#### Scenario: Another tenant requested
- **WHEN** a tool is asked to act in a tenant other than the token's `tenant_id`
- **THEN** it returns the same forbidden error as for a missing permission, revealing nothing about that tenant

### Requirement: No token forwarding
A tool SHALL NOT forward the received access token, or any credential derived from it, to another service or to the API's own HTTP endpoints. Tools SHALL reach platform behavior in-process, sharing the logic and authorization rules of the corresponding HTTP endpoint.

#### Scenario: Tool and route agree
- **WHEN** the same user calls a tenant endpoint over HTTP with a session and the matching MCP tool with an access token for the same tenant
- **THEN** both return the same tenant and role, differ only in the caller kind (`user` over HTTP, `agent` over MCP), and are allowed or denied by the same rule

### Requirement: Every API endpoint has a tool or a reasoned exemption
Every API endpoint SHALL have an MCP tool that declares the route it exposes, or an exemption entry with a reason. The build SHALL fail on an endpoint with neither, a tool pointing at a missing route, or an exemption for a route that already has a tool. Read-only tools SHALL be marked read-only.

#### Scenario: Endpoint added without a tool
- **WHEN** a new API endpoint is added with no tool and no exemption
- **THEN** the API contract check fails naming that route

#### Scenario: Identity endpoints exposed
- **WHEN** an agent lists tools
- **THEN** read-only tools exist for the caller identity (`GET /api/me`) and the caller identity inside the token tenant (`GET /api/tenants/{tenantId}/me`), and API-key creation stays exempt pending a human-confirmation design
