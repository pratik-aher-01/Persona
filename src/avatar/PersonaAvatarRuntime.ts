import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { ExpressionController } from './expressions';
import { GazeController } from './gaze';
import { IdleController } from './animation/idle';
import { GestureController } from './animation/gestures';
import type { GestureName } from './animation/gestures';
import { BehaviorOrchestrator, type SemanticBehavior } from './behavior/behaviorOrchestrator';
import { HumanizationEngine } from './behavior/humanizationEngine';
import type {
  AvatarActivity,
  AvatarControllerApi,
  AvatarState,
  PersonaEmotion,
  VrmValidationReport,
} from './avatarTypes';

export class PersonaAvatarRuntime implements AvatarControllerApi {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // VRM Instance & Subsystems
  private vrm: VRM | null = null;
  private expressionController: ExpressionController;
  private gazeController: GazeController;
  private idleController: IdleController;
  private gestureController: GestureController;
  private behaviorOrchestrator: BehaviorOrchestrator;
  private humanizationEngine: HumanizationEngine;

  // State & Validation
  private currentEmotion: PersonaEmotion = 'neutral';
  private currentActivity: AvatarActivity = 'idle';
  private isSpeakingState = false;
  private validationReport: VrmValidationReport | null = null;

  // Live-tunable config (hardcoded from tuned session)
  private cameraFov     = 24;
  private cameraZ       = 1.26;
  private cameraYOffset = 0;      // relative to head Y
  private cameraLookYOffset = -0.04;
  private cameraX       = 0;
  private headY         = 1.4;    // updated after VRM load

  private avatarScale = 1.0;
  private avatarX = 0;
  private avatarY = 0;
  private avatarZ = -0.1;

  private keyLightX = 5.0;
  private keyLightY = -1.1;
  private keyLightZ = -5.0;
  private exposure  = 0.65;

  // Light refs for live tuning
  private ambientLight!: THREE.AmbientLight;
  private keyLight!:     THREE.DirectionalLight;
  private fillLight!:    THREE.DirectionalLight;
  private rimLight!:     THREE.DirectionalLight;

  // Callbacks
  private onLoadCallback?: (report: VrmValidationReport) => void;
  private onErrorCallback?: (error: Error) => void;
  private modelUrl?: string;

  constructor(
    container: HTMLElement,
    options?: {
      modelUrl?: string;
      onLoad?: (report: VrmValidationReport) => void;
      onError?: (error: Error) => void;
    }
  ) {
    this.container = container;
    this.modelUrl = options?.modelUrl;
    this.onLoadCallback = options?.onLoad;
    this.onErrorCallback = options?.onError;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      24, // Hardcoded portrait FOV from tuned session
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      20.0
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.exposure;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // Subsystems
    this.expressionController = new ExpressionController();
    this.gazeController = new GazeController(this.scene);
    this.idleController = new IdleController();
    this.gestureController = new GestureController();
    this.behaviorOrchestrator = new BehaviorOrchestrator(
      this.expressionController,
      this.gestureController,
      this.gazeController
    );
    this.humanizationEngine = new HumanizationEngine(
      this.expressionController,
      this.gestureController,
      this.gazeController
    );

    this.setupLighting();
    this.setupResizeHandler();
    this.startAnimationLoop();

    // Load VRM Model
    this.loadVRMModel();
  }

  private setupLighting() {
    // Soft studio ambient bounce light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(this.ambientLight);

    // Key Light: main directional light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(this.keyLightX, this.keyLightY, this.keyLightZ);
    this.scene.add(this.keyLight);

    // Fill Light: shadow fill
    this.fillLight = new THREE.DirectionalLight(0xf0f4ff, 1.15);
    this.fillLight.position.set(-1.5, 1.5, 1.2);
    this.scene.add(this.fillLight);

    // Rim/Back Light: subtle edge separation
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.rimLight.position.set(0, 2.2, -1.8);
    this.scene.add(this.rimLight);
  }

