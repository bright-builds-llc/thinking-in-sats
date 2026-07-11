export type LightningPoint = {
  x: number;
  y: number;
};

export type LightningBolt = {
  birth: number;
  branches: LightningPoint[][];
  points: LightningPoint[];
  strikeX: number;
};

type RandomSource = () => number;

export function randomBetween(
  minimum: number,
  maximum: number,
  random: RandomSource = Math.random,
): number {
  return minimum + random() * (maximum - minimum);
}

export function createLightningBolt(
  width: number,
  height: number,
  now: number,
  random: RandomSource = Math.random,
): LightningBolt {
  const strikeX = randomBetween(width * 0.12, width * 0.88, random);
  const endpointY = height * randomBetween(0.72, 0.96, random);
  const points: LightningPoint[] = [{ x: strikeX, y: -12 }];
  const branches: LightningPoint[][] = [];
  let x = strikeX;
  let y = -12;

  while (y < endpointY) {
    const maybePreviousPoint = points.at(-1);

    if (!maybePreviousPoint) {
      break;
    }

    y += randomBetween(18, 40, random);
    x += randomBetween(-28, 28, random) + (strikeX - x) * 0.045;
    const point = { x, y: Math.min(y, endpointY) };
    points.push(point);

    if (points.length > 3 && random() < 0.22) {
      const branch: LightningPoint[] = [{ ...maybePreviousPoint }];
      const direction = random() < 0.5 ? -1 : 1;
      let branchX = maybePreviousPoint.x;
      let branchY = maybePreviousPoint.y;
      const segmentCount = Math.floor(randomBetween(3, 7, random));

      for (let index = 0; index < segmentCount; index += 1) {
        branchX +=
          direction * randomBetween(12, 34, random) +
          randomBetween(-8, 8, random);
        branchY += randomBetween(11, 27, random);
        branch.push({ x: branchX, y: branchY });
      }

      branches.push(branch);
    }
  }

  return { birth: now, branches, points, strikeX };
}

export function lightningIntensity(age: number): number {
  if (age < 70) {
    return 1;
  }

  if (age < 125) {
    return 0.12;
  }

  if (age < 260) {
    return 0.92 - (age - 125) / 230;
  }

  if (age < 680) {
    return Math.max(0, 0.22 * (1 - (age - 260) / 420));
  }

  return 0;
}

function drawPath(
  context: CanvasRenderingContext2D,
  points: LightningPoint[],
  width: number,
) {
  const firstPoint = points[0];

  if (!firstPoint) {
    return;
  }

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.lineWidth = width;
  context.stroke();
}

export function drawLightningBolt(
  context: CanvasRenderingContext2D,
  bolt: LightningBolt,
  width: number,
  height: number,
  intensity: number,
) {
  const flash = context.createRadialGradient(
    bolt.strikeX,
    height * 0.35,
    0,
    bolt.strikeX,
    height * 0.35,
    width * 0.55,
  );
  flash.addColorStop(0, `rgb(255 174 112 / ${intensity * 0.2})`);
  flash.addColorStop(1, "rgb(255 156 82 / 0)");
  context.fillStyle = flash;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#ffad70";
  context.shadowColor = "#ff7d2d";
  context.globalAlpha = intensity * 0.46;
  context.shadowBlur = 26;
  drawPath(context, bolt.points, 7);

  for (const branch of bolt.branches) {
    drawPath(context, branch, 2.6);
  }

  context.strokeStyle = "#fff2e7";
  context.globalAlpha = intensity * 0.94;
  context.shadowBlur = 8;
  drawPath(context, bolt.points, 1.7);

  for (const branch of bolt.branches) {
    drawPath(context, branch, 0.9);
  }

  context.restore();
}
