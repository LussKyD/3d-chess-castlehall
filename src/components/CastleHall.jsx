import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const CastleHall = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // === Scene Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // === Lights ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // === Floor ===
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // === Walls (Mirrors) ===
    const mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });

    const wallGeometry = new THREE.BoxGeometry(100, 20, 1);
    const wallBack = new THREE.Mesh(wallGeometry, mirrorMaterial);
    wallBack.position.set(0, 10, -50);
    scene.add(wallBack);

    const wallFront = new THREE.Mesh(wallGeometry, mirrorMaterial);
    wallFront.position.set(0, 10, 50);
    scene.add(wallFront);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 100), mirrorMaterial);
    wallLeft.position.set(-50, 10, 0);
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 100), mirrorMaterial);
    wallRight.position.set(50, 10, 0);
    scene.add(wallRight);

    // === Guards ===
    const guardGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const guardMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    // Inside guards
    for (let i = 0; i < 5; i++) {
      const guard = new THREE.Mesh(guardGeometry, guardMaterial);
      guard.position.set(-10 + i * 5, 1.5, -10);
      scene.add(guard);
    }

    // Outside guards
    for (let i = 0; i < 5; i++) {
      const guard = new THREE.Mesh(guardGeometry, guardMaterial);
      guard.position.set(-10 + i * 5, 1.5, 20);
      scene.add(guard);
    }

    // === Animate ===
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // === Cleanup ===
    return () => {
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default CastleHall;
