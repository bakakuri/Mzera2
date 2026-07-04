import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LIGHT_TILE = 0xe8d3ad;
const DARK_TILE = 0x8a5a34;
const SEL_COLOR = 0x6750f2;
const MOVE_COLOR = 0x8a7bf5;
const CAP_COLOR = 0xe5484d;
const WHITE_MAT = () => new THREE.MeshStandardMaterial({ color: 0xf3ecdd, roughness: 0.45, metalness: 0.06 });
const BLACK_MAT = () => new THREE.MeshStandardMaterial({ color: 0x2a2730, roughness: 0.4, metalness: 0.12 });

const worldX = (c) => c - 3.5;
const worldZ = (r) => r - 3.5;

// builds a stylized (primitive-only, no external assets) low-poly piece mesh group.
function buildPiece(type, mat) {
  const g = new THREE.Group();
  const add = (mesh, y) => { mesh.position.y = y; mesh.material = mat; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const base = new THREE.CylinderGeometry(0.32, 0.36, 0.12, 20);
  add(new THREE.Mesh(base), 0.06);
  if (type === "P") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.28, 16)), 0.12 + 0.14);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12)), 0.12 + 0.28 + 0.1);
  } else if (type === "R") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.42, 16)), 0.12 + 0.21);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 8)), 0.12 + 0.42 + 0.06);
  } else if (type === "N") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 16)), 0.12 + 0.15);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.42));
    head.rotation.x = -0.35;
    add(head, 0.12 + 0.3 + 0.13);
  } else if (type === "B") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.4, 16)), 0.12 + 0.2);
    add(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 16)), 0.12 + 0.4 + 0.16);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8)), 0.12 + 0.4 + 0.34 + 0.05);
  } else if (type === "Q") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.5, 16)), 0.12 + 0.25);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12)), 0.12 + 0.5 + 0.1);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20));
    crown.rotation.x = Math.PI / 2;
    add(crown, 0.12 + 0.5 + 0.22);
  } else if (type === "K") {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.56, 16)), 0.12 + 0.28);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12)), 0.12 + 0.56 + 0.08);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06));
    add(crossV, 0.12 + 0.56 + 0.16 + 0.12);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06));
    add(crossH, 0.12 + 0.56 + 0.16 + 0.16);
  }
  return g;
}

