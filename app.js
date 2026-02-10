import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const bg = document.getElementById("bg");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c0f12, 8, 35);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
renderer.setClearColor(0x0c0f12);
renderer.shadowMap.enabled = false;
bg.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x88c7c2, 0x0c0f12, 0.9);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0x18d3c6, 1.1);
dir.position.set(5, 8, 4);
scene.add(dir);

const floorGeo = new THREE.PlaneGeometry(40, 40);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f151a, metalness: 0.2, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.3;
scene.add(floor);

function createRobot() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c2b2f, metalness: 0.5, roughness: 0.3 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x18d3c6, metalness: 0.7, roughness: 0.2 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x8ff7ef, emissive: 0x18d3c6, emissiveIntensity: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.7), bodyMat);
  torso.position.y = 0.2;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), bodyMat);
  head.position.y = 1.2;
  group.add(head);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.18, 1.2, 0.32);
  eyeR.position.set(0.18, 1.2, 0.32);
  group.add(eyeL, eyeR);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16), accentMat);
  core.rotation.z = Math.PI / 2;
  core.position.set(0, 0.1, 0.5);
  group.add(core);

  const legGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 16);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  const legR = legL.clone();
  legL.position.set(-0.3, -0.8, 0);
  legR.position.set(0.3, -0.8, 0);
  group.add(legL, legR);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), accentMat);
  antenna.position.set(0, 1.6, 0);
  group.add(antenna);

  return group;
}

const robots = [];
for (let i = 0; i < 9; i++) {
  const r = createRobot();
  const angle = (i / 9) * Math.PI * 2;
  r.position.set(Math.cos(angle) * 3.5, -0.2 + (i % 3) * 0.12, Math.sin(angle) * 3.5);
  r.rotation.y = -angle + Math.PI / 2;
  scene.add(r);
  robots.push(r);
}

const starGeo = new THREE.BufferGeometry();
const starCount = 800;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 60;
  positions[i * 3 + 1] = Math.random() * 20 + 2;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const starMat = new THREE.PointsMaterial({ color: 0x18d3c6, size: 0.05, transparent: true, opacity: 0.6 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

let t = 0;
function animate() {
  t += 0.01;
  robots.forEach((r, i) => {
    r.position.y = -0.2 + Math.sin(t + i) * 0.08;
    r.rotation.y += 0.002;
  });
  stars.rotation.y += 0.0005;
  camera.position.x = Math.sin(t * 0.2) * 0.8;
  camera.lookAt(0, 0.5, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
});

async function hashPassword(pw) {
  const enc = new TextEncoder();
  const data = enc.encode(pw);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hookForm(formId, outId) {
  const form = document.getElementById(formId);
  const out = document.getElementById(outId);
  if (!form || !out) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = new FormData(form).get("password");
    const hash = await hashPassword(String(pw));
    out.textContent = `Hash: ${hash.slice(0, 18)}...`;
  });
}

hookForm("loginForm", "hashOut");
hookForm("loginFormModal", "hashOutModal");

const modal = document.getElementById("loginModal");
document.getElementById("openLogin").addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "false");
});
document.getElementById("closeLogin").addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "true");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.setAttribute("aria-hidden", "true");
});
