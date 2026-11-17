#!/usr/bin/env bash
# Tenant isolation smoke test. Needs apps/api running on :3001 (NITRO_AUTH_SECRET set) and migrated Postgres.
# Creates throwaway users/orgs. Each line prints "<what> (<expected>): <actual>"; expected must equal actual.
set -u
B=http://localhost:3001; O='origin: http://localhost:3000'; J='content-type: application/json'
S=$RANDOM
signup(){ curl -s -m 30 -i -X POST $B/api/auth/sign-up/email -H "$J" -H "$O" -d "{\"email\":\"$1$S@t.co\",\"password\":\"password1234\",\"name\":\"$1\"}" | grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//' | paste -sd';' -; }
CA=$(signup alice); CB=$(signup bob)
org(){ curl -s -m 30 -X POST $B/api/auth/organization/create -H "$J" -H "$O" -H "cookie: $1" -d "{\"name\":\"$2\",\"slug\":\"$2$S\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])"; }
OA=$(org "$CA" orga); OB=$(org "$CB" orgb)
curl -s -m 30 -o /dev/null -X POST $B/api/auth/organization/set-active -H "$J" -H "$O" -H "cookie: $CA" -d "{\"organizationId\":\"$OA\"}"
curl -s -m 30 -o /dev/null -X POST $B/api/auth/organization/set-active -H "$J" -H "$O" -H "cookie: $CB" -d "{\"organizationId\":\"$OB\"}"
code(){ curl -s -m 30 -o /dev/null -w '%{http_code}' "$@"; }
echo "alice own tenant      (200): $(code -H "cookie: $CA" $B/api/tenants/$OA/me)"
echo "alice other tenant    (403): $(code -H "cookie: $CA" $B/api/tenants/$OB/me)"
echo "bob own tenant        (200): $(code -H "cookie: $CB" $B/api/tenants/$OB/me)"
echo "no credentials        (401): $(code $B/api/tenants/$OA/me)"
echo "--- api keys via server route"
mk(){ curl -s -m 30 -w '\n%{http_code}' -X POST $B/api/tenants/$1/api-keys -H "$J" -H "$O" -H "cookie: $2" -d "$3"; }
K=$(echo "$R" | sed '$d' | python3 -c "import sys,json; print(json.load(sys.stdin).get('key',''))")
echo "bob creates key for A (403): $(echo "$(mk $OA "$CB" '{"name":"x","scopes":["agenda:own"]}')" | tail -1)"
echo "alice key with apikeys:manage scope (400): $(echo "$(mk $OA "$CA" '{"name":"x","scopes":["apikeys:manage"]}')" | tail -1)"
echo "key own tenant        (200): $(code -H "x-api-key: $K" $B/api/tenants/$OA/me)"
echo "key other tenant      (403): $(code -H "x-api-key: $K" $B/api/tenants/$OB/me)"
echo "key can't mint keys   (403): $(code -X POST $B/api/tenants/$OA/api-keys -H "$J" -H "x-api-key: $K" -d '{"name":"y","scopes":["agenda:own"]}')"
echo "bad key               (401): $(code -H "x-api-key: org_nope" $B/api/tenants/$OA/me)"
