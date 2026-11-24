#!/usr/bin/env bash
# Browser auth contract over HTTP (spec identity/auth-api): sign-up -> verification mail (Mailpit) -> session, sign-in, sign-out, Google start.
# Needs apps/api on :3001 or API_BASE (its NITRO_AUTH_BASE_URL must match), migrated Postgres and Mailpit (docker compose up -d).
# EXPECT_GOOGLE=1 requires Google to be configured; otherwise both modes are accepted and reported.
set -u
. "$(dirname "$0")/lib-auth.sh"
S=$RANDOM$RANDOM; E="auth$S@t.co"; FAIL=0
expect(){ if [ "$2" = "$3" ]; then echo "ok   $1 ($2)"; else echo "FAIL $1: expected '$2', got '$3'"; FAIL=1; fi; }
status(){ head -1 | awk '{print $2}'; }
field(){ python3 -c "import json,sys;d=json.loads(sys.stdin.read().split('\r\n\r\n',1)[-1] or 'null');v=eval(sys.argv[1],{'d':d});print(' '.join(map(str,v)) if isinstance(v,tuple) else v)" "$1"; }
post(){ curl -s -m 30 -i -X POST "$B/api/auth/$1" -H "$J" -H "${3:-$O}" ${4:+-H "cookie: $4"} -d "$2"; }
session(){ curl -s -m 30 "$B/api/auth/get-session" -H "cookie: $1"; }
signin(){ post sign-in/email "{\"email\":\"$1\",\"password\":\"$2\"}"; }

R=$(signup_req "$E")
expect "sign-up accepted" 200 "$(echo "$R" | status)"
expect "sign-up sets no session cookie" "" "$(echo "$R" | cookies)"
expect "sign-up sends one verification mail" 1 "$(mail_link "$E" >/dev/null && mail_count "$E")"

R=$(signup_req "$E")
expect "duplicate email: same status" 200 "$(echo "$R" | status)"
expect "duplicate email: same shape, no token" "['token', 'user'] None" "$(echo "$R" | field "sorted(d), d['token']")"
expect "duplicate email: no session cookie" "" "$(echo "$R" | cookies)"

R=$(signup_req "short$S@t.co" "1234567")
expect "short password rejected" 400 "$(echo "$R" | status)"
sleep 1; expect "short password sends no mail" 0 "$(mail_count "short$S@t.co")"

R=$(signin "$E" password1234)
expect "unverified sign-in refused" "403 EMAIL_NOT_VERIFIED" "$(echo "$R" | status) $(echo "$R" | field "d['code']")"
expect "unverified sign-in sets no cookie" "" "$(echo "$R" | cookies)"
LINK=$(mail_link "$E" 2) || LINK=''
expect "unverified sign-in resends the mail" 2 "$(mail_count "$E")"

R=$(curl -s -m 30 -i "$(echo "$LINK" | sed 's/token=[^&]*/token=tampered/')")
expect "tampered token: error redirect" 1 "$(echo "$R" | grep -ic '^location:.*error=')"
expect "tampered token: no session" "" "$(echo "$R" | cookies)"

R=$(curl -s -m 30 -i "$LINK"); C=$(echo "$R" | cookies)
expect "verification redirects to the web" 1 "$(echo "$R" | grep -ic "^location: $WEB/verificar-email")"
expect "verification starts a verified session" "$E True" "$(session "$C" | field "d['user']['email'], d['user']['emailVerified']")"

R=$(signin "$E" password1234); C=$(echo "$R" | cookies)
expect "verified sign-in" 200 "$(echo "$R" | status)"
expect "verified sign-in session" "$E" "$(session "$C" | field "d['user']['email']")"

W=$(signin "$E" wrong-password1); U=$(signin "nobody$S@t.co" password1234)
expect "wrong password and unknown email look the same" "$(echo "$W" | status) $(echo "$W" | field "d['code']")" "$(echo "$U" | status) $(echo "$U" | field "d['code']")"

expect "foreign origin with cookies is rejected" 403 "$(post sign-out '{}' 'origin: http://evil.example' "$C" | status)"
expect "session survives the foreign request" "$E" "$(session "$C" | field "d['user']['email']")"
expect "sign-out" 200 "$(post sign-out '{}' "$O" "$C" | status)"
expect "no session after sign-out" None "$(session "$C" | field "d")"

R=$(post sign-in/social "{\"provider\":\"google\",\"callbackURL\":\"http://evil.example/x\"}")
expect "foreign callback URL rejected" 403 "$(echo "$R" | status)"
R=$(post sign-in/social "{\"provider\":\"google\",\"callbackURL\":\"$WEB/auth/complete\",\"errorCallbackURL\":\"$WEB/login?error=oauth\"}")
if [ "$(echo "$R" | status)" = 200 ]; then
  U=$(echo "$R" | field "d['url']")
  expect "google: authorization URL" accounts.google.com "$(python3 -c "import sys,urllib.parse;print(urllib.parse.urlparse(sys.argv[1]).hostname)" "$U")"
  expect "google: redirect_uri is the API callback" "$B/api/auth/callback/google" "$(python3 -c "import sys,urllib.parse;print(urllib.parse.parse_qs(urllib.parse.urlparse(sys.argv[1]).query)['redirect_uri'][0])" "$U")"
else
  [ "${EXPECT_GOOGLE:-0}" = 1 ] && expect "google configured" 200 "$(echo "$R" | status)"
  expect "google disabled: client error" 4 "$(echo "$R" | status | cut -c1)"
  expect "google disabled: no redirect" None "$(echo "$R" | field "d.get('url')")"
fi
exit $FAIL
