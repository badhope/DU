# Security Policy

## What this project stores

There are two storage modes. Both keep data on your machine, but they are not
the same thing, and the earlier version of this document wrongly claimed there
was no backend at all.

### Web app (default)

| Data | Where it lives | Leaves the device? |
| --- | --- | --- |
| Question text | `localStorage` (`tianji.arena.v1`) | No |
| Birth date and time | `localStorage`, same record | No |
| Chart facts and readings | `localStorage`, same record | No |
| Votes, Elo, claims | `localStorage` | No |
| Quarantined corrupt data | `localStorage` (`tianji.arena.quarantine`) | No |
| Exported backup | A JSON file, only after you click export | Only where you save it |

### `tianji serve` (optional local server)

| Data | Where it lives | Notes |
| --- | --- | --- |
| Everything above | SQLite at `%LOCALAPPDATA%\Tianji\ledger.db` (or `$XDG_DATA_HOME/tianji`) | **Plaintext.** `PRAGMA secure_delete=ON`, directory mode `0700`. |
| API access | Token in the same directory (`token`, mode `0600`) | Required for non-browser clients |

The server listens on `127.0.0.1` only. Requests must have a loopback `Host`;
cross-site `Origin` is rejected. This blocks DNS-rebinding and cross-site writes,
but it does **not** protect against other processes running as your user — any
such process can read the database file. If that matters, use the web app only.

`tianji reset --yes` deletes every row, then `VACUUM`s and truncates the WAL, so
deleted records do not linger in free pages.

### Exports

Both modes export **plaintext** JSON containing questions, birth data and
readings, with no embedded warning beyond the UI notice. Treat the file as you
would a personal note.

### MCP server

`tianji mcp` speaks stdio and makes no network calls. But the client you connect
it to (Claude Desktop, VS Code, Cursor, …) may be a cloud product: the question
text, readings and claims you ask for become tool arguments and results, and
therefore enter that client's model context and request logs. Birth data is
refused unless you pass `allowBirth: true` explicitly. Use a local model if this
matters to you.

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
