import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const DEVICE_MEMORY =
  typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8)
    : 8;
const IS_LOW_END =
  typeof navigator !== 'undefined' &&
  ((navigator.hardwareConcurrency ?? 4) <= 6 || DEVICE_MEMORY <= 4);
const PARTICLE_COUNT = IS_LOW_END ? 900 : 1400;
const PIXEL_RATIO_CAP = IS_LOW_END ? 1 : 1.25;
const RING_RADIUS = 4.2;
const TUBE_RADIUS = 0.85;

// ═══════════════════════════════════════════════════════════════════════════
// Keyframe system — defines orb state at scroll positions
// ═══════════════════════════════════════════════════════════════════════════

export interface OrbKeyframe {
  at: number;        // 0-1 normalized scroll progress
  expand: number;    // ring size: 0.3 = tight sphere, 1.0 = normal, 2.0 = huge
  spread: number;    // particle scatter: 0 = on ring, 1 = exploded outward
  noiseAmp: number;  // displacement intensity: 0.5 = calm, 3.0 = chaotic
  speed: number;     // animation speed: 0.3 = slow, 3.0 = frantic
  tiltX: number;     // X rotation in radians
  rotSpeed: number;  // Z rotation speed multiplier
  brightness: number;// glow intensity: 0.5 = dim, 2.0 = blazing
  color1: string;
  color2: string;
  opacity: number;
  posX: number;      // horizontal offset
  posY: number;      // vertical parallax offset
  scale: number;     // overall scale multiplier
}

function lerpKeyframes(a: OrbKeyframe, b: OrbKeyframe, t: number): OrbKeyframe {
  const s = Math.max(0, Math.min(1, t));
  const lerp = (x: number, y: number) => x + (y - x) * s;
  return {
    at: lerp(a.at, b.at),
    expand: lerp(a.expand, b.expand),
    spread: lerp(a.spread, b.spread),
    noiseAmp: lerp(a.noiseAmp, b.noiseAmp),
    speed: lerp(a.speed, b.speed),
    tiltX: lerp(a.tiltX, b.tiltX),
    rotSpeed: lerp(a.rotSpeed, b.rotSpeed),
    brightness: lerp(a.brightness, b.brightness),
    color1: a.color1,
    color2: a.color2,
    opacity: lerp(a.opacity, b.opacity),
    posX: lerp(a.posX, b.posX),
    posY: lerp(a.posY, b.posY),
    scale: lerp(a.scale, b.scale),
  };
}

function resolveKeyframe(keyframes: OrbKeyframe[], progress: number): OrbKeyframe {
  if (keyframes.length === 0) return DEFAULT_KEYFRAME;
  if (keyframes.length === 1) return keyframes[0];

  const p = Math.max(0, Math.min(1, progress));

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (p >= a.at && p <= b.at) {
      const range = b.at - a.at;
      const t = range > 0 ? (p - a.at) / range : 0;
      // Smooth easing for organic feel
      const eased = t * t * (3 - 2 * t);
      return lerpKeyframes(a, b, eased);
    }
  }

  return p <= keyframes[0].at ? keyframes[0] : keyframes[keyframes.length - 1];
}

const DEFAULT_KEYFRAME: OrbKeyframe = {
  at: 0, expand: 1, spread: 0, noiseAmp: 1, speed: 1, tiltX: 0.15 * Math.PI,
  rotSpeed: 1, brightness: 1, color1: '#0e7490', color2: '#0f766e',
  opacity: 0.35, posX: 0, posY: 0, scale: 1,
};

