const pickupRate = 0.007
const threeStarRate = 0.03
const totalStudents = 113 // SchaleDB 기준

const oneRoof = 200

const gatchaOnce = 10


function getPickupChar(value:number) {
  return value <= pickupRate
}

const otherPickupRate = (threeStarRate - pickupRate) / totalStudents * 1

function getOtherPickup(value: number, students = 1
) {
  return value > pickupRate && value <= (pickupRate + otherPickupRate * students)
}

export function oldGatcha(wantChar: number = 1) {
  let gatchaCount = 0
  let roofPoint = 0
  let pickedChars = 0
  for (let point = 0; point < oneRoof * wantChar; point += gatchaOnce) {
    for (let i = 0; i < gatchaOnce; i += 1) {
      const rand = Math.random()
      if (getPickupChar(rand)) {
        // 픽업 갯
        pickedChars += 1
      } else if (getOtherPickup(rand, wantChar - pickedChars)) {
        // 픽뚫 갯
        pickedChars += 1
      } else {
        // 끄앙
      }
      roofPoint += 1
      gatchaCount += 1
    }
    // 천장은 언제나 pickedChars을 1 추가해서 취급
    const realPickedChars = pickedChars + Math.floor(roofPoint / 200)

    // 의사 결정
    if (realPickedChars >= wantChar) {
      // 고의 천장을 하지 않고 마무리
      break
    }
  }

  // roofPoint 차감
  pickedChars += Math.floor(roofPoint / 200)
  roofPoint = roofPoint % 200

  return {
    gatchaCount,
    roofPoint,
    pickedChars,
  }
}

export function newGatcha(wantChar: number = 1) {
  let gatchaCount = 0
  let roofPoint = 0
  let pickedChars = 0
  for (let point = 0; point < oneRoof * wantChar; point += gatchaOnce) {
    for (let i = 0; i < gatchaOnce; i += 1) {
      roofPoint += 1
      gatchaCount += 1

      const otherPickup = wantChar - pickedChars
      const rand = Math.random()
      // 내부적인 천장 포인트가 100인 경우 3성 확정 및 50% 규칙 적용
      if (roofPoint === 100) {
        if (rand <= 0.5) {
          // 픽업
          pickedChars += 1
          roofPoint = 0
        } else {
          // 픽뚫 검사
          const rand2 = Math.random()
          if (rand2 <= otherPickup/totalStudents) {
            pickedChars += 1
          }
        }
      } else if (roofPoint === 200) {
        // 내부적으로 천장 포인트가 200인 경우 원래 천장 사용
        pickedChars += 1
        roofPoint = 0
      } else {
        // 평범한 픽업 알고리즘 적용
        if (getPickupChar(rand)) {
          // 픽업 갯
          pickedChars += 1
          roofPoint = 0
        } else if (getOtherPickup(rand, wantChar - pickedChars)) {
          // 픽뚫 갯
          pickedChars += 1
        } else {
          // 끄앙
        }
      }
    }
    // 천장 포인트 보정 없음.

    // 의사 결정
    if (pickedChars >= wantChar) {
      // 고의 천장을 하지 않고 마무리
      break
    }
  }

  // 포인트 무시하고 반환.
  return {
    gatchaCount,
    roofPoint,
    pickedChars,
  }
}