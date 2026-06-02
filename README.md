# Keycase

Keycase is a local-first encrypted vault for passwords, API keys, recovery codes, and private notes.

It is designed for developers and terminal-focused users who want a small local tool for managing private credentials.

## Status

Keycase is in early v1 development. Core vault encryption, storage, CLI commands, and OpenTUI screens are implemented. Treat releases as pre-production until more manual QA has been completed across platforms.

## Usage

Build first:

```sh
npm install
npm run build
```

Show help:

```sh
./dist/index.js help
```

Generate a password:

```sh
./dist/index.js gen
./dist/index.js gen --length 32
```

Generate a numeric password:

```sh
./dist/index.js gen --length 12 --uppercase false --lowercase false --symbols false
```

Open the TUI:

```sh
./dist/index.js
```

OpenTUI currently requires Bun or a Node.js build with `node:ffi` support. In development, use:

```sh
npm run dev:tui
```

## CLI Commands

```sh
keycase              # open TUI
keycase gen          # generate a secure password
keycase add          # add an entry through CLI prompts
keycase list         # list entries without secrets
keycase get <entry>  # show metadata without secret
keycase copy <entry> # copy secret to clipboard
keycase help         # show usage
```

Vault-backed commands prompt for the master password with hidden input.

Keycase v1 does not support passing the master password through flags or environment variables.

`<entry>` may be an entry ID or exact entry name. Ambiguous entry names fail without revealing or copying secrets.

## TUI Flow

Running `keycase` opens the TUI by default.

First run:

1. Keycase checks for `~/.keycase/vault.enc`.
2. If no vault exists, Keycase shows first-run setup.
3. The setup screen warns that forgotten master passwords cannot be recovered.
4. Password input is masked.
5. Empty passwords and mismatched confirmation are rejected.
6. A valid setup creates the encrypted vault and opens the vault screen.

Normal run:

1. Keycase shows the unlock screen.
2. Password input is masked.
3. Correct password opens the vault screen.
4. Wrong password shows a clear error and allows retry.

Vault screen shortcuts:

```txt
/      search
↑/↓    select entry
j/k    select entry
a      add entry
g      generate password
c      copy selected secret
e      edit selected entry
d      delete selected entry
ctrl+c quit
esc    cancel/back
enter  continue/confirm where applicable
```

## Security Model

Keycase stores vault data locally at:

```sh
~/.keycase/vault.enc
```

Security behavior:

- master password is never stored
- vault contents are encrypted on disk
- plaintext exists only while the vault is unlocked in memory
- secrets are hidden by default
- saved secrets are not printed by `list` or `get`
- secret copy requires explicit user action
- clipboard clearing is attempted after 30 seconds
- clipboard clearing only clears if the clipboard still contains the copied secret
- clipboard clearing is best-effort and platform-dependent

Crypto defaults:

- key derivation: Argon2id
- Argon2id memory cost: 65536 KiB
- Argon2id time cost: 3
- Argon2id parallelism: 1
- salt length: at least 16 bytes
- derived key length: 32 bytes
- encryption: AES-256-GCM
- unique salt per vault
- unique IV per encryption
- authenticated encryption

File permissions where supported:

- `~/.keycase`: `0700`
- `~/.keycase/vault.enc`: `0600`

Important: Keycase cannot recover your vault if you forget your master password.

## Platform Support

v1 target platforms:

- macOS
- Linux
- Windows best-effort

Clipboard, file permissions, and OpenTUI runtime support may vary by platform.

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

After building, run the built CLI:

```sh
./dist/index.js help
```

## Manual QA

Manual QA instructions live in:

```txt
.docs/manual-qa.md
```

## Documentation

Project planning docs live in `.docs/`:

- `.docs/prd.md` — product requirements
- `.docs/implementation-plan.md` — phased implementation checklist
- `.docs/manual-qa.md` — manual QA checklist
