export const WorldConfig = {
  bounds: {
    width: 32, // World Units
    height: 18,
    depth: 5
  },
  physics: {
    friction: 0.95,
    maxVelocity: 20
  },
  time: {
    fixedDelta: 1 / 60, // Logic runs at 60hz (0.0166s per tick)
    maxAccumulator: 0.1 // Prevent "Spiral of Death" if CPU lags hard
  }
};
