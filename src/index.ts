import { newGatcha, oldGatcha } from "./BAGatcha.ts"
import { createComparisonReport, simulateGatcha } from "./Simulator.ts"

const simulateCount = 300000
const pickupChar = 2

const oldResult = simulateGatcha(oldGatcha, simulateCount, pickupChar)
const newResult = simulateGatcha(newGatcha, simulateCount, pickupChar)

const report = createComparisonReport([
  { label: "oldGatcha", result: oldResult },
  { label: "newGatcha", result: newResult },
])

console.log(JSON.stringify(report, null, 2))
