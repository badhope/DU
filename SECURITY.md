# Security Policy

## What this project stores

Tianji is a static site with no backend. Everything the user enters stays in the
browser:

| Data | Where it lives | Leaves the device? |
| --- | --- | --- |
| Question text | `localStorage` (`tianji.arena.v1`) | No |
| Birth date and time | `localStorage`, inside the same record | No |
| Chart facts and readings | `localStorage`, inside the same record | No |
| Votes and Elo ratings | `localStorage` | No |
| Claims and their outcomes | `localStorage` | No |
| Exported backup | A JSON file, only after you click export | Only where you save it |

The export file is **plaintext** and contains questions, birth data and readings.
Treat it as you would a personal note.

## Threat model — what "local only" does and does not mean

"No upload" is a property of this application's own code. It does not protect
against:

- browser extensions with permission to read page data or storage;
- another script running on the same origin, if the site is self-hosted
  alongside untrusted content;
- hosting provider access logs (request paths, IPs, timings);
- anyone you later share the exported JSON with;
- a compromised device.

If you need protection against those, use a hardened browser profile or a
dedicated device. This project will not claim more than it can deliver.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report privately through the repository's security advisory feature
(*Security → Advisories → Report a vulnerability*) on
<https://gitcode.com/badhope/DU/security/advisories>, or contact the maintainer
listed in `CITATION.cff`.

Please include:

- what the issue is and where it is (file, function, route);
- how to reproduce it, with a minimal case;
- what an attacker gains;
- whether it affects the default configuration.

You can expect an acknowledgement within 7 days. This is a volunteer project;
there is no bug bounty, but credit is given in the release notes unless you ask
otherwise.

## Scope

In scope:

- any code path that transmits user input off-origin;
- XSS through imported JSON, question text, or corpus content;
- storage corruption that survives validation and breaks the ledger;
- supply-chain issues in shipped dependencies.

Out of scope:

- the claim that astrology produces accurate predictions — the project does not
  make that claim, and the README states the leaderboard is a local record, not
  scientific evidence;
- reports requiring a malicious extension already installed in the user's
  browser;
- missing security headers on third-party hosting you control.

## Supported versions

Only the latest tagged release receives fixes.
