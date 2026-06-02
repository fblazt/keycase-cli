import { generatePassword, type PasswordGeneratorOptions } from "../../core/generator.js";
import type { CliContext } from "../context.js";

export function runGenCommand(context: CliContext, options: PasswordGeneratorOptions = {}): void {
  context.write(generatePassword(options));
}
