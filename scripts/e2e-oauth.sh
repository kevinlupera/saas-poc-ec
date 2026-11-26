#!/usr/bin/env bash
# OAuth + MCP smoke test: authorize -> consent -> token -> POST /mcp on the API. Needs apps/api (:3001 or API_BASE,
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
CID=$(curl -s -m 30 -X POST $B/api/auth/oauth2/create-client -H "$J" -H "$O" -H "cookie: $C" -d "{\"client_name\":\"e2e\",\"application_type\":\"native\",\"redirect_uris\":[\"$RED\"],\"token_endpoint_auth_method\":\"none\",\"grant_types\":[\"authorization_code\",\"refresh_token\"],\"response_types\":[\"code\"],\"scope\":\"openid profile email offline_access\"}" | json "d.get('client_id') or d")
echo "client: $CID"
[ -n "$C" ] && [ -n "$ORG" ] && [[ "$CID" =~ ^[A-Za-z0-9_-]{16,}$ ]] || { echo "FAIL setup (sign-up/org/client)"; exit 1; }

V=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))"); CH=$(python3 -c "import hashlib,base64,sys;print(base64.urlsafe_b64encode(hashlib.sha256(sys.argv[1].encode()).digest()).rstrip(b'=').decode())" "$V")
URL="$B/api/auth/oauth2/authorize?response_type=code&client_id=$CID&redirect_uri=$(q $RED)&scope=openid%20profile&code_challenge=$CH&code_challenge_method=S256&state=xyz&resource=$(q $RES)"
LOC=$(curl -s -m 30 -i "$URL" -H "cookie: $C" | grep -i '^location:' | sed 's/^[Ll]ocation: //' | tr -d '\r')
echo "authorize (signed in) -> $(echo "$LOC" | cut -c1-100)"
Q=${LOC#*\?}
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
expect "session cookie only" 401 "$(mcp_code -H "cookie: $C")"
expect "api key only" 401 "$(mcp_code -H "x-api-key: org_not-a-bearer-token")"
# Same issuer and signing key, other audience (the client): must not be accepted as an MCP token.
[ -n "$IDT" ] && expect "id_token (other audience)" 401 "$(mcp_code -H "authorization: Bearer $IDT")"
expect "tampered token" 401 "$(mcp_code -H "authorization: Bearer ${AT%?}x")"

echo "--- consent screen can show the client name"
expect "client name" e2e "$(curl -s -m 30 "$B/api/auth/oauth2/public-client?client_id=$CID" -H "cookie: $C" | json "d.get('client_name')")"
exit $FAIL
