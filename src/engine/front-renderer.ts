import {
    RendererInstance,
    RenderInitParams,
    ObjectLayers,
    STATE,
    ThreeViewRendererEvent,
    CURSOR_TYPE,
} from './interface';
import { OrthographicCamera, WebGLRenderer, WebGL1Renderer, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import E2, { Callback } from './common/event-emitter';

const rendererParam = { antialias: true, alpha: true };

export default class FrontRenderer implements RendererInstance {
    state = STATE.NONE;

    camera: OrthographicCamera | undefined;

    renderer: WebGLRenderer | WebGL1Renderer | undefined;

    parent: HTMLDivElement | undefined;

    controls: OrbitControls | undefined;

    width = 0;

    height = 0;

    size = 20;

    distance = 50;

    eventEmitter = new E2();

    capturedPointerId = -1;

    init(params: RenderInitParams) {
        if (WEBGL.isWebGL2Available()) {
            this.renderer = new WebGLRenderer(rendererParam) as WebGLRenderer;
        } else if (WEBGL.isWebGLAvailable()) {
            this.renderer = new WebGL1Renderer(rendererParam) as WebGL1Renderer;
        } else {
            throw new Error('浏览器不支持webgl！');
        }
        this.parent = params.div;
        this.parent?.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        const width = params.div.clientWidth;
        const height = params.div.clientHeight;
        const radio = width / height;
        this.camera = new OrthographicCamera(
            (radio * this.size) / -2,
            (radio * this.size) / 2,
            this.size / 2,
            this.size / -2,
            this.distance - 0.1,
            500,
        );
        this.camera.layers.disableAll();
        this.camera.layers.toggle(ObjectLayers.default);
        this.camera.layers.toggle(ObjectLayers.threeView);
        this.camera.position.set(0, this.distance, 0);
        this.camera.up.set(0, 0, 1);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enablePan = false;
        this.controls.panSpeed = 1;
        this.controls.enableRotate = false;

        this.resize(width, height);
        this.initEvent();
    }

    private initEvent() {
        this.renderer?.domElement.addEventListener('pointerdown', this.onPointerDown);
        this.renderer?.domElement.addEventListener('pointercancel', () => {
            this.state = STATE.NONE;
            this.capturedPointerId = -1;
            this.renderer?.domElement.removeEventListener('pointerup', this.onPointerUp);
        });
        this.renderer?.domElement.addEventListener('pointermove', this.onPointerMove);
    }

    private onPointerDown = (event: PointerEvent) => {
        if (this.state !== STATE.NONE || this.capturedPointerId !== -1) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        this.state = STATE.SELECT;
        this.renderer?.domElement.setPointerCapture(event.pointerId);
        this.capturedPointerId = event.pointerId;
        this.eventEmitter.emit(ThreeViewRendererEvent.ObjectSelect, event, this.camera, this.renderer);
        this.renderer?.domElement.addEventListener('pointerup', this.onPointerUp);
    };

    private onPointerMove = (event: PointerEvent) => {
        if (this.state === STATE.NONE) {
            this.eventEmitter.emit(ThreeViewRendererEvent.MouseMove, event, this.camera, this.renderer);
        } else if (this.state === STATE.SELECT && this.capturedPointerId === event.pointerId) {
            this.eventEmitter.emit(ThreeViewRendererEvent.ObjectChange, event);
        }
    };

    private onPointerUp = (event: PointerEvent) => {
        this.state = STATE.NONE;
        this.renderer?.domElement.setPointerCapture(event.pointerId);
        this.capturedPointerId = -1;
        this.renderer?.domElement.removeEventListener('pointerup', this.onPointerUp);
        this.eventEmitter.emit(ThreeViewRendererEvent.ObjectRelease, event, this.camera, this.renderer);
    };

    public addEventHandler(name: ThreeViewRendererEvent, callBack: Callback) {
        this.eventEmitter.on(name, callBack);
    }

    public removeEventHandler(name: ThreeViewRendererEvent) {
        this.eventEmitter.off(name);
    }

    public changeCursorType(cursor: CURSOR_TYPE) {
        if (this.renderer) this.renderer.domElement.style.cursor = cursor;
    }

    public getCameraZoom() {
        return this.camera?.zoom || 1;
    }

    public setViewSize(size: number): void {
        this.size = size;
    }

    public resize(width: number, height: number, resizeRenderer = true): void {
        if (!this.camera || !this.renderer) {
            throw Error('Not initialized.');
        }
        this.width = width;
        this.height = height;
        if (this.camera instanceof OrthographicCamera) {
            const radio = width / height;
            this.camera.left = (radio * this.size) / -2;
            this.camera.right = (radio * this.size) / 2;
            this.camera.top = this.size / 2;
            this.camera.bottom = this.size / -2;
        }
        this.camera.updateProjectionMatrix();
        if (resizeRenderer) {
            this.renderer.setSize(width, height);
        }
    }

    public flyTo(center: Vector3, dir: Vector3, dis: number): void {
        if (this.camera) {
            this.camera.zoom = 1;
            const newP = new Vector3().addVectors(center, dir.multiplyScalar(this.distance + dis));
            this.controls?.target.set(center.x, center.y, center.z);
            this.camera.position.set(newP.x, newP.y, newP.z);
            this.controls?.update();
            this.camera.updateProjectionMatrix();
        }
    }

    render(scene: Scene, zoom = 1) {
        if (!this.renderer || !this.camera) {
            throw Error('Not initialized.');
        }
        if (this.camera.zoom !== zoom) {
            this.camera.zoom = zoom;
            this.camera.updateProjectionMatrix();
        }
        this.controls?.update();
        this.renderer.render(scene, this.camera);

        this.renderer.autoClear = true;
    }
}
