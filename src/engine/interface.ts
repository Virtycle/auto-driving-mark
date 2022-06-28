import { Camera, WebGLRenderer, WebGL1Renderer, Scene } from 'three';

export enum STATE {
    NONE = 0,
    ROTATE,
    DOLLY,
    PAN,
}

export type RenderInitParams = {
    div: HTMLDivElement;
    // context: WebGLRenderingContext;
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
