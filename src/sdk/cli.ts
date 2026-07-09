#!/usr/bin/env bun

import { loadConfig, type EnvokerConfigFile } from "./cli-config";
import { generateEnvExample } from "./cli-config";
import { runCheck } from "./cli-config";
import { typeToSchema, type SchemaField } from "./schema";
import { encryptEnv, decryptEnv } from "./encryption";
import { color, icon, formatCheckResult, formatSummary, suggestKeys } from "./cli-format";

interface ParsedArgs {
  command: string;
  configPath: string;
  output: string;
  profile?: string;
  key?: string;
  input?: string;
  allProfiles: boolean;
  wantsHelp: boolean;
  helpTopic: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    command: "",
    configPath: "",
    output: "",
    wantsHelp: false,
    helpTopic: "",
    allProfiles: false,
  };

  let i = 0;

  const first = argv[i];
  if (first !== undefined && !first.startsWith("-")) {
    const val = first;
    if (val === "help") {
      args.command = "help";
      i++;
      args.helpTopic = argv[i] ?? "";
      return args;
    }
    args.command = val;
    i++;
  }

  while (i < argv.length) {
    const arg = argv[i] as string;
    if (arg === "-c" || arg === "--config") {
      i++;
      args.configPath = argv[i] ?? "";
    } else if (arg === "-o" || arg === "--output") {
      i++;
      args.output = argv[i] ?? ".env.example";
    } else if (arg === "--profile") {
      i++;
      args.profile = argv[i] ?? undefined;
    } else if (arg === "--all-profiles") {
      args.allProfiles = true;
    } else if (arg === "--key") {
      i++;
      args.key = argv[i] ?? undefined;
    } else if (arg === "-i" || arg === "--input") {
      i++;
      args.input = argv[i] ?? ".env";
    } else if (arg === "--help" || arg === "-h") {
      args.wantsHelp = true;
    } else if (args.command === "" && !arg.startsWith("-") && !args.wantsHelp) {
      args.command = arg;
    }
    i++;
  }

  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.wantsHelp || args.command === "help") {
    const topic = args.command === "help" ? args.helpTopic : args.command;
    printHelp(topic);
    return;
  }

  if (args.command === "") {
    if (args.configPath || args.profile || args.key || args.input || args.allProfiles) {
      console.error(
        ` ${icon.fail} Missing command. Use ${color.cyan("envoker <command> [options]")}`
      );
      console.error(`     Run ${color.cyan("envoker --help")} to see available commands`);
      process.exit(1);
    }
    printHelp("");
    return;
  }

  switch (args.command) {
    case "init":
      await handleInit(args);
      break;
    case "check":
      await handleCheck(args);
      break;
    case "encrypt":
      await handleEncrypt(args);
      break;
    case "decrypt":
      await handleDecrypt(args);
      break;
    case "rotate":
      handleRotate(args);
      return;
    case "drift":
      await handleDrift(args);
      break;
    case "docker":
      await handleDockerCheck(args);
      break;
    default:
      console.error(` ${icon.fail} Unknown command: ${color.bold(args.command)}`);
      printHelp("");
      process.exit(1);
  }
}

