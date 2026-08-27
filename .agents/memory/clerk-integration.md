---
name: Clerk integration
description: Replit-managed Clerk requires the canonical host-aware client/provider and Express proxy wiring.
---

Use Clerk's host-aware publishable-key resolution, unconditional proxy URL, full base-prefixed sign-in/sign-up paths, and proxy middleware before Express body parsers.

**Why:** The app is served behind Replit artifact paths and may be published on a different host; copied-looking Clerk wiring can render locally while breaking OAuth or the production proxy.

**How to apply:** When extending auth, preserve the canonical route shapes `/sign-in/*?` and `/sign-up/*?`, keep browser auth cookie-based, and protect server mutations with Clerk's request auth context.