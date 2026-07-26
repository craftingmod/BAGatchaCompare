import { oldGatcha } from "./BAGatcha.ts";

type GatchaResult = {
  gatchaCount: number
  roofPoint: number
  pickedChars: number
}

type GatchaFunction = (wantChar?: number) => GatchaResult

type SimulationResult = {
  average: number
  standardDeviation: number
  gatchaCounts: number[]
  averagePickedChars: number
  standardDeviationPickedChars: number
  averageEffectivePickedChars: number
  standardDeviationEffectivePickedChars: number
  effectivePickedChars: number[]
}

type DistributionOptions = {
  binSize?: number
  width?: number
}

type DistributionRow = {
  start: number
  count: number
  percentage: number
  normalExpected: number
  normalExpectedPercentage: number
}

export function simulateGatcha(
  gatcha: GatchaFunction,
  simulateCount: number,
  pickupChar = 2,
) {
  const gatchaCounts: number[] = []
  const pickedCharCounts: number[] = []
  const effectivePickedChars: number[] = []

  for (let i = 0; i < simulateCount; i += 1) {
    const gatchaResult = gatcha(pickupChar)
    const effectivePickedChar = gatchaResult.pickedChars + gatchaResult.roofPoint / 200

    gatchaCounts.push(gatchaResult.gatchaCount)
    pickedCharCounts.push(gatchaResult.pickedChars)
    effectivePickedChars.push(effectivePickedChar)
  }

  const gatchaCountStats = getStats(gatchaCounts)
  const pickedCharStats = getStats(pickedCharCounts)
  const effectivePickedCharStats = getStats(effectivePickedChars)

  return {
    average: gatchaCountStats.average,
    standardDeviation: gatchaCountStats.standardDeviation,
    gatchaCounts,
    averagePickedChars: pickedCharStats.average,
    standardDeviationPickedChars: pickedCharStats.standardDeviation,
    averageEffectivePickedChars: effectivePickedCharStats.average,
    standardDeviationEffectivePickedChars: effectivePickedCharStats.standardDeviation,
    effectivePickedChars,
  }
}

export function simulateOldGatcha(simulateCount: number, pickupChar = 2) {
  return simulateGatcha(oldGatcha, simulateCount, pickupChar)
}

export function formatNormalDistribution(
  result: SimulationResult,
  options: DistributionOptions = {},
) {
  const width = options.width ?? 50
  const rows = getDistributionRows(result, options)
  const maxValue = Math.max(
    ...rows.map((row) => Math.max(row.count, row.normalExpected)),
  )

  return rows.map((row) => {
    const actualLength = Math.round(row.count / maxValue * width)
    const normalPosition = Math.round(row.normalExpected / maxValue * width)
    const chart = Array.from({ length: width }, (_, index) => {
      const position = index + 1
      if (position === normalPosition && position <= actualLength) {
        return "*"
      }
      if (position === normalPosition) {
        return "|"
      }
      if (position <= actualLength) {
        return "#"
      }
      return " "
    }).join("")

    return `${row.start.toString().padStart(3)}: ${chart} ${row.count.toString().padStart(5)} ${row.percentage.toFixed(2).padStart(6)}% (${row.normalExpected.toFixed(1)})`
  }).join("\n")
}

