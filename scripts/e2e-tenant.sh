#!/usr/bin/env bash
# Tenant isolation smoke test. Needs apps/api running on :3001 or API_BASE (NITRO_AUTH_SECRET set), Mailpit and Postgres migrated
# with the saas_app role created (`APP_DB_PASSWORD=saas_app pnpm --filter @saas/db db:app-role`).
# Creates throwaway users/orgs. Exits non-zero if any expectation fails.
set -u
. "$(dirname "$0")/lib-auth.sh"
S=$RANDOM; FAIL=0
expect(){ if [ "$2" = "$3" ]; then echo "ok   $1 ($2)"; else echo "FAIL $1: expected $2, got $3"; FAIL=1; fi; }
code(){ curl -s -m 30 -o /dev/null -w '%{http_code}' "$@"; }
signup(){ verified_signup "$1$S@t.co"; }
org(){ curl -s -m 30 -X POST $B/api/auth/organization/create -H "$J" -H "$O" -H "cookie: $1" -d "{\"name\":\"$2\",\"slug\":\"$2$S\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])"; }
setactive(){ curl -s -m 30 -o /dev/null -X POST $B/api/auth/organization/set-active -H "$J" -H "$O" -H "cookie: $1" -d "{\"organizationId\":\"$2\"}"; }
mk(){ curl -s -m 30 -w '\n%{http_code}' -X POST $B/api/tenants/$1/api-keys -H "$J" -H "$O" -H "cookie: $2" -d "$3"; }

CA=$(signup alice); CB=$(signup bob)
OA=$(org "$CA" orga); OB=$(org "$CB" orgb)
setactive "$CA" "$OA"; setactive "$CB" "$OB"

expect "alice own tenant" 200 "$(code -H "cookie: $CA" $B/api/tenants/$OA/me)"
expect "alice other tenant" 403 "$(code -H "cookie: $CA" $B/api/tenants/$OB/me)"
expect "bob own tenant" 200 "$(code -H "cookie: $CB" $B/api/tenants/$OB/me)"
expect "no credentials" 401 "$(code $B/api/tenants/$OA/me)"

R=$(mk $OA "$CA" '{"name":"k","scopes":["agenda:own"]}')
expect "alice creates key for her tenant" 200 "$(echo "$R" | tail -1)"
K=$(echo "$R" | sed '$d' | python3 -c "import sys,json; print(json.load(sys.stdin).get('key',''))")
[ -n "$K" ] || { echo "FAIL no key returned"; exit 1; }
expect "bob creates key for alice's tenant" 403 "$(mk $OA "$CB" '{"name":"x","scopes":["agenda:own"]}' | tail -1)"
expect "key with apikeys:manage scope is rejected" 400 "$(mk $OA "$CA" '{"name":"x","scopes":["apikeys:manage"]}' | tail -1)"
expect "key own tenant" 200 "$(code -H "x-api-key: $K" $B/api/tenants/$OA/me)"
expect "key other tenant" 403 "$(code -H "x-api-key: $K" $B/api/tenants/$OB/me)"
expect "key cannot mint keys" 403 "$(code -X POST $B/api/tenants/$OA/api-keys -H "$J" -H "x-api-key: $K" -d '{"name":"y","scopes":["agenda:own"]}')"
expect "invalid key" 401 "$(code -H "x-api-key: org_nope" $B/api/tenants/$OA/me)"
exit $FAIL
