# Sourced by the e2e scripts. Sign-up needs a verified email before any session (Mailpit catches the mail).
# Overrides: API_BASE (default http://localhost:3001), WEB_ORIGIN (http://localhost:3000), MAILPIT (http://localhost:8025).
B=${API_BASE:-http://localhost:3001}; WEB=${WEB_ORIGIN:-http://localhost:3000}; MAILPIT=${MAILPIT:-http://localhost:8025}
O="origin: $WEB"; J='content-type: application/json'
# Set-Cookie headers of a `curl -i` response -> "a=1;b=2".
cookies(){ grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//' | paste -sd';' -; }
# Verification link of the newest mail to $1, once at least ${2:-1} mails reached it. Fails after ~10s.
mail_link(){ python3 - "$MAILPIT" "$1" "${2:-1}" <<'PY'
import json, re, sys, time, urllib.parse, urllib.request
base, to, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
get = lambda path: json.load(urllib.request.urlopen(base + path, timeout=10))
for _ in range(50):
    msgs = get('/api/v1/search?query=' + urllib.parse.quote(f'to:"{to}"'))['messages']
    if len(msgs) >= n:
        link = re.search(r'https?://\S+/verify-email\?\S+', get('/api/v1/message/' + msgs[0]['ID'])['Text'])
        print(link.group(0) if link else ''); sys.exit(0 if link else 1)
    time.sleep(0.2)
sys.exit(1)
PY
}
mail_count(){ python3 -c "import json,sys,urllib.parse,urllib.request;print(json.load(urllib.request.urlopen(sys.argv[1]+'/api/v1/search?query='+urllib.parse.quote('to:\"%s\"'%sys.argv[2]),timeout=10))['messages_count'])" "$MAILPIT" "$1"; }
signup_req(){ curl -s -m 30 -i -X POST $B/api/auth/sign-up/email -H "$J" -H "$O" -d "{\"email\":\"$1\",\"password\":\"${2:-password1234}\",\"name\":\"e2e\",\"callbackURL\":\"$WEB/verificar-email\"}"; }
# Sign up $1, open the emailed link, print the session cookie.
verified_signup(){ local link; signup_req "$1" > /dev/null; link=$(mail_link "$1") || return 1; curl -s -m 30 -i "$link" | cookies; }
