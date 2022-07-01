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

export enum STATE {
    NONE = 0,
    ROTATE,
    DOLLY,
    PAN,
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

export interface CubeCollection {
    name: string;
    mesh: Mesh;
    meshHelper: BoxHelper;
    points: Points;
    arrow: ArrowHelper;
    matrix: Matrix4;
    box3Origin: Box3;
    color: Color;
}

export enum ObjectLayers {
    default = 0,
    main = 1,
    threeView = 2,
    none = 3,
}