// ═══════════════════════════════════════════════════════════════════════════
// Shaders
// ═══════════════════════════════════════════════════════════════════════════

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uNoiseScale;
  uniform float uExpand;
  uniform float uSpread;
  uniform float uNoiseAmp;
  uniform float uSpeed;
  uniform float uScale;
  attribute float aRandom;
  attribute float aSize;
  attribute float aAngle;
  attribute float aPhase;
  varying float vAlpha;
  varying float vAngle;
  varying float vRandom;
  varying float vPhase;
  varying float vDepth;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    float t = uTime * uSpeed;

    // Morph position based on expand + spread
    vec3 pos = position * uExpand * uScale;

    // Spread: push particles radially outward from ring center
    vec3 radial = normalize(vec3(pos.xy, 0.0) + vec3(0.001));
    pos += radial * uSpread * (0.5 + aRandom) * 4.0;

    // Vertical spread for 3D scatter effect
    pos.z += uSpread * (aRandom - 0.5) * 3.0;

    // Noise displacement — modulated by uNoiseAmp
    float n1 = snoise(pos * uNoiseScale + t * 0.08);
    float n2 = snoise(pos * uNoiseScale * 2.0 + t * 0.05 + 50.0) * 0.4;
    pos += normal * (n1 * 0.15 + n2 * 0.08) * uNoiseAmp;

    // Mouse repulsion
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vec2 mouseDir = worldPos.xy - uMouse;
    float mouseDist = length(mouseDir);
    float repulsion = smoothstep(1.8, 0.0, mouseDist) * 0.35;
    pos.xy += normalize(mouseDir + vec2(0.001)) * repulsion;

    // Alpha with depth-based variation
    vAlpha = 0.15 + aRandom * 0.35;
    vAngle = aAngle;
    vRandom = aRandom;
    vPhase = aPhase;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mvPosition.z;
    gl_PointSize = aSize * uScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBrightness;
  uniform float uSpeed;
  varying float vAlpha;
  varying float vAngle;
  varying float vRandom;
  varying float vPhase;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float t = uTime * uSpeed;

    // Sharp bright core
    float core = smoothstep(0.12, 0.0, d);

    // Subtle thin halo
    float halo = exp(-d * 18.0) * 0.2;

    float alpha = (core * 0.9 + halo) * vAlpha;

    // Per-particle twinkle
    float twinkle = sin(t * (1.5 + vRandom * 3.0) + vPhase * 6.2832) * 0.25 + 0.75;
    alpha *= twinkle;

    // Traveling energy pulse
    float travel = fract(vAngle / 6.2832 + t * 0.03);
    float pulse = sin(travel * 6.2832 * 3.0 + t * 0.5) * 0.2 + 0.8;
    alpha *= pulse;

    // Color blend
    float colorMix = fract(vAngle / 6.2832 + vRandom * 0.3);
    vec3 color = mix(uColor1, uColor2, colorMix);

    // Hot white center for brightest particles, amplified by brightness
    vec3 finalColor = mix(color, vec3(1.0), core * 0.3 * uBrightness);

    // Brightness boost
    finalColor *= (0.7 + 0.3 * uBrightness);

    gl_FragColor = vec4(finalColor, alpha * uOpacity);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Particle creation
// ═══════════════════════════════════════════════════════════════════════════

