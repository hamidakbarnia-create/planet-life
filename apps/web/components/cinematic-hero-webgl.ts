import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  CINEMATIC_COLORS,
  CINEMATIC_SCENES,
  clamp01,
  sceneProgress,
  type CinematicDensity,
} from '@/lib/cinematic-scenes';

export interface CinematicHeroEngine {
  update: (scrollProgress: number, elapsedSeconds: number) => void;
  resize: () => void;
  dispose: () => void;
}

interface LineState {
  chaosA: Vector3;
  chaosB: Vector3;
  alignedA: Vector3;
  alignedB: Vector3;
  drift: Vector3;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec(out: Vector3, a: Vector3, b: Vector3, t: number): Vector3 {
  return out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}

function createLineStates(count: number): LineState[] {
  const states: LineState[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const cx = (Math.random() - 0.5) * 8;
    const cy = (Math.random() - 0.5) * 4;
    const len = 0.6 + Math.random() * 2.2;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len * 0.35;
    const row = (i / Math.max(count - 1, 1) - 0.5) * 5;
    states.push({
      chaosA: new Vector3(cx - dx, cy - dy, (Math.random() - 0.5) * 3),
      chaosB: new Vector3(cx + dx, cy + dy, (Math.random() - 0.5) * 3),
      alignedA: new Vector3(-6, row, -1 + (Math.random() - 0.5) * 0.4),
      alignedB: new Vector3(6, row, -1 + (Math.random() - 0.5) * 0.4),
      drift: new Vector3((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.08, 0),
    });
  }
  return states;
}

export function createCinematicHeroEngine(
  canvas: HTMLCanvasElement,
  density: CinematicDensity,
): CinematicHeroEngine {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(new Color(CINEMATIC_COLORS.background), 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  camera.lookAt(0, 0, 0);

  scene.add(new AmbientLight(0xffffff, 0.35));

  const root = new Group();
  scene.add(root);

  const lineStates = createLineStates(density.lineCount);
  const positions = new Float32Array(lineStates.length * 6);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  const lineMaterial = new LineBasicMaterial({
    color: new Color(CINEMATIC_COLORS.line),
    transparent: true,
    opacity: 0.22,
  });
  const lines = new LineSegments(geometry, lineMaterial);
  root.add(lines);

  const nodeGroup = new Group();
  const nodeMaterial = new MeshBasicMaterial({
    color: new Color(CINEMATIC_COLORS.line),
    transparent: true,
    opacity: 0,
  });
  const nodeMeshes: Mesh[] = [];
  const nodeGeometry = new BoxGeometry(1, 1, 1);
  for (let i = 0; i < density.nodeCount; i += 1) {
    const size = 0.06 + Math.random() * 0.05;
    const mesh = new Mesh(nodeGeometry, nodeMaterial.clone());
    mesh.scale.set(size, size, size);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 2,
    );
    nodeGroup.add(mesh);
    nodeMeshes.push(mesh);
  }
  root.add(nodeGroup);

  const tempA = new Vector3();
  const tempB = new Vector3();

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth <= 0 || clientHeight <= 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  resize();

  const update = (scrollProgress: number, elapsedSeconds: number) => {
    const progress = clamp01(scrollProgress);

    const fieldP = sceneProgress(progress, CINEMATIC_SCENES[0]);
    const noiseP = sceneProgress(progress, CINEMATIC_SCENES[1]);
    const alignmentP = sceneProgress(progress, CINEMATIC_SCENES[3]);
    const pathP = sceneProgress(progress, CINEMATIC_SCENES[5]);

    const alignmentMix = clamp01(alignmentP + Math.max(0, progress - CINEMATIC_SCENES[3].start) * 0.5);
    const lineOpacity = lerp(0.12, 0.42, fieldP + noiseP * 0.5);
    const driftScale = lerp(1, 0.25, alignmentMix);

    for (let i = 0; i < lineStates.length; i += 1) {
      const state = lineStates[i];
      const driftX = Math.sin(elapsedSeconds * 0.35 + i) * state.drift.x * driftScale;
      const driftY = Math.cos(elapsedSeconds * 0.28 + i * 0.7) * state.drift.y * driftScale;

      lerpVec(tempA, state.chaosA, state.alignedA, alignmentMix);
      lerpVec(tempB, state.chaosB, state.alignedB, alignmentMix);
      tempA.x += driftX;
      tempA.y += driftY;
      tempB.x += driftX;
      tempB.y += driftY;

      positions[i * 6] = tempA.x;
      positions[i * 6 + 1] = tempA.y;
      positions[i * 6 + 2] = tempA.z;
      positions[i * 6 + 3] = tempB.x;
      positions[i * 6 + 4] = tempB.y;
      positions[i * 6 + 5] = tempB.z;
    }
    geometry.attributes.position.needsUpdate = true;
    lineMaterial.opacity = lineOpacity;

    nodeMeshes.forEach((mesh, i) => {
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = lerp(0, 0.35, noiseP) * (1 - alignmentMix * 0.9);
      mesh.position.x += Math.sin(elapsedSeconds * 0.5 + i) * 0.002 * driftScale;
      mesh.position.y += Math.cos(elapsedSeconds * 0.42 + i) * 0.002 * driftScale;
    });

    camera.position.z = lerp(9, 7.2, pathP);
    camera.position.y = lerp(0, -0.08, pathP);
    camera.lookAt(lerp(0, 0.6, pathP), 0, 0);

    root.rotation.z = lerp(0.04, 0, alignmentMix);

    renderer.render(scene, camera);
  };

  const dispose = () => {
    geometry.dispose();
    lineMaterial.dispose();
    markerDispose(nodeMeshes, nodeGeometry);
    renderer.dispose();
  };

  return { update, resize, dispose };
}

function markerDispose(nodeMeshes: Mesh[], nodeGeometry: BoxGeometry) {
  nodeMeshes.forEach((mesh) => {
    (mesh.material as MeshBasicMaterial).dispose();
  });
  nodeGeometry.dispose();
}
