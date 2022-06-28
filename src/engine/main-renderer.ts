import { RendererInstance, RenderInitParams } from './interface';
import { PerspectiveCamera, OrthographicCamera, WebGLRenderer, WebGL1Renderer, Scene, AxesHelper, Color } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';

const rendererParam = { antialias: true, alpha: true };

export default class MainRenderer implements RendererInstance {
    camera: PerspectiveCamera | undefined;

    renderer: WebGLRenderer | WebGL1Renderer | undefined;

    parent: HTMLDivElement | undefined;

    width = 0;

    height = 0;

    controls: OrbitControls | undefined;

    axesHelper = new AxesHelper(25);

    helperScene = new Scene();

    helperCamera = new OrthographicCamera(-8, 8, 8 - 8, 1, 5);

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
        this.camera = new PerspectiveCamera(15, radio, 0.1, 2000);
        this.camera.position.set(20, -60, 50);
        this.camera.up.set(0, 0, 1);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 5;
        this.controls.maxDistance = 1000;
        this.controls.update();
        this.axesHelper.position.set(0, 0, 0);
        this.helperScene.add(this.axesHelper);
        this.helperScene.background = new Color(0x000000);
        this.resize(width, height);
        this.helperCamera.position.set(0, 0, 50);
        this.helperCamera.lookAt(this.helperScene.position);
        this.initEvent();
    }

    initEvent() {
        // this.parent?.addEventListener();
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
        }

        const insetWidth = height / 6; // square
        const insetHeight = height / 6;

        this.helperCamera.left = insetWidth / -2;
        this.helperCamera.right = insetWidth / 2;
        this.helperCamera.top = insetHeight / 2;
        this.helperCamera.bottom = insetHeight / -2;
        this.helperCamera.updateProjectionMatrix();
    }

    render(scene: Scene) {
        if (!this.renderer || !this.camera) {
            throw Error('Not initialized.');
        }
        this.renderer.setViewport(0, 0, this.width, this.height);
        this.controls?.update();
        this.renderer.render(scene, this.camera as PerspectiveCamera);

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

        this.renderer.setScissorTest(false);
        this.renderer.autoClear = true;
    }
}