  private setupResizeHandler() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  private async loadVRMModel() {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const modelCandidates = this.modelUrl
      ? [this.modelUrl, '/models/Alex0.1.vrm', '/models/persona.vrm']
      : ['/models/Alex0.1.vrm', '/models/persona.vrm'];

    let loadedVrm: VRM | null = null;
    let lastError: Error | null = null;

    for (const url of modelCandidates) {
      try {
        const gltf = await loader.loadAsync(url);
        loadedVrm = gltf.userData.vrm as VRM;
        if (loadedVrm) break;
      } catch (err) {
        lastError = err as Error;
      }
    }

    if (!loadedVrm) {
      const err = lastError || new Error(`No VRM model found at ${this.modelUrl || '/models/Alex0.1.vrm'}`);
      console.error('[PersonaVRM] Loading error:', err);
      if (this.onErrorCallback) this.onErrorCallback(err);
      return;
    }

    this.vrm = loadedVrm;

    // Combine skeleton meshes for performance (replaces deprecated removeUnnecessaryJoints)
    VRMUtils.combineSkeletons(this.vrm.scene);
    VRMUtils.rotateVRM0(this.vrm);

    // Disable frustum culling to prevent model popping on frame edges
    this.vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });

    this.scene.add(this.vrm.scene);
    this.applyAvatarTransform();

    // Frame camera on avatar head/upper body
    this.frameAvatarCamera();

    // Tell the gaze controller where the camera is so it can track the user correctly
    this.gazeController.setCameraPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z,
    );

    // Initialize subsystems with loaded VRM
    const caps = this.expressionController.attach(this.vrm);
    this.gestureController.attach(this.vrm);
    this.gazeController.attach(this.vrm, this.scene);
    this.idleController.setVRM(this.vrm);
    this.humanizationEngine.attach(this.vrm);

    // Apply initial emotion & gaze toward user/camera
    this.expressionController.setEmotion(this.currentEmotion);
    this.gazeController.setActivityGaze('idle');

    // Run VRM validation inspection & report
    this.validationReport = this.inspectAndReportVRM(this.vrm, caps.rawMorphTargets.size);
    if (this.onLoadCallback) {
      this.onLoadCallback(this.validationReport);
    }
  }

  private applyAvatarTransform() {
    if (!this.vrm) return;
    this.vrm.scene.scale.set(this.avatarScale, this.avatarScale, this.avatarScale);
    this.vrm.scene.position.set(this.avatarX, this.avatarY, this.avatarZ);
  }

  private frameAvatarCamera() {
    if (!this.vrm) return;

    let headY = 1.4;
    if (this.vrm.humanoid) {
      const headNode = this.vrm.humanoid.getNormalizedBoneNode('head');
      if (headNode) {
        const worldPos = new THREE.Vector3();
        headNode.getWorldPosition(worldPos);
        headY = worldPos.y;
      }
    }
    this.headY = headY;

    this.camera.fov = this.cameraFov;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(this.cameraX, headY + this.cameraYOffset, this.cameraZ);
    this.camera.lookAt(0, headY + this.cameraLookYOffset, 0);
  }

  private inspectAndReportVRM(vrm: VRM, rawMorphTargetsCount = 0): VrmValidationReport {
    const meta = vrm.meta;
    const expMgr = vrm.expressionManager;

    const presetExps: string[] = [];
    const customExps: string[] = [];

    if (expMgr) {
      for (const [name] of Object.entries(expMgr.expressionMap)) {
        if (['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised', 'aa', 'ih', 'ou', 'ee', 'oh', 'blink', 'blinkLeft', 'blinkRight'].includes(name)) {
          presetExps.push(name);
        } else {
          customExps.push(name);
        }
      }
    }

    const metaObj = meta as unknown as Record<string, unknown>;
    const metaName = (metaObj?.name || metaObj?.title || metaObj?.exporterVersion || 'Persona VRM Avatar') as string;
    const metaAuthor = (Array.isArray(metaObj?.authors) ? metaObj.authors.join(', ') : metaObj?.author || 'Unknown') as string;

    const report: VrmValidationReport = {
      vrmVersion: metaObj?.metaVersion === '0' || metaObj?.exporterVersion ? '0.x' : '1.0',
      humanoidAvailable: Boolean(vrm.humanoid),
      expressionManagerAvailable: Boolean(vrm.expressionManager),
      lookAtAvailable: Boolean(vrm.lookAt),
      springBonesAvailable: Boolean(vrm.springBoneManager),
      presetExpressions: presetExps,
      customExpressions: customExps,
      rawMorphTargetsCount,
      vrmMetaName: metaName,
      vrmMetaAuthor: metaAuthor,
    };

    console.log('[PersonaVRM] Asset Loaded & Validated:', report);
    console.log('[PersonaVRM] Preset expressions found:', presetExps.join(', '));
    console.log('[PersonaVRM] Custom expressions found:', customExps.join(', ') || '(none)');
    return report;
  }

  private startAnimationLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();

      if (this.vrm) {
        // 1. Update gesture controller — returns bone offsets
        const gestureOffsets = this.gestureController.update(delta);

        // 2. Pass gesture offsets to idle controller before it writes bones
        this.idleController.applyGestureOffsets(gestureOffsets);

        // 3. Idle (breathing, blink, head sway + gesture composition)
        this.idleController.update(delta);

        // 4. Expressions (emotion + mouth)
        this.expressionController.update(delta);

        // 5. Gaze (smooth tracking + wander)
        this.gazeController.update(delta);

        // 6. Humanization & Natural Behavior Updates
        this.humanizationEngine.update(delta);

        // 7. VRM internal update (springBones, lookAt, etc.)
        this.vrm.update(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  // --- AvatarControllerApi Implementation ---

  /** Live-tune camera. Call after VRM has loaded. */
  public setCameraConfig(cfg: {
    fov?: number;
    cameraZ?: number;
    cameraYOffset?: number;
    cameraLookYOffset?: number;
    cameraX?: number;
    x?: number;
    y?: number;
  }) {
    if (cfg.fov                !== undefined) this.cameraFov          = cfg.fov;
    if (cfg.cameraZ            !== undefined) this.cameraZ            = cfg.cameraZ;
    if (cfg.cameraYOffset      !== undefined) this.cameraYOffset      = cfg.cameraYOffset;
    if (cfg.cameraLookYOffset  !== undefined) this.cameraLookYOffset  = cfg.cameraLookYOffset;
    if (cfg.cameraX            !== undefined) this.cameraX            = cfg.cameraX;
    if (cfg.x                  !== undefined) this.cameraX            = cfg.x;
    if (cfg.y                  !== undefined) this.cameraYOffset      = cfg.y;

    // Re-apply immediately
    this.camera.fov = this.cameraFov;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(this.cameraX, this.headY + this.cameraYOffset, this.cameraZ);
    this.camera.lookAt(0, this.headY + this.cameraLookYOffset, 0);
  }

  public getCameraConfig() {
    return {
      fov:               this.cameraFov,
      cameraZ:           this.cameraZ,
      cameraYOffset:     this.cameraYOffset,
      cameraLookYOffset: this.cameraLookYOffset,
      cameraX:           this.cameraX,
      x:                 this.cameraX,
      y:                 this.cameraYOffset,
    };
  }

  /** Live-tune lighting intensities and positions. */
  public setLightingConfig(cfg: {
    ambient?: number;
    key?: number;
    fill?: number;
    rim?: number;
    keyX?: number;
    keyY?: number;
    keyZ?: number;
    exposure?: number;
  }) {
    if (cfg.ambient !== undefined) this.ambientLight.intensity = cfg.ambient;
    if (cfg.key     !== undefined) this.keyLight.intensity     = cfg.key;
    if (cfg.fill    !== undefined) this.fillLight.intensity    = cfg.fill;
    if (cfg.rim     !== undefined) this.rimLight.intensity     = cfg.rim;
    if (cfg.keyX    !== undefined) this.keyLightX              = cfg.keyX;
    if (cfg.keyY    !== undefined) this.keyLightY              = cfg.keyY;
    if (cfg.keyZ    !== undefined) this.keyLightZ              = cfg.keyZ;
    if (this.keyLight) {
      this.keyLight.position.set(this.keyLightX, this.keyLightY, this.keyLightZ);
    }
    if (cfg.exposure !== undefined) {
      this.exposure = cfg.exposure;
      this.renderer.toneMappingExposure = this.exposure;
    }
  }

  public getLightingConfig() {
    return {
      ambient:  this.ambientLight.intensity,
      key:      this.keyLight.intensity,
      fill:     this.fillLight.intensity,
      rim:      this.rimLight.intensity,
      keyX:     this.keyLightX,
      keyY:     this.keyLightY,
      keyZ:     this.keyLightZ,
      exposure: this.exposure,
    };
  }

  public setAvatarConfig(cfg: {
    scale?: number;
    x?: number;
    y?: number;
    z?: number;
  }) {
    if (cfg.scale !== undefined) this.avatarScale = cfg.scale;
    if (cfg.x     !== undefined) this.avatarX     = cfg.x;
    if (cfg.y     !== undefined) this.avatarY     = cfg.y;
    if (cfg.z     !== undefined) this.avatarZ     = cfg.z;
    this.applyAvatarTransform();
  }

  public getAvatarConfig() {
    return {
      scale: this.avatarScale,
      x:     this.avatarX,
      y:     this.avatarY,
      z:     this.avatarZ,
    };
  }

  public setEmotion(emotion: PersonaEmotion) {
    this.currentEmotion = emotion;
    this.expressionController.setEmotion(emotion);
    this.humanizationEngine.setEmotion(emotion);
  }

  public setBehavior(behavior: SemanticBehavior) {
    this.behaviorOrchestrator.setBehavior(behavior);
  }

  public setActivity(activity: AvatarActivity) {
    const previous = this.currentActivity;
    this.currentActivity = activity;

    // Propagate activity through humanization engine, idle controller & behavior orchestrator
    this.idleController.setActivity(activity);
    this.humanizationEngine.setActivity(activity);
    this.behaviorOrchestrator.setBehavior(activity as SemanticBehavior);

    // Handle speaking sub-state
    if (activity === 'speaking') {
      this.setSpeaking(true);
    } else {
      this.setSpeaking(false);
    }

    console.log(`[PersonaVRM] Activity: ${previous} → ${activity}`);
  }

  public setSpeaking(isSpeaking: boolean) {
    this.isSpeakingState = isSpeaking;
    this.expressionController.setSpeaking(isSpeaking);
  }

  public lookAt(target: THREE.Vector3 | { x: number; y: number; z: number }) {
    this.gazeController.setLookTarget(target.x, target.y, target.z);
  }

  public lookAtUser() {
    this.gazeController.lookAtUser();
  }

  public lookAtCenter() {
    this.gazeController.lookAtCenter();
  }

  public lookAway() {
    this.gazeController.lookAway();
  }

  public triggerBlink() {
    this.idleController.triggerBlink();
  }

  public playGesture(gestureName: string) {
    const validGestures: GestureName[] = [
      'idle',
      'nod',
      'shake_head',
      'head_tilt',
      'acknowledge',
      'agree',
      'disagree',
      'thinking',
      'lean_forward',
      'lean_back',
      'subtle_hand_open',
      'explain_hand',
      'small_hand_raise',
      'hand_emphasis',
      'hands_together',
      'thoughtful_hand',
      'welcoming_hand',
      'shrug',
    ];
    const name = validGestures.includes(gestureName as GestureName)
      ? (gestureName as GestureName)
      : 'nod'; // safe fallback
    this.gestureController.play(name);
    console.log(`[PersonaVRM] Gesture triggered: ${name}`);
  }

  public getValidationReport(): VrmValidationReport | null {
    return this.validationReport;
  }

  public getState(): AvatarState {
    return {
      emotion: this.currentEmotion,
      activity: this.isSpeakingState ? 'speaking' : this.currentActivity,
      gazeTarget: this.gazeController.getTarget(),
      isBlinking: this.idleController.isCurrentlyBlinking(),
    };
  }

  // --- Cleanup / Disposal ---

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.expressionController.detach();
    this.gestureController.detach();
    this.gazeController.detach();
    this.humanizationEngine.detach();

    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }

    this.scene.traverse((child) => {
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