// props: game (chess state), selected {r,c}|null, legalTargets (moves array), onSquareTap(r,c),
// flipped (bool), disabled (bool — suppress interaction while game over / not your turn online).
export function Board3D({ game, selected, legalTargets, onSquareTap, flipped, disabled }) {
  const containerRef = useRef(null);
  const stateRef = useRef({});
  const onTapRef = useRef(onSquareTap);
  const disabledRef = useRef(disabled);
  onTapRef.current = onSquareTap;
  disabledRef.current = disabled;

  // mount: scene / camera / renderer / lights / static board / interaction / render loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const s = stateRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14121d);
    scene.fog = new THREE.Fog(0x14121d, 9, 20);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 7;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(4, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fa0ff, 0.35);
    rim.position.set(-6, 5, -6);
    scene.add(rim);

    // board frame + 64 tiles
    const boardGroup = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.3, 9.2),
      new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.6 })
    );
    frame.position.y = -0.16;
    frame.receiveShadow = true;
    boardGroup.add(frame);
    const tileMeshes = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const dark = (r + c) % 2 === 1;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.98, 0.1, 0.98),
          new THREE.MeshStandardMaterial({ color: dark ? DARK_TILE : LIGHT_TILE, roughness: 0.55 })
        );
        tile.position.set(worldX(c), -0.005, worldZ(r));
        tile.receiveShadow = true;
        tile.userData = { r, c, kind: "tile" };
        boardGroup.add(tile);
        tileMeshes.push(tile);
      }
    }
    scene.add(boardGroup);

    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);
    const highlightGroup = new THREE.Group();
    scene.add(highlightGroup);

    // tap-to-select (distinguishes a tap from an orbit-drag by pointer travel distance)
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downPos = null;
    const toNdc = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onDown = (e) => { downPos = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!downPos) return;
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (dist > 7 || disabledRef.current) return;
      toNdc(e);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(tileMeshes, false)[0];
      if (hit && onTapRef.current) onTapRef.current(hit.object.userData.r, hit.object.userData.c);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const tweens = s.tweens || [];
      if (tweens.length) {
        const now = performance.now();
        s.tweens = tweens.filter((tw) => {
          const t = Math.min(1, (now - tw.t0) / tw.dur);
          tw.mesh.position.lerpVectors(tw.from, tw.to, 1 - Math.pow(1 - t, 3));
          return t < 1;
        });
      }
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    Object.assign(s, { scene, camera, renderer, controls, boardGroup, piecesGroup, highlightGroup, tileMeshes, tweens: [] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose()); else obj.material.dispose(); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // camera side (flip = pass the device to the other player)
  useEffect(() => {
    const s = stateRef.current;
    if (!s.camera) return;
    const z = flipped ? -9.6 : 9.6;
    s.camera.position.set(0, 8.6, z);
    s.camera.lookAt(0, 0, 0);
    if (s.controls) s.controls.target.set(0, 0, 0);
  }, [flipped]);

  // rebuild pieces whenever the game state changes; animate the piece that just moved
  useEffect(() => {
    const s = stateRef.current;
    if (!s.piecesGroup || !game) return;
    const last = game.history.length ? game.history[game.history.length - 1] : null;

    while (s.piecesGroup.children.length) {
      const m = s.piecesGroup.children.pop();
      s.piecesGroup.remove(m);
    }
    const newTweens = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = game.board[r][c];
        if (!p) continue;
        const mat = p[0] === "w" ? WHITE_MAT() : BLACK_MAT();
        const mesh = buildPiece(p[1], mat);
        const toVec = new THREE.Vector3(worldX(c), 0, worldZ(r));
        let fromVec = null;
        if (last && last.to.r === r && last.to.c === c) fromVec = new THREE.Vector3(worldX(last.from.c), 0, worldZ(last.from.r));
        else if (last && last.castle) {
          const rank = last.to.r;
          const rookTo = last.castle === "K" ? { r: rank, c: 5 } : { r: rank, c: 3 };
          const rookFrom = last.castle === "K" ? { r: rank, c: 7 } : { r: rank, c: 0 };
          if (rookTo.r === r && rookTo.c === c && p[1] === "R") fromVec = new THREE.Vector3(worldX(rookFrom.c), 0, worldZ(rookFrom.r));
        }
        mesh.position.copy(fromVec || toVec);
        s.piecesGroup.add(mesh);
        if (fromVec) newTweens.push({ mesh, from: fromVec.clone(), to: toVec.clone(), t0: performance.now(), dur: 260 });
      }
    }
    s.tweens = newTweens;
  }, [game]);

  // selection + legal-move highlights
  useEffect(() => {
    const s = stateRef.current;
    if (!s.highlightGroup) return;
    while (s.highlightGroup.children.length) s.highlightGroup.remove(s.highlightGroup.children[0]);
    if (selected) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.48, 24),
        new THREE.MeshBasicMaterial({ color: SEL_COLOR, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(worldX(selected.c), 0.055, worldZ(selected.r));
      s.highlightGroup.add(ring);
    }
    (legalTargets || []).forEach((m) => {
      const dot = new THREE.Mesh(
        m.capture ? new THREE.RingGeometry(0.34, 0.42, 20) : new THREE.CircleGeometry(0.14, 20),
        new THREE.MeshBasicMaterial({ color: m.capture ? CAP_COLOR : MOVE_COLOR, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(worldX(m.to.c), 0.055, worldZ(m.to.r));
      s.highlightGroup.add(dot);
    });
  }, [selected, legalTargets]);

  return <div ref={containerRef} className="w-full h-full" style={{ touchAction: "none" }} />;
}
