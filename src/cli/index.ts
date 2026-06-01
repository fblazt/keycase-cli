#!/usr/bin/env node

const USAGE = `Keycase — a local encrypted vault for your terminal.

Usage:
  keycase            Open the interactive terminal UI
  keycase help       Show command usage

Commands planned for v1:
  keycase gen
  keycase add
  keycase list
  keycase get <entry>
  keycase copy <entry>
`;

function main(args: string[]): void {
  const [command] = args;

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(USAGE);
    return;
  }

  if (command) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "keycase help" for usage.');
    process.exitCode = 1;
    return;
  }

  console.log("Keycase TUI is not implemented yet.");
  console.log('Run "keycase help" for usage.');
}

main(process.argv.slice(2));
