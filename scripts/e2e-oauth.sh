#!/usr/bin/env bash
# OAuth + MCP smoke test: dynamic registration -> authorize -> consent -> token -> POST /mcp on the API. Needs apps/api (:3001 or API_BASE,
# NITRO_AUTH_SECRET set, NITRO_MCP_RESOURCE = $API_BASE/mcp), migrated Postgres and Mailpit (docker compose up -d).
# Exits non-zero if any expectation fails.
set -u
. "$(dirname "$0")/lib-auth.sh"; S=$RANDOM; FAIL=0
RES=${MCP_RESOURCE:-$B/mcp}; RED=http://127.0.0.1:8123/cb
expect(){ if [ "$2" = "$3" ]; then echo "ok   $1 ($2)"; else echo "FAIL $1: expected $2, got $3"; FAIL=1; fi; }
q(){ python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$1"; }
json(){ python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
claim(){ python3 -c "import sys,json,base64; p=sys.argv[2].split('.')[1]; print(json.loads(base64.urlsafe_b64decode(p+'='*(-len(p)%4))).get(sys.argv[1],''))" "$1" "$2"; }
LIST='{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
mcp(){ curl -s -m 30 -X POST "$RES" -H "$J" -H 'accept: application/json, text/event-stream' "$@"; }
mcp_code(){ curl -s -m 30 -o /dev/null -w '%{http_code}' -X POST "$RES" -H "$J" -H 'accept: application/json, text/event-stream' "$@" -d "$LIST"; }

C=$(verified_signup "p$S@t.co")
ORG=$(curl -s -m 30 -X POST $B/api/auth/organization/create -H "$J" -H "$O" -H "cookie: $C" -d "{\"name\":\"p\",\"slug\":\"p$S\"}" | json "d['id']")
# The client registers itself (RFC 7591, no session), as MCP Inspector and Claude Code do. Each run
# uses its own client IP so Better Auth's per-IP registration limit never carries over between runs.
ip(){ echo "10.$((RANDOM%250)).$((RANDOM%250)).$((RANDOM%250))"; }
IP=$(ip)
reg(){ curl -s -m 30 -X POST $B/api/auth/oauth2/register -H "$J" -H "x-forwarded-for: ${2:-$IP}" -d "$1"; }
CLIENT='{"client_name":"e2e","redirect_uris":["http://127.0.0.1:8123/cb"],"token_endpoint_auth_method":"none","grant_types":["authorization_code","refresh_token"],"response_types":["code"],"scope":"openid profile email offline_access"}'
CID=$(reg "$CLIENT" | json "d.get('client_id') or d")
echo "client: $CID"
[ -n "$C" ] && [ -n "$ORG" ] && [[ "$CID" =~ ^[A-Za-z0-9_-]{16,}$ ]] || { echo "FAIL setup (sign-up/org/client)"; exit 1; }

V=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))"); CH=$(python3 -c "import hashlib,base64,sys;print(base64.urlsafe_b64encode(hashlib.sha256(sys.argv[1].encode()).digest()).rstrip(b'=').decode())" "$V")
URL="$B/api/auth/oauth2/authorize?response_type=code&client_id=$CID&redirect_uri=$(q $RED)&scope=openid%20profile&code_challenge=$CH&code_challenge_method=S256&state=xyz&resource=$(q $RES)"
LOC=$(curl -s -m 30 -i "$URL" -H "cookie: $C" | grep -i '^location:' | sed 's/^[Ll]ocation: //' | tr -d '\r')
echo "authorize (signed in) -> $(echo "$LOC" | cut -c1-100)"
Q=${LOC#*\?}
expect "consent URL names the redirect (the consent screen shows its host)" "$RED" "$(python3 -c "import sys,urllib.parse as u;print(u.parse_qs(sys.argv[1]).get('redirect_uri',[''])[0])" "$Q")"
ANON=$(curl -s -m 30 -i "$URL" | grep -i '^location:' | sed 's/^[Ll]ocation: //' | tr -d '\r')
expect "anonymous authorize goes to the web /login with a signed query" "$WEB/login sig" "$(python3 -c "import sys,urllib.parse as u; p=u.urlparse(sys.argv[1]); print(f'{p.scheme}://{p.netloc}{p.path}', 'sig' if 'sig' in u.parse_qs(p.query) else '')" "$ANON")"
# What /login does (oauthProviderClient): sign in with the signed query; the API answers with the consent URL.
SQ=${ANON#*\?}
SIGNIN=$(curl -s -m 30 -X POST $B/api/auth/sign-in/email -H "$J" -H "$O" -d "{\"email\":\"p$S@t.co\",\"password\":\"password1234\",\"oauth_query\":\"$SQ\"}")
expect "email sign-in resumes the authorization at consent" "True $WEB/consent" "$(echo "$SIGNIN" | json "str(d.get('redirect'))+' '+d.get('url','').split('?')[0]")"
expect "tampered signed query is rejected" 400 "$(curl -s -m 30 -o /dev/null -w '%{http_code}' -X POST $B/api/auth/sign-in/email -H "$J" -H "$O" -d "{\"email\":\"p$S@t.co\",\"password\":\"password1234\",\"oauth_query\":\"${SQ/scope=openid/scope=email}\"}")"
R=$(curl -s -m 30 -X POST $B/api/auth/oauth2/consent -H "$J" -H "$O" -H "cookie: $C" -d "{\"accept\":true,\"oauth_query\":\"$Q\"}")
CODE=$(echo "$R" | json "d.get('url','')" | python3 -c "import urllib.parse,sys;print(urllib.parse.parse_qs(urllib.parse.urlparse(sys.stdin.read().strip()).query).get('code',[''])[0])")
T=$(curl -s -m 30 -X POST $B/api/auth/oauth2/token -H 'content-type: application/x-www-form-urlencoded' --data-urlencode grant_type=authorization_code --data-urlencode code=$CODE --data-urlencode code_verifier=$V --data-urlencode redirect_uri=$RED --data-urlencode client_id=$CID --data-urlencode resource=$RES)
AT=$(echo "$T" | json "d.get('access_token','')"); IDT=$(echo "$T" | json "d.get('id_token','')")
[ -n "$AT" ] || { echo "FAIL no access token: $(echo "$T" | cut -c1-120)"; exit 1; }
expect "token carries the tenant" "$ORG" "$(claim tenant_id "$AT")"
expect "token audience includes the MCP resource" True "$(python3 -c "import sys,json,base64; p=sys.argv[1].split('.')[1]; a=json.loads(base64.urlsafe_b64decode(p+'='*(-len(p)%4)))['aud']; print(sys.argv[2] in (a if isinstance(a,list) else [a]))" "$AT" "$RES")"

echo "--- /mcp protection"
expect "valid token: tools/list" 200 "$(mcp_code -H "authorization: Bearer $AT")"
expect "no token" 401 "$(mcp_code)"
CHAL=$(curl -s -m 30 -i -X POST "$RES" -H "$J" -d "$LIST" | grep -i '^www-authenticate:' | tr -d '\r')
expect "challenge names resource metadata" 1 "$(echo "$CHAL" | grep -c 'resource_metadata=')"
PRM=$(echo "$CHAL" | sed -n 's/.*resource_metadata="\([^"]*\)".*/\1/p')
expect "resource metadata names the resource and this API's issuer" "$RES $B/api/auth" "$(curl -s -m 30 "$PRM" | json "d['resource']+' '+' '.join(d['authorization_servers'])")"
expect "authorization server metadata at the root" "$B/api/auth" "$(curl -s -m 30 "$B/.well-known/oauth-authorization-server/api/auth" | json "d['issuer']")"
expect "session cookie only" 401 "$(mcp_code -H "cookie: $C")"
expect "api key only" 401 "$(mcp_code -H "x-api-key: org_not-a-bearer-token")"
# Same issuer and signing key, other audience (the client): must not be accepted as an MCP token.
[ -n "$IDT" ] && expect "id_token (other audience)" 401 "$(mcp_code -H "authorization: Bearer $IDT")"
expect "tampered token" 401 "$(mcp_code -H "authorization: Bearer ${AT%?}x")"

echo "--- tools act for the user inside the token tenant"
call(){ mcp -H "authorization: Bearer $AT" -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":$2}}"; }
expect "tenant_me: token tenant" "$ORG" "$(call tenant_me '{}' | json "d['result']['structuredContent']['tenantId']")"
expect "tenant_me: owner, acting as agent" "agent owner" "$(call tenant_me '{}' | json "d['result']['structuredContent']['kind']+' '+d['result']['structuredContent']['role']")"
expect "tenant_me: other tenant denied" "True Forbidden" "$(call tenant_me '{"tenantId":"not-mine"}' | json "str(d['result'].get('isError'))+' '+d['result']['content'][0]['text']")"
expect "me: agent for the user" agent "$(call me '{}' | json "d['result']['structuredContent']['kind']")"

echo "--- consent screen can show the client name"
expect "client name" e2e "$(curl -s -m 30 "$B/api/auth/oauth2/public-client?client_id=$CID" -H "cookie: $C" | json "d.get('client_name')")"

echo "--- an MCP token is only for /mcp"
expect "MCP token on /api/me" 401 "$(curl -s -m 30 -o /dev/null -w '%{http_code}' $B/api/me -H "authorization: Bearer $AT")"
expect "MCP token on a tenant route" 401 "$(curl -s -m 30 -o /dev/null -w '%{http_code}' $B/api/tenants/$ORG/me -H "authorization: Bearer $AT")"

echo "--- dynamic client registration (on outside production)"
META=$(curl -s -m 30 $B/.well-known/oauth-authorization-server/api/auth)
expect "AS metadata: registration_endpoint" "$B/api/auth/oauth2/register" "$(echo "$META" | json "d.get('registration_endpoint')")"
expect "AS metadata: PKCE S256 only" "['S256']" "$(echo "$META" | json "d.get('code_challenge_methods_supported')")"
# Browser MCP clients (MCP Inspector) discover and register from their own origin.
acao(){ curl -s -i -X OPTIONS -H 'Origin: http://localhost:6274' -H 'access-control-request-method: POST' "$B$1" | tr -d '\r' | sed -n 's/^access-control-allow-origin: //Ip'; }
expect "CORS: AS metadata open to any origin" "*" "$(acao /.well-known/oauth-authorization-server/api/auth)"
expect "CORS: registration open to any origin" "*" "$(acao /api/auth/oauth2/register)"
expect "CORS: session routes stay web-only" "" "$(acao /api/me)"
rejected(){ reg "$1" | json "d.get('error')"; }
expect "remote http redirect_uri rejected" invalid_redirect_uri "$(rejected '{"client_name":"x","redirect_uris":["http://evil.example/cb"],"token_endpoint_auth_method":"none"}')"
expect "registration opting out of PKCE rejected" invalid_client_metadata "$(rejected '{"client_name":"x","redirect_uris":["http://127.0.0.1:8123/cb"],"token_endpoint_auth_method":"none","require_pkce":false}')"
expect "scope outside the allowed list rejected" invalid_scope "$(rejected '{"client_name":"x","redirect_uris":["http://127.0.0.1:8123/cb"],"token_endpoint_auth_method":"none","scope":"openid admin"}')"
expect "unknown metadata rejected" invalid_client_metadata "$(rejected '{"client_name":"x","redirect_uris":["http://127.0.0.1:8123/cb"],"token_endpoint_auth_method":"none","skip_consent":true}')"
expect "http logo_uri rejected" invalid_client_metadata "$(rejected '{"client_name":"x","redirect_uris":["http://127.0.0.1:8123/cb"],"token_endpoint_auth_method":"none","logo_uri":"http://evil.example/l.png"}')"
authz_error(){ curl -s -m 30 -i "$B/api/auth/oauth2/authorize?response_type=code&client_id=$CID&redirect_uri=$(q $RED)&scope=openid&state=s&resource=$(q $RES)$1" -H "cookie: $C" | grep -i '^location:' | tr -d '\r' | python3 -c "import sys,urllib.parse as u;print(u.parse_qs(u.urlparse(sys.stdin.read().split(' ',1)[1].strip()).query).get('error',[''])[0])"; }
expect "authorize without PKCE rejected" invalid_request "$(authz_error '')"
expect "authorize with PKCE plain rejected" invalid_request "$(authz_error "&code_challenge=$V&code_challenge_method=plain")"
LIMIT_IP=$(ip)
for _ in 1 2 3 4 5 6 7 8 9 10; do reg "$CLIENT" "$LIMIT_IP" > /dev/null; done
expect "11th registration from one IP within the hour" 429 "$(curl -s -m 30 -o /dev/null -w '%{http_code}' -X POST $B/api/auth/oauth2/register -H "$J" -H "x-forwarded-for: $LIMIT_IP" -d "$CLIENT")"
expect "another IP still registers" True "$(reg "$CLIENT" "$(ip)" | json "bool(d.get('client_id'))")"
exit $FAIL
