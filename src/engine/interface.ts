import {
    Camera,
    WebGLRenderer,
    WebGL1Renderer,
    Scene,
    Mesh,
    BoxHelper,
    Points,
    ArrowHelper,
    Matrix4,
    Box3,
    Color,
} from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export enum STATE {
    NONE = 0,
    SELECT = 1,
    DRAW_PICK = 2,
    DRAW_DRAG = 3,
}

export enum ThreeViewRendererEvent {
    ObjectSelect = 'objectSelect',
    ObjectRelease = 'objectRelease',
    ObjectChange = 'objectChange',
    MouseMove = 'mouseMove',
}

export enum CURSOR_TYPE {
    NONE = 'none',
    DEFAULT = 'default',
    POINTER = 'pointer',
    CROSS = 'crosshair',
    EWRESIZE = 'ew-resize',
    NSRESIZE = 'ns-resize',
    NESWRESIZE = 'nesw-resize',
    NWSERESIZE = 'nwse-resize',
}

export type RenderInitParams = {
    div: HTMLDivElement;
};

// renderer 和 camera 绑定渲染的类 实现的接口
export interface RendererInstance {
    camera: Camera | undefined;
    renderer: WebGLRenderer | WebGL1Renderer | undefined;
    parent: HTMLDivElement | undefined;
    init(params: RenderInitParams): void;
    render(scene: Scene, zoom?: number): void;
}

export type ThreeViewRenderAddon = {
    getCameraZoom: () => number;
};

export type Vec3 = {
    x: number;
    y: number;
    z: number;
};

export type Vec2 = {
    x: number;
    y: number;
};

export enum CameraType {
    perspective = 'perspective',
    orthographic = 'orthographic',
}

export interface CubeCollection {
    name: string;
    mesh: Mesh;
    meshHelper: BoxHelper;
    points: Points;
    arrow: ArrowHelper;
    matrix: Matrix4;
    box3Origin: Box3;
    color: Color;
    label2D: CSS2DObject;
    id: number;
    pointsNum: number;
}

export enum ObjectLayers {
    default = 0,
    main = 1,
    threeView = 2,
    none = 3,
}
