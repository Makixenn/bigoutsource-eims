# OWASP ZAP Security Scan Findings (July 2026)

## 1. Overview
Before finalizing the handover of EIMS, an automated security scan was conducted using **OWASP ZAP (Zed Attack Proxy)**. The scan predominantly identified Medium, Low, and Informational risk findings. No High-risk vulnerabilities were identified in the automated scan.

This document serves as a handover notification to the next development team regarding the current security posture of the application.

## 2. Resolved Vulnerabilities
During the final phases of development, the following issues highlighted in the OWASP ZAP report were successfully mitigated:

- **Security Headers & CSP:** The backend was fortified with `helmet`, which now enforces strict Content Security Policies, disables frame rendering to prevent Clickjacking, and disables MIME-sniffing.
- **Cross-Domain Misconfigurations:** The backend CORS configuration was locked down from wildcard (`*`) to a strict environment-based origin whitelist.
- **Cache Directives:** API endpoints were updated to force `Cache-Control: no-cache, no-store` to prevent browsers from caching sensitive JSON responses.
- **Cookie Warnings (False Positives):** The report flagged missing `HttpOnly` and `Secure` flags on cookies. However, EIMS authenticates via Bearer Tokens, not cookies. These warnings can be safely ignored.

## 3. UNRESOLVED Vulnerability: JWT in `localStorage`
> [!CAUTION]
> **Information Disclosure - JWT in Browser localStorage**
> The most critical unresolved finding from the scan is the continued storage of JSON Web Tokens (JWT) in the browser's `localStorage` (`eims_auth_token` and `eims_refresh_token`).

### The Risk
Because the tokens are stored in `localStorage`, they are accessible to any JavaScript executed on the page. If the application ever becomes vulnerable to Cross-Site Scripting (XSS), an attacker could execute a malicious script to silently steal an Administrator's active session token and gain full access to the HR system.

### Recommended Remediation for Future Developers
The next development team should prioritize migrating the authentication architecture to use **Secure HttpOnly Cookies**.
1. **Backend (`auth.controller.js`):** Modify the login/refresh controllers to issue `res.cookie('eims_auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax' })` instead of returning the raw token in the JSON payload.
2. **Backend Middleware (`auth.middleware.js`):** Update the authenticator to read from `req.cookies`.
3. **Frontend (`api.js`):** Remove all `localStorage.setItem` logic. Update the `fetch()` wrapper to include `credentials: 'include'` so the browser automatically handles the secure cookies.
