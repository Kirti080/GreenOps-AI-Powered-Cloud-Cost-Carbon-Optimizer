import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SERVER_NODES = [
  { lat: 40.7,   lng: -74.0,  label: 'us-east-1',  color: 0x10b981 },
  { lat: 37.8,   lng: -122.4, label: 'us-west-2',  color: 0x10b981 },
  { lat: 51.5,   lng: -0.12,  label: 'eu-west-1',  color: 0x06b6d4 },
  { lat: 35.68,  lng: 139.69, label: 'ap-east-1',  color: 0x8b5cf6 },
  { lat:  1.35,  lng: 103.82, label: 'ap-south-1', color: 0x8b5cf6 },
  { lat: 19.08,  lng:  72.88, label: 'ap-south-2', color: 0x06b6d4 },
];

function latLngToVec3(lat: number, lng: number, r: number) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

export default function GlobeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    let animId: number;
    let mouseX = 0, mouseY = 0;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 2.8;

    // ── Globe dot matrix ─────────────────────────────────────────────────────
    const R = 1;
    const DOT_N = 12000;
    const positions = new Float32Array(DOT_N * 3);
    const colors    = new Float32Array(DOT_N * 3);

    for (let i = 0; i < DOT_N; i++) {
      const phi   = Math.acos(-1 + (2 * i) / DOT_N);
      const theta = Math.sqrt(DOT_N * Math.PI) * phi;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Teal-to-cyan-to-purple gradient based on latitude band
      const t = (y + 1) / 2; // 0 = south, 1 = north
      colors[i * 3]     = 0.04 + t * 0.35;
      colors[i * 3 + 1] = 0.72 - t * 0.1;
      colors[i * 3 + 2] = 0.5  + t * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.009,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const globe = new THREE.Points(geo, mat);
    scene.add(globe);

    // ── Atmosphere glow ──────────────────────────────────────────────────────
    const atmosGeo = new THREE.SphereGeometry(1.06, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.04,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    // outer rim
    const rimGeo = new THREE.SphereGeometry(1.12, 64, 64);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.02,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(rimGeo, rimMat));

    // ── Server node markers ──────────────────────────────────────────────────
    const nodeGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const nodeObjs: THREE.Mesh[] = [];

    SERVER_NODES.forEach(node => {
      const pos = latLngToVec3(node.lat, node.lng, R);
      const mesh = new THREE.Mesh(
        nodeGeo,
        new THREE.MeshBasicMaterial({
          color: node.color,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
        })
      );
      mesh.position.copy(pos);
      scene.add(mesh);
      nodeObjs.push(mesh);

      // Halo ring around each node
      const haloGeo = new THREE.RingGeometry(0.035, 0.055, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos);
      halo.lookAt(0, 0, 0);
      scene.add(halo);
    });

    // ── Connection arcs between nodes ────────────────────────────────────────
    const CONNECTIONS = [[0,1],[0,2],[1,2],[2,3],[3,4],[4,5],[1,5]];

    CONNECTIONS.forEach(([a, b]) => {
      const pA = latLngToVec3(SERVER_NODES[a].lat, SERVER_NODES[a].lng, R);
      const pB = latLngToVec3(SERVER_NODES[b].lat, SERVER_NODES[b].lng, R);
      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(1.3); // arc bulge outward

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const pts   = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      scene.add(new THREE.Line(arcGeo, arcMat));
    });

    // ── Floating particle field (data streams) ───────────────────────────────
    const PARTICLE_N = 200;
    const pPositions = new Float32Array(PARTICLE_N * 3);
    for (let i = 0; i < PARTICLE_N; i++) {
      const r    = 1.4 + Math.random() * 0.8;
      const phi  = Math.random() * Math.PI;
      const theta = Math.random() * 2 * Math.PI;
      pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.cos(phi);
      pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.006, color: 0x34d399, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Mouse parallax ───────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Animation loop ───────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.005;

      globe.rotation.y += 0.0015 + mouseX * 0.0008;
      globe.rotation.x  = mouseY * 0.3;

      particles.rotation.y -= 0.0008;
      particles.rotation.x  = Math.sin(t * 0.3) * 0.1;

      // pulse server nodes
      nodeObjs.forEach((n, i) => {
        const pulse = 1 + 0.25 * Math.sin(t * 2 + i * 1.2);
        n.scale.setScalar(pulse);
        (n.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 2 + i);
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      geo.dispose(); mat.dispose();
      atmosGeo.dispose(); atmosMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
      aria-label="3D Globe showing global server infrastructure"
    />
  );
}