async function handleInit(args: ParsedArgs) {
  let config: EnvokerConfigFile;

  try {
    config = await loadConfig(args.configPath || undefined);
  } catch (err) {
    if (args.configPath) {
      console.error(` ${icon.fail} ${(err as Error).message}`);
      process.exit(1);
    }
    config = { schema: {} };
    console.warn(
      ` ${icon.info} No config file found. Creating ${color.bold(".envokerrc.json")}...`
    );
    const template = {
      schema: {
        DATABASE_URL: { type: "url", required: true, description: "PostgreSQL connection string" },
        PORT: { type: "port", default: 3000, description: "HTTP server port" },
      },
      profiles: {
        production: {
          DB_HOST: { type: "host", required: true, description: "Production DB hostname" },
        },
        staging: {
          DB_HOST: { type: "host", required: true, description: "Staging DB hostname" },
        },
      },
    };
    await Bun.write(".envokerrc.json", JSON.stringify(template, null, 2) + "\n");
    console.log(` ${icon.pass} Created ${color.bold(".envokerrc.json")}`);
    console.log(`     Edit it to define your schema and profiles, then run:`);
    console.log(
      `       ${color.cyan("bunx envoker init")}                      ${color.grey("# default profile")}`
    );
    console.log(
      `       ${color.cyan("bunx envoker init --profile production")}  ${color.grey("# production")}`
    );
    console.log(
      `       ${color.cyan("bunx envoker init --all-profiles")}        ${color.grey("# all profiles")}`
    );
    process.exit(0);
  }

  const profilesToGenerate = args.allProfiles
    ? [undefined, ...Object.keys(config.profiles ?? {})]
    : [args.profile];

  for (const profile of profilesToGenerate) {
    const output = profile ? `.env.example.${profile}` : args.output || ".env.example";
    const example = generateEnvExample(config, profile);
    await Bun.write(output, example);
    console.log(` ${icon.pass} Generated ${color.bold(output)}`);
    if (profile) {
      console.log(`     Profile: ${color.cyan(profile)}`);
    }
  }

  const schemaKeys = Object.keys(config.schema).length;
  if (schemaKeys > 0) {
    console.log(`     ${schemaKeys} variable(s) documented`);
  }
  process.exit(0);
}

async function handleCheck(args: ParsedArgs) {
  let config: EnvokerConfigFile;
  try {
    config = await loadConfig(args.configPath || undefined);
  } catch (err) {
    console.error(` ${icon.fail} ${(err as Error).message}`);
    process.exit(1);
  }

  const profile = args.profile;
  if (profile) {
    console.log(`   ${icon.info} Profile: ${color.cyan(profile)}\n`);
  }

  const result = await runCheck(config, profile);

  process.stdout.write(formatCheckResult(result.results));

  if (config.features) {
    const featureEntries = Object.entries(config.features);
    if (featureEntries.length > 0) {
      process.stdout.write(`\n ${color.bold("Feature Gates")}\n\n`);
      for (const [name, gate] of featureEntries) {
        const envName = `FEATURE_${name
          .replace(/([a-z])([A-Z])/g, "$1_$2")
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toUpperCase()}`;
        const envVal = process.env[envName];
        const enabled =
          envVal !== undefined && envVal !== ""
            ? envVal === "true" || envVal === "1" || envVal === "yes"
            : gate.enabled;
        const icon_ = enabled ? icon.pass : icon.fail;
        const status = enabled ? color.green("enabled") : color.red("disabled");
        const desc = gate.description ? ` ${color.dim(`— ${gate.description}`)}` : "";
        process.stdout.write(`   ${icon_} ${color.bold(name)}: ${status}${desc}\n`);
      }
      process.stdout.write("\n");
    }
  }

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      const suggestions = suggestKeys(
        err.key,
        Object.keys(config.schema).filter((k) => k !== err.key)
      );
      if (suggestions.length > 0) {
        process.stdout.write(
          `     ${color.dim(`Did you mean ${suggestions.map((s) => color.cyan(s)).join(" or ")}?`)}\n`
        );
      }
    }
  }

  const passed = result.results.filter((r) => r.status === "ok").length;
  const failed = result.results.filter((r) => r.status !== "ok").length;
  process.stdout.write(formatSummary(passed, failed));

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

