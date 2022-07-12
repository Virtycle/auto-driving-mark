import { RendererInstance, RenderInitParams, ObjectLayers, CURSOR_TYPE, STATE } from './interface';
import {
    PerspectiveCamera,
    OrthographicCamera,
    WebGLRenderer,
    WebGL1Renderer,
    Scene,
    AxesHelper,
    Color,
    Group,
    Mesh,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import E2, { Callback } from './common/event-emitter';

const rendererParam = { antialias: true, alpha: true };

export enum MainRendererEvent {
    ObjectTransform = 'objectTransform',
    MeshSelect = 'meshSelect',
    MeshDelete = 'meshDelete',
    MeshCreateClickStart = 'meshCreateClickStart',
    MeshCreateClickMove = 'meshCreateClickMove',
    MeshCreateClickEnd = 'meshCreateClickEnd',
    MeshCreateDragStart = 'meshCreateDragStart',
    MeshCreateDrag = 'meshCreateDrag',
    MeshCreateDragEnd = 'meshCreateDragEnd',
}

export default class MainRenderer implements RendererInstance {
    state = STATE.NONE;

    camera: PerspectiveCamera | undefined;

    cameraLayer = 1;

    renderer: WebGLRenderer | WebGL1Renderer | undefined;

    labelRenderer = new CSS2DRenderer();

    parent: HTMLDivElement | undefined;

    width = 0;

    height = 0;

    controls: OrbitControls | undefined | null;

    axesHelper = new AxesHelper(25);

    helperScene = new Scene();

    helperCamera = new OrthographicCamera(-8, 8, 8 - 8, 1, 5);

    transformControls: TransformControls | undefined | null;

    eventEmitter = new E2();

    capturedPointerId = -1;

    public init(params: RenderInitParams) {
        if (WEBGL.isWebGL2Available()) {
            this.renderer = new WebGLRenderer(rendererParam) as WebGLRenderer;
        } else if (WEBGL.isWebGLAvailable()) {
            this.renderer = new WebGL1Renderer(rendererParam) as WebGL1Renderer;
        } else {
            throw new Error('浏览器不支持webgl！');
        }
        this.parent = params.div;
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.tabIndex = -1;

        this.parent.appendChild(this.renderer.domElement);
        this.parent.appendChild(this.labelRenderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        const width = params.div.clientWidth;
        const height = params.div.clientHeight;
        const radio = width / height;
        this.camera = new PerspectiveCamera(15, radio, 0.1, 2000);
        this.camera.layers.enableAll();
        this.camera.layers.toggle(ObjectLayers.threeView);
        this.camera.layers.toggle(ObjectLayers.none);
        this.camera.position.set(20, -60, 50);
        this.camera.up.set(0, 0, 1);
        this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement);
        this.controls.minDistance = 5;
        this.controls.maxDistance = 1000;
        this.controls.maxPolarAngle = (Math.PI * 7) / 12;
        this.controls.update();
        this.transformControls = new TransformControls(this.camera, this.labelRenderer.domElement);
        this.transformControls.space = 'local';
        this.axesHelper.position.set(0, 0, 0);
        this.helperScene.add(this.axesHelper);
        this.helperScene.background = new Color(0x000000);
        this.resize(width, height);
        this.helperCamera.position.set(0, 0, 50);
        this.helperCamera.lookAt(this.helperScene.position);
        this.initEvent();
    }

    private initEvent() {
        this.transformControls?.addEventListener('dragging-changed', (event) => {
            if (this.state !== STATE.NONE) return;
            (this.controls as OrbitControls).enabled = !event.value;
        });
        this.transformControls?.addEventListener('change', (event) => {
            if (this.state !== STATE.NONE) return;
            this.eventEmitter.emit(MainRendererEvent.ObjectTransform, event);
        });
        if (this.labelRenderer) {
            this.labelRenderer.domElement.addEventListener('click', this.onClick);
            this.labelRenderer.domElement.addEventListener('keydown', this.onKeyDown);
            this.labelRenderer.domElement.addEventListener('pointerdown', this.onPointerDown);
            this.labelRenderer.domElement.addEventListener('pointermove', this.onPointerMove);
            this.labelRenderer.domElement.addEventListener('pointercancel', this.onPointerCancel);
        }
    }

    private removeAllEvent() {
        if (this.labelRenderer) {
            this.labelRenderer.domElement.removeEventListener('click', this.onClick);
            this.labelRenderer.domElement.removeEventListener('keydown', this.onKeyDown);
            this.labelRenderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
            this.labelRenderer.domElement.removeEventListener('pointermove', this.onPointerMove);
            this.labelRenderer.domElement.removeEventListener('pointercancel', this.onPointerCancel);
        }
    }

    private onPointerDown = (event: PointerEvent) => {
        if (this.state === STATE.NONE || this.capturedPointerId !== -1) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        this.labelRenderer.domElement.setPointerCapture(event.pointerId);
        this.capturedPointerId = event.pointerId;
        if (this.state === STATE.DRAW_PICK) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateClickStart, event, this.camera, this.renderer);
        } else if (this.state === STATE.DRAW_DRAG) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateDragStart, event, this.camera, this.renderer);
        }
        this.labelRenderer.domElement.addEventListener('pointerup', this.onPointerUp);
    };

    private onPointerMove = (event: PointerEvent) => {
        if (this.state === STATE.DRAW_PICK && this.capturedPointerId === event.pointerId) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateClickMove, event, this.camera, this.renderer);
        } else if (this.state === STATE.DRAW_DRAG && this.capturedPointerId === event.pointerId) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateDrag, event, this.camera, this.renderer);
        }
    };

    private onPointerUp = (event: PointerEvent) => {
        if (this.state === STATE.DRAW_PICK && this.capturedPointerId === event.pointerId) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateClickEnd, event);
        } else if (this.state === STATE.DRAW_DRAG && this.capturedPointerId === event.pointerId) {
            this.eventEmitter.emit(MainRendererEvent.MeshCreateDragEnd, event);
        }
        this.changeState(STATE.NONE);
        this.labelRenderer.domElement.releasePointerCapture(event.pointerId);
        this.capturedPointerId = -1;
        this.labelRenderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    };

    private onPointerCancel = () => {
        this.capturedPointerId = -1;
        this.labelRenderer?.domElement.removeEventListener('pointerup', this.onPointerUp);
    };

    private onClick = (event: MouseEvent) => {
        if (this.state !== STATE.NONE) return;
        this.eventEmitter.emit(MainRendererEvent.MeshSelect, event, this.camera, this.renderer);
    };

    private onKeyDown = (event: KeyboardEvent) => {
        event.preventDefault();
        // event.stopPropagation();
        if (this.state !== STATE.NONE) return;
        switch (event.key) {
            case 'Delete':
                this.eventEmitter.emit(MainRendererEvent.MeshDelete);
                break;
        }
    };

    public addEventHandler(name: MainRendererEvent, callBack: Callback) {
        this.eventEmitter.on(name, callBack);
    }

    public removeEventHandler(name: MainRendererEvent) {
        this.eventEmitter.off(name);
    }

    public changeCursorType(cursor: CURSOR_TYPE) {
        if (this.renderer) this.labelRenderer.domElement.style.cursor = cursor;
    }

    public changeState(state: STATE): void {
        if (state === this.state) return;
        const enable = state === STATE.NONE;
        if (this.controls) {
            this.controls.enablePan = enable;
            this.controls.enableRotate = enable;
        }
        if (this.transformControls) {
            this.transformControls.enabled = enable;
        }
        if (state === STATE.DRAW_DRAG || state === STATE.DRAW_PICK) {
            this.changeCursorType(CURSOR_TYPE.CROSS);
        } else {
            this.changeCursorType(CURSOR_TYPE.DEFAULT);
        }
        this.state = state;
    }

    public resize(width: number, height: number, resizeRenderer = true): void {
        if (!this.camera || !this.renderer) {
            throw Error('Not initialized.');
        }
        this.width = width;
        this.height = height;
        if (this.camera instanceof PerspectiveCamera) {
            this.camera.aspect = width / height;
        }
        this.camera.updateProjectionMatrix();
        if (resizeRenderer) {
            this.renderer.setSize(width, height);
            this.labelRenderer?.setSize(width, height);
        }

        const insetWidth = height / 6; // square
        const insetHeight = height / 6;

        this.helperCamera.left = insetWidth / -2;
        this.helperCamera.right = insetWidth / 2;
        this.helperCamera.top = insetHeight / 2;
        this.helperCamera.bottom = insetHeight / -2;
        this.helperCamera.updateProjectionMatrix();
    }

    public bindObject3DWithControl(flag: boolean, mesh?: Group | Mesh) {
        if (flag && mesh) {
            this.transformControls?.attach(mesh);
        } else {
            this.transformControls?.detach();
        }
    }

    public render(scene: Scene) {
        if (!this.renderer || !this.camera) {
            throw Error('Not initialized.');
        }
        this.renderer.setViewport(0, 0, this.width, this.height);
        this.controls?.update();
        this.renderer.render(scene, this.camera);

        // inset scene

        this.renderer.setClearColor(0x222222, 1);

        this.renderer.clearDepth();

        this.renderer.setScissorTest(true);

        const insetHeight = this.height / 6;

        this.renderer.setScissor(0, 0, insetHeight, insetHeight);

        this.renderer.setViewport(0, 0, insetHeight, insetHeight);

        const quater = this.camera.quaternion.clone();
        this.helperScene.quaternion.copy(quater.invert());

        this.renderer.render(this.helperScene, this.helperCamera);

        this.labelRenderer?.render(scene, this.camera);

        this.renderer.setScissorTest(false);
        this.renderer.autoClear = true;
    }

    public destroy() {
        this.controls?.dispose();
        this.transformControls?.dispose();
        this.controls = null;
        this.transformControls = null;
        this.eventEmitter.destroy();
        this.removeAllEvent();
        this.axesHelper.dispose();
        this.renderer?.dispose();
        // this.labelRenderer = null;
    }
}