function createRingParticles(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const normals = new Float32Array(PARTICLE_COUNT * 3);
  const randoms = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const angles = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    const tubeR = TUBE_RADIUS * (0.3 + Math.random() * 0.7);

    const x = (RING_RADIUS + tubeR * Math.cos(phi)) * Math.cos(theta);
    const y = (RING_RADIUS + tubeR * Math.cos(phi)) * Math.sin(theta);
    const z = tubeR * Math.sin(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const nx = Math.cos(phi) * Math.cos(theta);
    const ny = Math.cos(phi) * Math.sin(theta);
    const nz = Math.sin(phi);
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;

    randoms[i] = Math.random();
    sizes[i] = 2.0 + Math.random() * 3.5;
    angles[i] = theta;
    phases[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(10, 10) },
      uNoiseScale: { value: 1.2 },
      uColor1: { value: new THREE.Color('#0e7490') },
      uColor2: { value: new THREE.Color('#0f766e') },
      uOpacity: { value: 0.35 },
      uExpand: { value: 1.0 },
      uSpread: { value: 0.0 },
      uNoiseAmp: { value: 1.0 },
      uSpeed: { value: 1.0 },
      uScale: { value: 1.0 },
      uBrightness: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

interface HeroSceneProps {
  offsetX?: number;
  disableScrollFade?: boolean;
  color1?: string;
  color2?: string;
  opacity?: number;
  keyframes?: OrbKeyframe[];
}

export function HeroScene({
  offsetX = 0,
  disableScrollFade = false,
  color1 = '#0e7490',
  color2 = '#0f766e',
  opacity = 0.35,
  keyframes,
}: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const targetOffsetRef = useRef(offsetX);
  const targetColor1Ref = useRef(new THREE.Color(color1));
  const targetColor2Ref = useRef(new THREE.Color(color2));
  const targetOpacityRef = useRef(opacity);
  const keyframesRef = useRef(keyframes);
  const scrollProgressRef = useRef(0);

  // Smooth interpolation targets (set by scroll, chased by animation loop)
  const targetExpandRef = useRef(1.0);
  const targetSpreadRef = useRef(0.0);
  const targetNoiseAmpRef = useRef(1.0);
  const targetSpeedRef = useRef(1.0);
  const targetTiltXRef = useRef(0.15 * Math.PI);
  const targetRotSpeedRef = useRef(1.0);
  const targetBrightnessRef = useRef(1.0);
  const targetScaleRef = useRef(1.0);
  const targetPosYRef = useRef(0);

  useEffect(() => { targetOffsetRef.current = offsetX; }, [offsetX]);
  useEffect(() => {
    targetColor1Ref.current.set(color1);
    targetColor2Ref.current.set(color2);
  }, [color1, color2]);
  useEffect(() => { targetOpacityRef.current = opacity; }, [opacity]);
  useEffect(() => {
    keyframesRef.current = keyframes;
    if (keyframes && keyframes.length > 0) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      scrollProgressRef.current = progress;
      const state = resolveKeyframe(keyframes, progress);
      targetExpandRef.current = state.expand;
      targetSpreadRef.current = state.spread;
      targetNoiseAmpRef.current = state.noiseAmp;
      targetSpeedRef.current = state.speed;
      targetTiltXRef.current = state.tiltX;
      targetRotSpeedRef.current = state.rotSpeed;
      targetBrightnessRef.current = state.brightness;
      targetColor1Ref.current.set(state.color1);
      targetColor2Ref.current.set(state.color2);
      targetOpacityRef.current = state.opacity;
      targetOffsetRef.current = state.posX;
      targetPosYRef.current = state.posY;
      targetScaleRef.current = state.scale;
    }
  }, [keyframes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const particles = createRingParticles();
    particles.rotation.x = Math.PI * 0.15;
    scene.add(particles);

    const mouse = new THREE.Vector2(10, 10);
    const targetMouse = new THREE.Vector2(10, 10);
    const clock = new THREE.Timer();
    let currentOrbX = 0;
    let currentOrbY = 0;
    let currentTiltX = Math.PI * 0.15;
    let currentRotSpeed = 1.0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Scroll tracking (rAF-throttled to avoid per-event layout churn)
    let scrollRaf = 0;
    const applyScrollState = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      const kfs = keyframesRef.current;
      if (kfs && kfs.length > 0) {
        const state = resolveKeyframe(kfs, scrollProgressRef.current);
        targetExpandRef.current = state.expand;
        targetSpreadRef.current = state.spread;
        targetNoiseAmpRef.current = state.noiseAmp;
        targetSpeedRef.current = state.speed;
        targetTiltXRef.current = state.tiltX;
        targetRotSpeedRef.current = state.rotSpeed;
        targetBrightnessRef.current = state.brightness;
        targetColor1Ref.current.set(state.color1);
        targetColor2Ref.current.set(state.color2);
        targetOpacityRef.current = state.opacity;
        targetOffsetRef.current = state.posX;
        targetPosYRef.current = state.posY;
        targetScaleRef.current = state.scale;
      }

      if (!disableScrollFade && !kfs) {
        const fade = 1 - Math.min(1, window.scrollY / 600);
        const clamped = Math.max(0, fade);
        container.style.opacity = String(clamped);
        const wasPaused = pausedRef.current;
        pausedRef.current = clamped <= 0;
        if (wasPaused && !pausedRef.current) startLoop();
      }
    };
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        applyScrollState();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    applyScrollState();

    let animId = 0;
    let isRunning = false;

    const LERP_SPEED = 0.035;

    const animate = () => {
      if (pausedRef.current) { isRunning = false; return; }

      animId = requestAnimationFrame(animate);
      isRunning = true;

      clock.update();
      const t = clock.getElapsed();
      const mat = particles.material as THREE.ShaderMaterial;

      mat.uniforms.uTime.value = t;

      // Smooth chase all targets
      mat.uniforms.uExpand.value += (targetExpandRef.current - mat.uniforms.uExpand.value) * LERP_SPEED;
      mat.uniforms.uSpread.value += (targetSpreadRef.current - mat.uniforms.uSpread.value) * LERP_SPEED;
      mat.uniforms.uNoiseAmp.value += (targetNoiseAmpRef.current - mat.uniforms.uNoiseAmp.value) * LERP_SPEED;
      mat.uniforms.uSpeed.value += (targetSpeedRef.current - mat.uniforms.uSpeed.value) * LERP_SPEED;
      mat.uniforms.uScale.value += (targetScaleRef.current - mat.uniforms.uScale.value) * LERP_SPEED;
      mat.uniforms.uBrightness.value += (targetBrightnessRef.current - mat.uniforms.uBrightness.value) * LERP_SPEED;
      mat.uniforms.uOpacity.value += (targetOpacityRef.current - mat.uniforms.uOpacity.value) * LERP_SPEED;

      // Smooth color transitions
      mat.uniforms.uColor1.value.lerp(targetColor1Ref.current, 0.025);
      mat.uniforms.uColor2.value.lerp(targetColor2Ref.current, 0.025);

      // Mouse tracking
      const aspect = camera.aspect;
      const vFov = (camera.fov * Math.PI) / 180;
      const halfH = Math.tan(vFov / 2) * camera.position.z;
      const halfW = halfH * aspect;
      mouse.lerp(
        new THREE.Vector2(targetMouse.x * halfW, targetMouse.y * halfH),
        0.03,
      );
      mat.uniforms.uMouse.value.copy(mouse);

      // Dynamic rotation speed
      currentRotSpeed += (targetRotSpeedRef.current - currentRotSpeed) * LERP_SPEED;
      particles.rotation.z += 0.0008 * currentRotSpeed;

      // Smooth tilt
      currentTiltX += (targetTiltXRef.current - currentTiltX) * LERP_SPEED;
      particles.rotation.x = currentTiltX;

      // Smooth position
      currentOrbX += (targetOffsetRef.current - currentOrbX) * 0.04;
      currentOrbY += (targetPosYRef.current - currentOrbY) * 0.04;
      particles.position.x = currentOrbX;
      particles.position.y = currentOrbY;

      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (!isRunning && !pausedRef.current) { isRunning = true; animate(); }
    };

    const onVisibility = () => {
      if (document.hidden) { pausedRef.current = true; }
      else { pausedRef.current = false; startLoop(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    animate();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      ro.disconnect();
      renderer.dispose();
      (particles.material as THREE.ShaderMaterial).dispose();
      particles.geometry.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disableScrollFade]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: disableScrollFade ? undefined : 'opacity 0.15s linear',
      }}
    />
  );
}
