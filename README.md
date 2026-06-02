# Keycase

Keycase is a local-first encrypted vault for passwords, API keys, recovery codes, and private notes.

It is designed for developers and terminal-focused users who want a small local tool for managing private credentials.

> Status: early implementation. Core vault, crypto, generator, search, and storage modules are in progress. CLI and TUI flows are not complete yet.

## Product Goal

Running:

```sh
keycase
```

will open an interactive terminal UI by default.

From the TUI, users will be able to:

- create a local encrypted vault
- unlock it with a master password
- add, edit, delete, list, and search entries
- generate secure passwords
- copy secrets to the clipboard without printing them by default

## Planned CLI

The v1 CLI is planned to support:

```sh
keycase              # open TUI
keycase gen          # generate a secure password
keycase add          # add an entry through CLI prompts
keycase list         # list entries without secrets
keycase get <entry>  # show metadata without secret
keycase copy <entry> # copy secret to clipboard
keycase help         # show usage
```

Commands that read or modify vault contents will prompt for the master password with hidden input.

Keycase v1 will not support passing the master password through flags or environment variables.

## Security Model

Keycase stores vault data locally at:

```sh
~/.keycase/vault.enc
```

Security requirements for v1:

- master password is never stored
- vault contents are encrypted on disk
- plaintext exists only while the vault is unlocked in memory
- secrets are hidden by default
- `list` and `get` do not print secrets
- secret copy requires explicit user action
- clipboard clearing is attempted after a timeout

Crypto defaults:

- key derivation: Argon2id
- encryption: AES-256-GCM
- unique salt per vault
- unique IV per encryption
- authenticated encryption

Important: Keycase cannot recover your vault if you forget your master password.

## Development

Install dependencies:

```sh
npm install
```

Run tests:

```sh
npm test
```

Typecheck:

```sh
npm run typecheck
```

Build:

```sh
npm run build
```

Run the development CLI:

```sh
npm run dev -- help
```

Run the OpenTUI flow in development with Bun:

```sh
npm run dev:tui
```

OpenTUI currently requires Bun or a Node.js build with `node:ffi` support.

After building, run the built CLI:

```sh
./dist/index.js help
```

## Current Implementation

Implemented so far:

- TypeScript project scaffold
- build/test/typecheck scripts
- vault schemas and public entry projection
- default vault path helpers
- Argon2id key derivation
- AES-256-GCM vault encryption/decryption
- encrypted vault file read/write
- restrictive file permissions where supported
- vault create/unlock/save helpers
- add/edit/delete/list/get/copy-secret core operations
- exact entry lookup by ID or name
- ambiguous lookup failure
- secure password generator
- case-insensitive search
- clipboard copy and best-effort conditional clearing
- CLI commands for generate, add, list, get, and copy
- OpenTUI app shell with first-run setup and unlock screens
- core and CLI test coverage

Not implemented yet:

- full OpenTUI vault management screens
- README usage examples for completed CLI/TUI flows

## Documentation

Project planning docs live in `.docs/`:

- `.docs/prd.md` — product requirements
- `.docs/implementation-plan.md` — phased implementation checklist
