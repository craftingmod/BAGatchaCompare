import { newGatcha, oldGatcha } from "./BAGatcha.ts"
import { printSimulatedResult, simulateGatcha } from "./Simulator.ts"

const simulateCount = 100000
const pickupChar = 2

const oldResult = simulateGatcha(oldGatcha, simulateCount, pickupChar)
const newResult = simulateGatcha(newGatcha, simulateCount, pickupChar)

printSimulatedResult(oldResult, "oldGatcha")
console.log("==============\n==============\n==============")
printSimulatedResult(newResult, "newGatcha")
