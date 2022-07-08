import {
    Scene,
    Group,
    Points,
    Color,
    Line,
    Matrix4,
    Box3,
    Raycaster,
    Plane,
    CameraHelper,
    OrthographicCamera,
    Vector3,
    PerspectiveCamera,
} from 'three';
import { STATE, Vec2 } from './interface';
import MainRenderer from './main-renderer';
import FrontRenderer from './front-renderer';
import TopRenderer from './top-renderer';
import SideRenderer from './side-renderer';
import MeshFactory from './mesh-factory';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { getBoxDirection } from './untils';

/**
 * Rendering Engine
 */
export default class SceneRender {
    public state: STATE = STATE.NONE;

    private mainRenderer = new MainRenderer();

    private frontRenderer = new FrontRenderer();

    private topRenderer = new TopRenderer();

    private sideRenderer = new SideRenderer();

    private wrappedScene = new Scene();
    // 放立体框 Group;
    private cubeRoot = new Group();
    // 放点云 Group;
    private pointCloudRoot = new Group();
    // 放限制圆 Group;
    private cirCleRoot = new Group();
    // transformControls
    private transformControlsGroup = new Group();

    private animationId: number | undefined;

    private raycaster = new Raycaster();

    private basePlane: Plane | undefined;

    public init({
        mainDiv,
        topDiv,
        frontDiv,
        sideDiv,
    }: {
        mainDiv: HTMLDivElement;
        topDiv: HTMLDivElement;
        frontDiv: HTMLDivElement;
        sideDiv: HTMLDivElement;
    }): void {
        if (!WEBGL.isWebGL2Available() && !WEBGL.isWebGLAvailable()) {
            const warning = WEBGL.getWebGLErrorMessage();
            console.log(warning);
        }
        this.wrappedScene.background = new Color(0x000000);
        this.mainRenderer.init({ div: mainDiv });
        this.frontRenderer.init({ div: frontDiv });
        this.topRenderer.init({ div: topDiv });
        this.sideRenderer.init({ div: sideDiv });

        this.wrappedScene.add(this.pointCloudRoot);
        this.wrappedScene.add(this.cubeRoot);
        this.wrappedScene.add(this.cirCleRoot);
        this.addTransformControl(this.mainRenderer.transformControls as TransformControls);
        this.wrappedScene.add(this.transformControlsGroup);
        // this.wrappedScene.add(new CameraHelper(this.topRenderer.camera as OrthographicCamera));
    }

    get mainRendererInstance() {
        return this.mainRenderer;
    }

    get topRendererInstance() {
        return this.topRenderer;
    }

    get frontRendererInstance() {
        return this.frontRenderer;
    }

    get sideRendererInstance() {
        return this.sideRenderer;
    }

    get cubeRootGoup() {
        return this.cubeRoot;
    }
    /**
     * start animation.
     */
    public startAnimate(): void {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.render();
        };
        animate();
    }

    public stopAnimate(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    public restartAnimate(): void {
        this.stopAnimate();
        this.startAnimate();
    }

    public render(): void {
        const zoom = this.syncThreeViewZoom();
        this.transformControlsGroup.visible = true;
        this.mainRenderer.render(this.wrappedScene);
        this.transformControlsGroup.visible = false;
        this.frontRenderer.render(this.wrappedScene, zoom);
        this.topRenderer.render(this.wrappedScene, zoom);
        this.sideRenderer.render(this.wrappedScene, zoom);
    }

    public resize() {
        this.mainRenderer.resize(
            this.mainRenderer.parent?.clientWidth as number,
            this.mainRenderer.parent?.clientHeight as number,
        );
        this.frontRenderer.resize(
            this.frontRenderer.parent?.clientWidth as number,
            this.frontRenderer.parent?.clientHeight as number,
        );
        this.topRenderer.resize(
            this.topRenderer.parent?.clientWidth as number,
            this.topRenderer.parent?.clientHeight as number,
        );
        this.sideRenderer.resize(
            this.sideRenderer.parent?.clientWidth as number,
            this.sideRenderer.parent?.clientHeight as number,
        );
    }

    public addPointCloud(points: Points): void {
        this.pointCloudRoot.add(points);
    }

    public removePointCloud(points: Points): void {
        this.pointCloudRoot.remove(points);
    }

    public setBasePlane(normal: Vector3, dis: number) {
        this.basePlane = new Plane(normal, dis);
    }

    public testPlanPosition(pos: Vec2, camera: OrthographicCamera | PerspectiveCamera): Vector3 {
        this.raycaster.setFromCamera(pos, camera);
        const vec3 = new Vector3();
        if (this.basePlane) {
            this.raycaster.ray.intersectPlane(this.basePlane, vec3);
        }
        return vec3;
    }

    public disposePointCloud(points: Points, needDisposeMaterial = false): void {
        this.pointCloudRoot.remove(points);
        if (needDisposeMaterial) {
            MeshFactory.disposeMesh(points);
        } else {
            MeshFactory.disposeGeo(points.geometry);
        }
    }

    public addCube(mesh: Group): void {
        this.cubeRoot.add(mesh);
    }

    public removeCube(mesh: Group): void {
        this.cubeRoot.remove(mesh);
    }

    public removeCubeByName(name: string) {
        const group = this.findCube(name);
        if (group) {
            this.removeCube(group);
        }
    }

    public findCube(name: string): Group | undefined {
        return (this.cubeRoot.children as Group[]).find((item) => item.name === name);
    }

    public addCircle(line: Line): void {
        this.cirCleRoot.add(line);
    }

    public bindActiveCube(flag: boolean, group?: Group) {
        this.mainRenderer?.bindObject3DWithControl(flag, group);
    }

    private syncThreeViewZoom(): number {
        const zoomT = this.topRenderer?.getCameraZoom() as number;
        const zoomF = this.frontRenderer?.getCameraZoom() as number;
        const zoomS = this.sideRenderer?.getCameraZoom() as number;
        if (zoomT === zoomF) return zoomS;
        if (zoomT === zoomS) return zoomF;
        if (zoomF === zoomS) return zoomT;
        return 1;
    }

    public addTransformControl(control: TransformControls): void {
        this.transformControlsGroup.add(control);
    }

    public flyTo(box: Box3, matrix: Matrix4): void {
        const { center, dirX, dirY, disX, disY, disZ } = getBoxDirection(box, matrix);
        this.topRenderer.flyTo(center, dirY, disZ);
        this.frontRenderer.flyTo(center, dirY, disY);
        this.sideRenderer.flyTo(center, dirX, disX);
    }

    public destroy() {
        this.stopAnimate();
        this.mainRenderer.destroy();
        this.topRenderer.destroy();
        this.frontRenderer.destroy();
        this.sideRenderer.destroy();
        this.wrappedScene.clear();
        this.cubeRoot.clear();
        this.cirCleRoot.clear();
        this.pointCloudRoot.clear();
        this.transformControlsGroup.clear();
    }
}
