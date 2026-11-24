# Spec Delta

## Purpose

Defines the server-side identity behavior that the web authentication screens rely on: email/password with verified emails, Google sign-in, cookie sessions, verification email delivery, and the origin, callback and secret rules that protect them.

## ADDED Requirements

### Requirement: Email password registration
The API SHALL accept sign-up with name, email and password under `/api/auth`, enforce a password length of 8 to 128 characters, send a verification email, and SHALL NOT start a session until the email is verified.

#### Scenario: Valid registration
- **WHEN** the web origin posts a name, a new email and an 8-character password to sign-up
- **THEN** the API responds with success, sets no session cookie, and one verification email is sent to that address

#### Scenario: Email already registered
- **WHEN** sign-up receives an email that already has an account
- **THEN** the response has the same status and shape as for a new email and no session is started

#### Scenario: Password outside policy
- **WHEN** sign-up receives a password shorter than 8 or longer than 128 characters
- **THEN** the API rejects it with a client error and creates no account and sends no email

### Requirement: Email verification
The verification email SHALL contain a single-use, expiring link to the API that marks the email verified, starts a session cookie, and redirects to the requested web callback.

#### Scenario: Open verification link
- **WHEN** the link from the verification email is opened
- **THEN** the email is marked verified, an HttpOnly session cookie is set, the browser is redirected to the web callback, and get-session returns that user with `emailVerified: true`

#### Scenario: Invalid or expired link
- **WHEN** a verification link with a tampered or expired token is opened
- **THEN** the email stays unverified, no session is started, and the browser is redirected to the web callback with an error indicator

### Requirement: Email password sign-in
The API SHALL start a session for a correct email and password of a verified account, SHALL refuse unverified accounts with `EMAIL_NOT_VERIFIED` and resend the verification email, and SHALL reject wrong credentials without revealing whether the account exists.

#### Scenario: Correct credentials, verified email
- **WHEN** the web origin posts the email and password of a verified account to sign-in
- **THEN** the API sets an HttpOnly session cookie and get-session returns that user

#### Scenario: Correct credentials, unverified email
- **WHEN** sign-in receives the correct password of an account whose email is unverified
- **THEN** the API responds with error code `EMAIL_NOT_VERIFIED`, sets no session cookie, and sends a new verification email

#### Scenario: Wrong password or unknown email
- **WHEN** sign-in receives a wrong password, or an email with no account
- **THEN** both cases get the same error code and status, and no session cookie is set

### Requirement: Session lookup and sign-out
The API SHALL return the current user and session for a valid session cookie, an empty session without one, and SHALL invalidate the session on sign-out.

#### Scenario: Sign-out
- **WHEN** a signed-in browser calls sign-out and then get-session with the same cookies
- **THEN** get-session returns no session

### Requirement: Verification email delivery
The API SHALL send verification emails through Resend when a Resend API key is configured, and otherwise, outside production, through the local SMTP server (Mailpit by default). Emails SHALL come from the configured sender address.

#### Scenario: Local development without Resend
- **WHEN** the API runs outside production with no Resend API key and a user signs up
- **THEN** the verification email is delivered to the configured SMTP host and port and appears in the Mailpit API

#### Scenario: Resend configured
- **WHEN** a Resend API key and sender address are configured and a user signs up
- **THEN** the verification email is sent through Resend and nothing is sent over local SMTP

#### Scenario: Delivery failure
- **WHEN** the email provider fails or is unreachable during sign-up
- **THEN** the sign-up response is unchanged, and the failure is logged without the recipient's token or verification URL

### Requirement: Production email configuration is mandatory
In production the API SHALL refuse to start unless both the Resend API key and the sender address are configured, and SHALL never fall back to local SMTP.

#### Scenario: Missing Resend settings in production
- **WHEN** the API starts in production without the Resend API key or without the sender address
- **THEN** startup fails with an error naming the missing keys, never their values

### Requirement: Google sign-in
When Google credentials are configured, the API SHALL start Google OAuth with the API's own callback (`<auth base URL>/api/auth/callback/google`), handle the provider return, create or reuse the user, set the session cookie, and redirect the browser to the requested web callback.

#### Scenario: Start Google sign-in
- **WHEN** the web origin calls social sign-in with provider `google` and web callback URLs
- **THEN** the API returns a Google authorization URL whose `redirect_uri` is the API callback, not a web URL

#### Scenario: Google not configured
- **WHEN** Google credentials are not configured and social sign-in is called with provider `google`
- **THEN** the API returns a client error and no redirect, and email/password keeps working

#### Scenario: Provider error or cancellation
- **WHEN** Google returns an error or the user cancels
- **THEN** the API redirects to the requested error callback and sets no session

### Requirement: Google linking requires a verified local email
The API SHALL attach a Google identity to an existing account with the same email only if that account's email is verified; otherwise it SHALL refuse, so whoever pre-registered an email cannot share the real owner's account.

#### Scenario: Google email matches an unverified password account
- **WHEN** a Google sign-in returns an email that belongs to an email/password account with an unverified email
- **THEN** the API does not link or sign in to that account and redirects to the error callback

#### Scenario: Google email matches a verified password account
- **WHEN** a Google sign-in returns a provider-verified email that belongs to an email/password account whose email is verified
- **THEN** the API links Google to that account, starts a session for it, and redirects to the success callback

### Requirement: Trusted origins and callbacks
The API SHALL accept credentialed auth requests and redirect callbacks only for the configured web origin, and SHALL reject any other origin or callback URL.

#### Scenario: Foreign callback URL
- **WHEN** social sign-in or sign-up is called with a callback URL on an origin other than the web origin
- **THEN** the API rejects the request and does not redirect there

#### Scenario: Foreign request origin
- **WHEN** a state-changing auth request sends the browser's cookies with an `Origin` header other than the web origin
- **THEN** the API rejects it and changes no session

### Requirement: Provider secrets stay on the server
Google and Resend credentials SHALL come only from server configuration, Google ID and secret SHALL be configured both or neither, and no credential SHALL appear in web runtime config, web bundles, logs or error messages.

#### Scenario: Partial Google configuration
- **WHEN** the API starts with only one of the Google client ID and secret set
- **THEN** startup fails with an error naming the missing key, never its value
