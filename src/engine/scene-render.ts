import { Scene, Group, Points, Mesh, BufferGeometry, Color, Vector3 } from 'three';
import { STATE, RendererInstance, ThreeViewRenderAddon } from './interface';
import MainRenderer from './main-renderer';
import FrontRenderer from './front-renderer';
import TopRenderer from './top-renderer';
import SideRenderer from './side-renderer';
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
/**
 * Rendering Engine
 */
export default class SceneRender {
    public state: STATE = STATE.NONE;

    private mainRenderer: RendererInstance | undefined;

    private frontRenderer: (RendererInstance & ThreeViewRenderAddon) | undefined;

    private topRenderer: (RendererInstance & ThreeViewRenderAddon) | undefined;

    private sideRenderer: (RendererInstance & ThreeViewRenderAddon) | undefined;

    private wrappedScene = new Scene();
    // 立体框Group;
    private rectFrameRoot = new Group();

    private PointCloudRoot = new Group();

    private animationId: number | undefined;

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
        this.mainRenderer = new MainRenderer();
        this.frontRenderer = new FrontRenderer();
        this.topRenderer = new TopRenderer();
        this.sideRenderer = new SideRenderer();
        this.mainRenderer.init({ div: mainDiv });
        this.frontRenderer.init({ div: frontDiv });
        this.topRenderer.init({ div: topDiv });
        this.sideRenderer.init({ div: sideDiv });

        this.wrappedScene.add(this.PointCloudRoot);
        this.wrappedScene.add(this.rectFrameRoot);

        this.syncThreeViewZoom();
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
        (this.mainRenderer as RendererInstance).render(this.wrappedScene);
        (this.frontRenderer as RendererInstance).render(this.wrappedScene, zoom);
        (this.topRenderer as RendererInstance).render(this.wrappedScene, zoom);
        (this.sideRenderer as RendererInstance).render(this.wrappedScene, zoom);
    }

    public static disposeGeo(geometry: BufferGeometry): void {
        geometry.dispose();
    }

    public static disposeMesh(itemToRemove: Mesh | Points): void {
        itemToRemove.geometry.dispose();

        if (itemToRemove.material instanceof Array) {
            itemToRemove.material.forEach((v) => v.dispose());
        } else {
            itemToRemove.material.dispose();
        }
    }

    public addPointCloud(points: Points): void {
        this.PointCloudRoot.add(points);
    }

    public removePointCloud(points: Points): void {
        this.PointCloudRoot.remove(points);
    }

    public disposePointCloud(points: Points, needDisposeMaterial = false): void {
        this.PointCloudRoot.remove(points);
        if (needDisposeMaterial) {
            SceneRender.disposeMesh(points);
        } else {
            SceneRender.disposeGeo(points.geometry);
        }
    }

    public addRectFrame(mesh: Mesh): void {
        this.rectFrameRoot.add(mesh);
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
}
