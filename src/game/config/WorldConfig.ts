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
    fixedDelta: 1 / 60, // 60hz Logic Tick
    maxDelta: 0.1 // Prevent spiral of death on lag
  }
};
