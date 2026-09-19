import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AvatarBoneKeyframe } from '../../types';

interface IslAvatar3DProps {
  activeGloss?: string | null;
  keyframes?: AvatarBoneKeyframe[];
  isAnimating?: boolean;
}

export const IslAvatar3D: React.FC<IslAvatar3DProps> = ({
  activeGloss,
  keyframes,
  isAnimating = false
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bonesRef = useRef<Record<string, THREE.Object3D>>({});
  const animationStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 320;
    const height = mountRef.current.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 2.8);
    camera.lookAt(0, 1.25, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 1.8);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    // Build Articulated Stylized ISL Humanoid
    const root = new THREE.Group();
    root.position.set(0, 0, 0);
    scene.add(root);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x0f172a
    });

    const clothMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.5,
      metalness: 0.1
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.65, 16);
    const torso = new THREE.Mesh(torsoGeo, clothMat);
    torso.position.set(0, 1.05, 0);
    root.add(torso);

    // Chest Emblem / Grid
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.05), glowMat);
    chestPlate.position.set(0, 1.15, 0.18);
    root.add(chestPlate);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.15, 12), skinMat);
    neck.position.set(0, 1.45, 0);
    root.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);
    const headGeo = new THREE.SphereGeometry(0.16, 20, 20);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Visor / Eyes
    const visorGeo = new THREE.BoxGeometry(0.22, 0.06, 0.12);
    const visorMesh = new THREE.Mesh(visorGeo, glowMat);
    visorMesh.position.set(0, 0.02, 0.12);
    headGroup.add(visorMesh);
    root.add(headGroup);

    // Right Arm Hierarchy
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.32, 1.3, 0);
    root.add(rightShoulder);

    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.32, 12), clothMat);
    rightArmMesh.position.set(0, -0.16, 0);
    rightShoulder.add(rightArmMesh);

    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -0.32, 0);
    rightShoulder.add(rightElbow);

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.3, 12), skinMat);
    rightForearmMesh.position.set(0, -0.15, 0);
    rightElbow.add(rightForearmMesh);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), glowMat);
    rightHand.position.set(0, -0.32, 0);
    rightElbow.add(rightHand);

    // Left Arm Hierarchy
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.32, 1.3, 0);
    root.add(leftShoulder);

    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.32, 12), clothMat);
    leftArmMesh.position.set(0, -0.16, 0);
    leftShoulder.add(leftArmMesh);

    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -0.32, 0);
    leftShoulder.add(leftElbow);

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.3, 12), skinMat);
    leftForearmMesh.position.set(0, -0.15, 0);
    leftElbow.add(leftForearmMesh);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), glowMat);
    leftHand.position.set(0, -0.32, 0);
    leftElbow.add(leftHand);

    // Store bone references
    bonesRef.current = {
      head: headGroup,
      right_arm: rightShoulder,
      right_forearm: rightElbow,
      left_arm: leftShoulder,
      left_forearm: leftElbow
    };

    // Default rest pose
    rightShoulder.rotation.set(0.2, 0, -0.3);
    rightElbow.rotation.set(0.4, 0, 0);
    leftShoulder.rotation.set(0.2, 0, 0.3);
    leftElbow.rotation.set(0.4, 0, 0);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle breathing motion
      torso.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.02;
      headGroup.position.y = 1.62 + Math.sin(elapsedTime * 2) * 0.008;

      // Handle Keyframed Gesture Playback
      if (keyframes && keyframes.length > 0) {
        const animDuration = keyframes[keyframes.length - 1].time || 2.0;
        const progress = (elapsedTime % animDuration);

        // Find surrounding keyframes
        let k1 = keyframes[0];
        let k2 = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
          if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
            k1 = keyframes[i];
            k2 = keyframes[i + 1];
            break;
          }
        }

        const span = Math.max(0.001, k2.time - k1.time);
        const factor = THREE.MathUtils.clamp((progress - k1.time) / span, 0, 1);

        for (const [boneName, obj] of Object.entries(bonesRef.current)) {
          const rot1 = k1.bone_rotations[boneName] || [0, 0, 0];
          const rot2 = k2.bone_rotations[boneName] || [0, 0, 0];

          obj.rotation.x = THREE.MathUtils.lerp(rot1[0], rot2[0], factor);
          obj.rotation.y = THREE.MathUtils.lerp(rot1[1], rot2[1], factor);
          obj.rotation.z = THREE.MathUtils.lerp(rot1[2], rot2[2], factor);
        }
      } else {
        // Idle sway
        rightShoulder.rotation.z = -0.25 + Math.sin(elapsedTime * 1.5) * 0.05;
        leftShoulder.rotation.z = 0.25 - Math.sin(elapsedTime * 1.5) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [keyframes]);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-surface/80 to-background">
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
      
      {/* Active Gloss Badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface/90 border border-accent/30 text-xs backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-slate-300">ISL Gloss:</span>
        </div>
        <span className="font-bold text-accent-light tracking-wide uppercase">
          {activeGloss || 'READY / IDLE'}
        </span>
      </div>
    </div>
  );
};
