#!/usr/bin/env bash
# OAuth + MCP smoke test: authorize -> consent -> token -> POST /mcp. Needs apps/api (:3001, NITRO_AUTH_SECRET set),
# apps/mcp (:3002) and migrated Postgres. Expect: mcp with token 200, without token 401.
set -u
B=http://localhost:3001; J='content-type: application/json'; O='origin: http://localhost:3000'; S=$RANDOM
RES=http://localhost:3002/mcp; RED=http://127.0.0.1:8123/cb
C=$(curl -s -m 30 -i -X POST $B/api/auth/sign-up/email -H "$J" -H "$O" -d "{\"email\":\"p$S@t.co\",\"password\":\"password1234\",\"name\":\"P\"}" | grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//' | paste -sd';' -)
ORG=$(curl -s -m 30 -X POST $B/api/auth/organization/create -H "$J" -H "$O" -H "cookie: $C" -d "{\"name\":\"p\",\"slug\":\"p$S\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
CID=$(curl -s -m 30 -X POST $B/api/auth/oauth2/create-client -H "$J" -H "$O" -H "cookie: $C" -d "{\"client_name\":\"e2e\",\"application_type\":\"native\",\"redirect_uris\":[\"$RED\"],\"token_endpoint_auth_method\":\"none\",\"grant_types\":[\"authorization_code\",\"refresh_token\"],\"response_types\":[\"code\"],\"scope\":\"openid profile email offline_access\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('client_id') or d)")
echo "client: $CID"
V=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))"); CH=$(python3 -c "import hashlib,base64,sys;print(base64.urlsafe_b64encode(hashlib.sha256(sys.argv[1].encode()).digest()).rstrip(b'=').decode())" "$V")
URL="$B/api/auth/oauth2/authorize?response_type=code&client_id=$CID&redirect_uri=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" $RED)&scope=openid%20profile&code_challenge=$CH&code_challenge_method=S256&state=xyz&resource=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" $RES)"
echo "--- authorize (signed in)"; LOC=$(curl -s -m 30 -i "$URL" -H "cookie: $C" | grep -i '^location:' | sed 's/^[Ll]ocation: //' | tr -d '\r'); echo "$LOC" | cut -c1-160
echo "--- authorize (anonymous)"; curl -s -m 30 -i "$URL" | grep -i '^location:' | cut -c1-110
Q=${LOC#*\?}
echo "--- consent"; R=$(curl -s -m 30 -X POST $B/api/auth/oauth2/consent -H "$J" -H "$O" -H "cookie: $C" -d "{\"accept\":true,\"oauth_query\":\"$Q\"}"); echo "$R" | cut -c1-200
CB=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))"); CODE=$(python3 -c "import urllib.parse,sys;print(urllib.parse.parse_qs(urllib.parse.urlparse(sys.argv[1]).query).get('code',[''])[0])" "$CB")
echo "--- token"; T=$(curl -s -m 30 -X POST $B/api/auth/oauth2/token -H 'content-type: application/x-www-form-urlencoded' --data-urlencode grant_type=authorization_code --data-urlencode code=$CODE --data-urlencode code_verifier=$V --data-urlencode redirect_uri=$RED --data-urlencode client_id=$CID --data-urlencode resource=$RES); echo "$T" | cut -c1-120
AT=$(echo "$T" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
echo "--- mcp with token (200 expected)"; curl -s -m 30 -o /dev/null -w "%{http_code}\n" -X POST $RES -H "authorization: Bearer $AT" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
echo "--- mcp no token (401)"; curl -s -m 30 -o /dev/null -w "%{http_code}\n" -X POST $RES -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
