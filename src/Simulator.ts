import { oldGatcha } from "./BAGatcha.ts";

type GatchaResult = {
  gatchaCount: number
}

type GatchaFunction = (wantChar?: number) => GatchaResult

type SimulationResult = {
  average: number
  standardDeviation: number
  gatchaCounts: number[]
}

type DistributionOptions = {
  binSize?: number
  width?: number
}

export function simulateGatcha(
  gatcha: GatchaFunction,
  simulateCount: number,
  pickupChar = 2,
) {
  const gatchaCounts: number[] = []
  let totalCounted = 0

  for (let i = 0; i < simulateCount; i += 1) {
    const gatchaResult = gatcha(pickupChar)
    gatchaCounts.push(gatchaResult.gatchaCount)
    totalCounted += gatchaResult.gatchaCount
  }

  const average = totalCounted / simulateCount
  const variance = gatchaCounts.reduce((acc, gatchaCount) => {
    return acc + (gatchaCount - average) ** 2
  }, 0) / simulateCount

  return {
    average,
    standardDeviation: Math.sqrt(variance),
    gatchaCounts,
  }
}

export function simulateOldGatcha(simulateCount: number, pickupChar = 2) {
  return simulateGatcha(oldGatcha, simulateCount, pickupChar)
}

export function formatNormalDistribution(
  result: SimulationResult,
  options: DistributionOptions = {},
) {
  const binSize = options.binSize ?? 10
  const width = options.width ?? 50
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

  const rows = [...bins].map(([start, count]) => {
    const lower = start - binSize / 2
    const upper = start + binSize / 2
    const normalExpected = result.gatchaCounts.length * (
      normalCdf(upper, result.average, result.standardDeviation)
      - normalCdf(lower, result.average, result.standardDeviation)
    )

    return {
      start,
      count,
      normalExpected,
    }
  })
  const maxValue = Math.max(
    ...rows.map((row) => Math.max(row.count, row.normalExpected)),
  )

  return rows.map((row) => {
    const actualLength = Math.round(row.count / maxValue * width)
    const normalPosition = Math.round(row.normalExpected / maxValue * width)
    const percentage = row.count / result.gatchaCounts.length * 100
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

    return `${row.start.toString().padStart(3)}: ${chart} ${row.count.toString().padStart(5)} ${percentage.toFixed(2).padStart(6)}% (${row.normalExpected.toFixed(1)})`
  }).join("\n")
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

export function printSimulatedResult(result: SimulationResult, label?: string) {
  if (label) {
    console.log(`[${label}]`)
  }
  console.log(`average: ${result.average}`)
  console.log(`standardDeviation: ${result.standardDeviation}`)
  console.log("")
  console.log("#: simulated count, |: normal distribution, *: overlap")
  console.log("count and % are simulated values; parentheses are normal expected counts")
  console.log(formatNormalDistribution(result))
}
