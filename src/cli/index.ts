#!/usr/bin/env node

import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";

import { runAddCommand } from "./commands/add.js";
import { runCopyCommand } from "./commands/copy.js";
import { runGenCommand } from "./commands/gen.js";
import { runGetCommand } from "./commands/get.js";
import { runListCommand } from "./commands/list.js";
import { createCliContext } from "./context.js";

export function createProgram(): Command {
  const context = createCliContext();
  const program = new Command();

  program
    .name("keycase")
    .description("A local encrypted vault for your terminal.")
    .showHelpAfterError()
    .action(() => {
      context.write("Keycase TUI is not implemented yet.");
    });

  program
    .command("gen")
    .description("Generate a secure password.")
    .option("-l, --length <number>", "password length", parsePositiveInteger)
    .addOption(new Option("--uppercase <boolean>", "include uppercase letters").argParser(parseBoolean))
    .addOption(new Option("--lowercase <boolean>", "include lowercase letters").argParser(parseBoolean))
    .addOption(new Option("--numbers <boolean>", "include numbers").argParser(parseBoolean))
    .addOption(new Option("--symbols <boolean>", "include symbols").argParser(parseBoolean))
    .action((options: { length?: number; uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean }) => {
      runGenCommand(context, options);
    });

  program
    .command("add")
    .description("Add a new entry through CLI prompts.")
    .action(async () => runAddCommand(context));

  program
    .command("list")
    .description("List saved entries without showing secrets.")
    .action(async () => runListCommand(context));

  program
    .command("get")
    .description("Show entry metadata without showing the secret.")
    .argument("<entry>", "entry ID or exact entry name")
    .action(async (entry: string) => runGetCommand(context, entry));

  program
    .command("copy")
    .description("Copy an entry secret to clipboard.")
    .argument("<entry>", "entry ID or exact entry name")
    .action(async (entry: string) => runCopyCommand(context, entry));

  program
    .command("help")
    .description("Show command usage.")
    .action(() => {
      program.outputHelp();
    });

  return program;
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Expected a positive integer.");
  }

  return parsed;
}

function parseBoolean(value: string): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("Expected true or false.");
}

async function main(): Promise<void> {
  try {
    await createProgram().parseAsync(process.argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Command failed.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
