import { oldGatcha } from "./BAGatcha.ts";

export function simulateOldGatcha(simulateCount: number, pickupChar = 2) {
  const gatchaHistory:Array<ReturnType<typeof oldGatcha>> = []
  let totalCounted = 0n

  for (let i = 0; i < simulateCount; i += 1) {
    const gatchaResult = oldGatcha(pickupChar)
    gatchaHistory.push(gatchaResult)
    totalCounted += BigInt(gatchaResult.gatchaCount)
  }

  return totalCounted / BigInt(simulateCount)
}