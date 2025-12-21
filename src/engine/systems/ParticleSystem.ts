import { IGameSystem, IParticleSystem } from '@/engine/interfaces';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { PhysicsConfig } from '@/engine/config/PhysicsConfig';
import { ParticleShape } from '@/engine/ecs/types';
import * as THREE from 'three';

const MAX_PARTICLES = SYS_LIMITS.MAX_PARTICLES;

export class ParticleSystem implements IParticleSystem {
  public count = 0;

  public x = new Float32Array(MAX_PARTICLES);
  public y = new Float32Array(MAX_PARTICLES);
  public vx = new Float32Array(MAX_PARTICLES);
  public vy = new Float32Array(MAX_PARTICLES);
  public life = new Float32Array(MAX_PARTICLES);
  public maxLife = new Float32Array(MAX_PARTICLES);
  public size = new Float32Array(MAX_PARTICLES);
  public shape = new Float32Array(MAX_PARTICLES); 
  
  public r = new Float32Array(MAX_PARTICLES);
  public g = new Float32Array(MAX_PARTICLES);
  public b = new Float32Array(MAX_PARTICLES);

  private tempColor = new THREE.Color();

  constructor() {
    this.count = 0;
  }

  update(delta: number, time: number): void {
    if (this.count === 0) return;

    // Use centralized constant
    const friction = PhysicsConfig.PARTICLES.FRICTION;

    let i = 0;
    while (i < this.count) {
      this.life[i] -= delta;

      if (this.life[i] <= 0) {
        this.swap(i, this.count - 1);
        this.count--;
        continue;
      }

      this.x[i] += this.vx[i] * delta;
      this.y[i] += this.vy[i] * delta;
      
      this.vx[i] *= friction;
      this.vy[i] *= friction;

      i++;
    }
  }

  public spawn(
      x: number, y: number, 
      colorHex: string, 
      vx: number, vy: number, 
      life: number, 
      size: number = 1.0, 
      shape: ParticleShape = ParticleShape.CIRCLE
  ) {
    if (this.count >= MAX_PARTICLES) return;

    const idx = this.count;
    this.x[idx] = x;
    this.y[idx] = y;
    this.vx[idx] = vx;
    this.vy[idx] = vy;
    this.life[idx] = life;
    this.maxLife[idx] = life;
    this.size[idx] = size;
    this.shape[idx] = shape;

    this.tempColor.set(colorHex);
    this.r[idx] = this.tempColor.r;
    this.g[idx] = this.tempColor.g;
    this.b[idx] = this.tempColor.b;

    this.count++;
  }

  private swap(a: number, b: number) {
    if (a === b) return;
    
    this.x[a] = this.x[b];
    this.y[a] = this.y[b];
    this.vx[a] = this.vx[b];
    this.vy[a] = this.vy[b];
    this.life[a] = this.life[b];
    this.maxLife[a] = this.maxLife[b];
    this.size[a] = this.size[b];
    this.shape[a] = this.shape[b];
    this.r[a] = this.r[b];
    this.g[a] = this.g[b];
    this.b[a] = this.b[b];
  }

  public getCount() { return this.count; }

  public getData() {
    return {
        x: this.x,
        y: this.y,
        life: this.life,
        maxLife: this.maxLife,
        color: this.r 
    };
  }

  teardown(): void {
    this.count = 0;
  }
}