async function handleEncrypt(args: ParsedArgs) {
  const encryptionKey = args.key ?? process.env.BEACON_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error(
      ` ${icon.fail} Encryption key required. Pass --key <key> or set BEACON_ENCRYPTION_KEY`
    );
    process.exit(1);
  }

  const inputPath = args.input ?? ".env";
  const file = Bun.file(inputPath);
  const exists = await file.exists();
  if (!exists) {
    console.error(` ${icon.fail} Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = await file.text();
  const encrypted = await encryptEnv(content, encryptionKey);
  const outputPath = args.output;
  await Bun.write(outputPath, encrypted);
  console.log(` ${icon.pass} Encrypted ${color.bold(inputPath)} → ${color.bold(outputPath)}`);
  process.exit(0);
}

async function handleDecrypt(args: ParsedArgs) {
  const encryptionKey = args.key ?? process.env.BEACON_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error(
      ` ${icon.fail} Encryption key required. Pass --key <key> or set BEACON_ENCRYPTION_KEY`
    );
    process.exit(1);
  }

  const inputPath = args.input ?? ".env.encrypted";
  const file = Bun.file(inputPath);
  const exists = await file.exists();
  if (!exists) {
    console.error(` ${icon.fail} Encrypted file not found: ${inputPath}`);
    process.exit(1);
  }

  const encryptedBase64 = (await file.text()).trim();
  const decrypted = await decryptEnv(encryptedBase64, encryptionKey);
  const outputPath = args.output;
  await Bun.write(outputPath, decrypted);
  console.log(` ${icon.pass} Decrypted ${color.bold(inputPath)} → ${color.bold(outputPath)}`);
  process.exit(0);
}

function handleRotate(_args: ParsedArgs) {
  console.log(`
 ${color.bold("Secret Rotation Checklist")}

Follow these steps to rotate a secret safely:

 ${color.bold("1.")} Generate a new secret value
     Use: openssl rand -base64 32

 ${color.bold("2.")} Deploy the new secret alongside the old one
     Add the new value to your env/secret store (e.g. DATABASE_URL_NEW)
     Your app should accept both old and new values during the transition

 ${color.bold("3.")} Update all consumers to use the new secret
     Deploy config changes pointing to the new secret

 ${color.bold("4.")} Verify everything works
     Run: ${color.cyan("bunx envoker check")}
     Check logs, metrics, and error rates

 ${color.bold("5.")} Revoke the old secret
     Remove the old value from your env/secret store
     Rotate any credentials in external services

 ${color.bold("6.")} Audit
     Confirm no services still reference the old secret
     Update docs and secrets inventory

 ${color.dim("Pro tip: Use envoker encrypt to store secrets safely in git.")}
 ${color.dim("         Set BEACON_ENCRYPTION_KEY in your deployment env.")}
`);
}

async function handleDrift(args: ParsedArgs) {
  let config: EnvokerConfigFile;
  try {
    config = await loadConfig(args.configPath || undefined);
  } catch (err) {
    console.error(` ${icon.fail} ${(err as Error).message}`);
    process.exit(1);
  }

  const profile = args.profile;
  const mergedSchema = { ...config.schema };
  if (profile && config.profiles?.[profile]) {
    Object.assign(mergedSchema, config.profiles[profile]);
  }

  const driftResults: Array<{ key: string; expected: string; actual: string }> = [];

  for (const [key, entry] of Object.entries(mergedSchema)) {
    const raw = process.env[key];
    const isField = "type" in entry;
    const required = isField ? (entry as { required?: boolean }).required !== false : true;

    if (raw === undefined || raw === "") {
      if (required) {
        driftResults.push({ key, expected: "set", actual: "not set" });
      }
      continue;
    }

    if (isField) {
      const schema = typeToSchema(entry as SchemaField);
      const result = schema.safeParse(raw);
      if (!result.success) {
        const field = entry as { type?: string; values?: readonly string[] };
        if (field.type === "enum" && field.values) {
          driftResults.push({
            key,
            expected: `one of: ${field.values.join(" | ")}`,
            actual: raw,
          });
        } else {
          const issue = result.error.issues[0];
          driftResults.push({
            key,
            expected: issue?.message ?? "valid value",
            actual: raw,
          });
        }
      }
    }
  }

  if (driftResults.length === 0) {
    console.log(` ${icon.pass} ${color.bold("No config drift detected")}`);
    process.exit(0);
  }

  console.log(` ${icon.fail} ${color.bold("Config drift detected:")}\n`);
  for (const d of driftResults) {
    console.log(`   ${color.yellow("⚠")} ${color.bold(d.key)}`);
    console.log(`       Expected: ${color.cyan(d.expected)}`);
    console.log(`       Actual:   ${color.red(d.actual)}`);
    console.log();
  }
  process.exit(1);
}

async function handleDockerCheck(args: ParsedArgs) {
  const isDocker = await Bun.file("/.dockerenv")
    .exists()
    .catch(() => false);
  const isK8s = process.env.KUBERNETES_SERVICE_HOST !== undefined;

  console.log(` ${icon.info} ${color.bold("Environment Detection")}\n`);

  if (isDocker) {
    console.log(`   ${icon.pass} Running inside Docker container`);
  } else {
    console.log(`   ${color.dim("○")} Not detected as Docker`);
  }

  if (isK8s) {
    console.log(`   ${icon.pass} Running inside Kubernetes pod`);
    console.log(
      `       KUBERNETES_SERVICE_HOST=${color.cyan(process.env.KUBERNETES_SERVICE_HOST ?? "")}`
    );
  } else {
    console.log(`   ${color.dim("○")} Not detected as Kubernetes`);
  }

  console.log();

  const dockerVars = ["DOCKER_HOST", "CONTAINER_NAME", "COMPOSE_PROJECT_NAME"];
  const k8sVars = ["KUBERNETES_SERVICE_HOST", "KUBERNETES_SERVICE_PORT"];

  if (isDocker || isK8s) {
    console.log(` ${icon.info} ${color.bold("Container Env Vars Found")}\n`);
    const relevant = [...(isDocker ? dockerVars : []), ...(isK8s ? k8sVars : [])];
    for (const v of relevant) {
      if (process.env[v]) {
        console.log(`   ${color.green("✓")} ${v}=${color.dim(process.env[v] ?? "")}`);
      }
    }
    console.log();
  }

  let config: EnvokerConfigFile | undefined;
  try {
    config = await loadConfig(args.configPath || undefined);
  } catch {
    // no config file, just show env info
  }

  if (config) {
    console.log(` ${icon.info} ${color.bold("Running envoker check against schema")}\n`);
    const result = await runCheck(config, args.profile);
    process.stdout.write(formatCheckResult(result.results));
    const passed = result.results.filter((r) => r.status === "ok").length;
    const failed = result.results.filter((r) => r.status !== "ok").length;
    process.stdout.write(formatSummary(passed, failed));
    if (failed > 0) process.exit(1);
  }

  process.exit(0);
}

function printHelp(command: string) {
  if (command === "init") {
    console.log(`
${color.bold("USAGE")}
  envoker init [options]

${color.bold("DESCRIPTION")}
  Generate a .env.example file from your envoker config file.
  Reads your schema and creates a documented template with
  types, defaults, and descriptions for every variable.

${color.bold("OPTIONS")}
  -c, --config <path>  Path to config file
                        ${color.dim("(default: .envokerrc.json or envoker.config.json)")}
  -o, --output <path>  Output file for init
                        ${color.dim("(default: .env.example or .env.example.<profile>)")}
  --profile <name>     Generate for a specific profile
  --all-profiles       Generate .env.example for every profile

${color.bold("EXAMPLES")}
  envoker init                              ${color.grey("# generate .env.example")}
  envoker init --profile production         ${color.grey("# generate .env.example.production")}
  envoker init --all-profiles               ${color.grey("# generate for all profiles")}
  envoker init -c ./config/envoker.json      ${color.grey("# custom config path")}
`);
    return;
  }

  if (command === "rotate") {
    console.log(`
${color.bold("USAGE")}
  envoker rotate

${color.bold("DESCRIPTION")}
  Print a step-by-step secret rotation checklist.
  Follow it to rotate any secret (DB credentials, API keys, etc.).

${color.bold("EXAMPLES")}
  envoker rotate
`);
    return;
  }

  if (command === "drift") {
    console.log(`
${color.bold("USAGE")}
  envoker drift [options]

${color.bold("DESCRIPTION")}
  Detect config drift — compares your actual environment against
  the schema defined in your envoker config file.
  Reports missing variables, type mismatches, and unexpected values.

${color.bold("OPTIONS")}
  -c, --config <path>  Path to config file
                        ${color.dim("(default: .envokerrc.json or envoker.config.json)")}
  --profile <name>     Profile to merge (staging, production, etc.)

${color.bold("EXAMPLES")}
  envoker drift
  envoker drift --profile production
`);
    return;
  }

  if (command === "docker") {
    console.log(`
${color.bold("USAGE")}
  envoker docker [options]

${color.bold("DESCRIPTION")}
  Validate the environment in Docker and Kubernetes contexts.
  Detects the container runtime, checks common container env vars,
  and runs a full envoker check against your schema.

${color.bold("OPTIONS")}
  -c, --config <path>  Path to config file
                        ${color.dim("(default: .envokerrc.json or envoker.config.json)")}
  --profile <name>     Profile to merge

${color.bold("EXAMPLES")}
  envoker docker
  envoker docker --profile staging
`);
    return;
  }

  if (command === "encrypt") {
    console.log(`
${color.bold("USAGE")}
  envoker encrypt [options]

${color.bold("DESCRIPTION")}
  Encrypt a .env file so secrets can be committed safely.
  Requires a 256-bit encryption key (passed via --key or BEACON_ENCRYPTION_KEY).

${color.bold("OPTIONS")}
  -i, --input <path>   Input .env file
                        ${color.dim("(default: .env)")}
  -o, --output <path>  Output encrypted file
                        ${color.dim("(default: .env.encrypted)")}
  --key <key>          Encryption key
                        ${color.dim("(or set BEACON_ENCRYPTION_KEY)")}

${color.bold("EXAMPLES")}
  envoker encrypt                                           ${color.grey("# encrypt .env → .env.encrypted")}
  envoker encrypt -i .env.prod -o .env.prod.encrypted       ${color.grey("# custom paths")}
  BEACON_ENCRYPTION_KEY=... envoker encrypt                 ${color.grey("# key from env")}
`);
    return;
  }

  if (command === "decrypt") {
    console.log(`
${color.bold("USAGE")}
  envoker decrypt [options]

${color.bold("DESCRIPTION")}
  Decrypt a .env.encrypted file back to plaintext.
  Requires the same key used during encryption.

${color.bold("OPTIONS")}
  -i, --input <path>   Input encrypted file
                        ${color.dim("(default: .env.encrypted)")}
  -o, --output <path>  Output .env file
                        ${color.dim("(default: .env)")}
  --key <key>          Encryption key
                        ${color.dim("(or set BEACON_ENCRYPTION_KEY)")}

${color.bold("EXAMPLES")}
  envoker decrypt                                           ${color.grey("# decrypt .env.encrypted → .env")}
  envoker decrypt -i .env.prod.encrypted -o .env.prod       ${color.grey("# custom paths")}
  BEACON_ENCRYPTION_KEY=... envoker decrypt                 ${color.grey("# key from env")}
`);
    return;
  }

  if (command === "check") {
    console.log(`
${color.bold("USAGE")}
  envoker check [options]

${color.bold("DESCRIPTION")}
  Validate the current process.env against your schema.
  Reports missing, invalid, and optional variables.

${color.bold("OPTIONS")}
  -c, --config <path>  Path to config file
                       ${color.dim("(default: .envokerrc.json or envoker.config.json)")}
  --profile <name>     Profile to merge (staging, production, etc.)

${color.bold("EXIT CODES")}
  0  All variables pass validation
  1  One or more variables are missing or invalid

${color.bold("EXAMPLES")}
  envoker check                             ${color.grey("# validate env")}
  envoker check --profile production        ${color.grey("# validate with profile")}
  envoker check -c ./config/envoker.json     ${color.grey("# custom config path")}
`);
    return;
  }

  console.log(`
${color.bold("envoker")} ${color.dim("- validate env vars, config, secrets, and feature gates")}

${color.bold("USAGE")}
  envoker <command> [options]

${color.bold("COMMANDS")}
  init     ${color.dim("Generate .env.example from your config")}
  check    ${color.dim("Validate current environment against your schema")}
  encrypt  ${color.dim("Encrypt .env file for safe committing")}
  decrypt  ${color.dim("Decrypt .env.encrypted back to plaintext")}
  rotate   ${color.dim("Print secret rotation checklist")}
  drift    ${color.dim("Detect config drift between schema and env")}
  docker   ${color.dim("Validate env in Docker/Kubernetes contexts")}
  help     ${color.dim("Show help for a specific command")}

${color.bold("OPTIONS")}
  -c, --config <path>  Path to config file (default: .envokerrc.json or envoker.config.json)
  -o, --output <path>  Output file for init (default: .env.example)
  --profile <name>     Profile name to use (e.g. staging, production)

${color.bold("EXIT CODES")}
  0  Success
  1  Validation failure or error

${color.bold("EXAMPLES")}
  envoker init
  envoker init --profile production
  envoker check
  envoker check -c ./config/envoker.json --profile staging
  envoker help init
`);
}

await main();
