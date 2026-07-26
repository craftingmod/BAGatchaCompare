import { newGatcha, oldGatcha } from "./BAGatcha.ts"
import { createComparisonReport, printSimulatedResult, simulateGatcha } from "./Simulator.ts"

type OutputFormat = "cli" | "json"

type CliOptions = {
  format: OutputFormat
  simulateCount: number
  pickupChar: number
  binSize: number
  width: number
}

let options: CliOptions
try {
  options = parseCliOptions(Bun.argv.slice(2))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const oldResult = simulateGatcha(oldGatcha, options.simulateCount, options.pickupChar)
const newResult = simulateGatcha(newGatcha, options.simulateCount, options.pickupChar)

if (options.format === "json") {
  const report = createComparisonReport([
    { label: "oldGatcha", result: oldResult },
    { label: "newGatcha", result: newResult },
  ], { binSize: options.binSize })

  console.log(JSON.stringify(report, null, 2))
} else {
  printSimulatedResult(oldResult, "oldGatcha", {
    binSize: options.binSize,
    width: options.width,
  })
  console.log("==============\n==============\n==============")
  printSimulatedResult(newResult, "newGatcha", {
    binSize: options.binSize,
    width: options.width,
  })
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    format: "cli",
    simulateCount: 300000,
    pickupChar: 3,
    binSize: 10,
    width: 50,
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === undefined) {
      continue
    }

    if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    }

    const [rawKey, inlineValue] = arg.split("=", 2)
    const key = rawKey ?? ""
    const value = inlineValue ?? args[i + 1]

    if (inlineValue === undefined && key.startsWith("-")) {
      i += 1
    }

    switch (key) {
      case "--format":
      case "-f":
        options.format = parseOutputFormat(value)
        break
      case "--count":
      case "-c":
        options.simulateCount = parsePositiveInteger(value, "count")
        break
      case "--pickup":
      case "-p":
        options.pickupChar = parsePositiveInteger(value, "pickup")
        break
      case "--bin-size":
      case "-b":
        options.binSize = parsePositiveInteger(value, "bin-size")
        break
      case "--width":
      case "-w":
        options.width = parsePositiveInteger(value, "width")
        break
      default:
        throw new Error(`Unknown option: ${arg}\n\n${getHelpText()}`)
    }
  }

  return options
}

function parseOutputFormat(value: string | undefined): OutputFormat {
  if (value === "cli" || value === "json") {
    return value
  }

  throw new Error(`format must be "cli" or "json".\n\n${getHelpText()}`)
}

function parsePositiveInteger(value: string | undefined, label: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.\n\n${getHelpText()}`)
  }

  return parsed
}

function printHelp() {
  console.log(getHelpText())
}

function getHelpText() {
  return [
    "Usage: bun src/index.ts [options]",
    "",
    "Options:",
    "  -f, --format <cli|json>  Output format. Default: cli",
    "  -c, --count <number>     Simulation count. Default: 300000",
    "  -p, --pickup <number>    Target pickup character count. Default: 3",
    "  -b, --bin-size <number>  Distribution bin size. Default: 10",
    "  -w, --width <number>     CLI chart width. Default: 50",
    "  -h, --help               Show this help",
    "",
    "Examples:",
    "  bun src/index.ts --format cli --count 100000 --pickup 2",
    "  bun src/index.ts --format json --count 300000 --pickup 3 > output.json",
  ].join("\n")
}