export function createComparisonReport(
  results: Array<{ label: string, result: SimulationResult }>,
  options: DistributionOptions = {},
) {
  const binSize = options.binSize ?? 10

  return {
    schemaVersion: 1,
    plotPurpose: "Compare gatcha count distributions and summary metrics for pyplot.",
    binSize,
    metricFields: [
      "average",
      "standardDeviation",
      "averageEffectivePickedChars",
      "standardDeviationEffectivePickedChars",
    ],
    distributionFields: [
      "bins",
      "counts",
      "percentages",
      "normalExpectedCounts",
      "normalExpectedPercentages",
    ],
    pyplotHint: {
      distributionGraph: "Use bins as x-axis and percentages as y-axis for old/new distribution comparison.",
      normalOverlay: "Use normalExpectedPercentages as an optional normal-distribution reference line.",
      metricGraph: "Use metrics values grouped by label for bar charts.",
    },
    series: results.map(({ label, result }) => {
      const distribution = getDistributionRows(result, { binSize })

      return {
        label,
        sampleCount: result.gatchaCounts.length,
        metrics: {
          average: result.average,
          standardDeviation: result.standardDeviation,
          averageEffectivePickedChars: result.averageEffectivePickedChars,
          standardDeviationEffectivePickedChars: result.standardDeviationEffectivePickedChars,
        },
        distribution: {
          bins: distribution.map((row) => row.start),
          counts: distribution.map((row) => row.count),
          percentages: distribution.map((row) => row.percentage),
          normalExpectedCounts: distribution.map((row) => row.normalExpected),
          normalExpectedPercentages: distribution.map((row) => row.normalExpectedPercentage),
        },
      }
    }),
  }
}

function getDistributionRows(
  result: SimulationResult,
  options: DistributionOptions = {},
): DistributionRow[] {
  const binSize = options.binSize ?? 10
  const min = Math.floor(Math.min(...result.gatchaCounts) / binSize) * binSize
  const max = Math.ceil(Math.max(...result.gatchaCounts) / binSize) * binSize
  const bins = new Map<number, number>()

  for (let start = min; start <= max; start += binSize) {
    bins.set(start, 0)
  }

  for (const gatchaCount of result.gatchaCounts) {
    const start = Math.floor(gatchaCount / binSize) * binSize
    bins.set(start, (bins.get(start) ?? 0) + 1)
  }

  return [...bins].map(([start, count]) => {
    const lower = start - binSize / 2
    const upper = start + binSize / 2
    const normalExpected = result.gatchaCounts.length * (
      normalCdf(upper, result.average, result.standardDeviation)
      - normalCdf(lower, result.average, result.standardDeviation)
    )

    return {
      start,
      count,
      percentage: count / result.gatchaCounts.length * 100,
      normalExpected,
      normalExpectedPercentage: normalExpected / result.gatchaCounts.length * 100,
    }
  })
}

function normalCdf(value: number, average: number, standardDeviation: number) {
  if (standardDeviation === 0) {
    return value < average ? 0 : 1
  }

  return 0.5 * (1 + erf((value - average) / (standardDeviation * Math.sqrt(2))))
}

function erf(value: number) {
  const sign = value < 0 ? -1 : 1
  const absoluteValue = Math.abs(value)
  const t = 1 / (1 + 0.3275911 * absoluteValue)
  const approximation = 1 - (((((
    1.061405429 * t - 1.453152027
  ) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-(absoluteValue ** 2))

  return sign * approximation
}

function getStats(values: number[]) {
  const average = values.reduce((acc, value) => acc + value, 0) / values.length
  const variance = values.reduce((acc, value) => {
    return acc + (value - average) ** 2
  }, 0) / values.length

  return {
    average,
    standardDeviation: Math.sqrt(variance),
  }
}

export function printSimulatedResult(result: SimulationResult, label?: string) {
  if (label) {
    console.log(`[${label}]`)
  }
  console.log(`average: ${result.average}`)
  console.log(`standardDeviation: ${result.standardDeviation}`)
  console.log(`averagePickedChars: ${result.averagePickedChars}`)
  console.log(`standardDeviationPickedChars: ${result.standardDeviationPickedChars}`)
  console.log(`averageEffectivePickedChars: ${result.averageEffectivePickedChars}`)
  console.log(`standardDeviationEffectivePickedChars: ${result.standardDeviationEffectivePickedChars}`)
  console.log("")
  console.log("#: simulated count, |: normal distribution, *: overlap")
  console.log("count and % are simulated values; parentheses are normal expected counts")
  console.log(formatNormalDistribution(result))
}
