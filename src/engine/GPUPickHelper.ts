import {
    MeshBasicMaterial,
    LineBasicMaterial,
    PointsMaterial,
    OrthographicCamera,
    PerspectiveCamera,
    Scene,
    Color,
    WebGLRenderer,
    WebGLRenderTarget,
    Mesh,
    BufferGeometry,
    Matrix4,
    LineSegments,
    Points,
    Material,
} from 'three';
import { Vec2 } from './interface';

export const meshMaterialNoId = new MeshBasicMaterial({
    color: new Color(0xff0000),
    transparent: false,
});

export const lineMaterialNoId = new LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 3,
});

export const pointsMaterialNoId = new PointsMaterial({
    color: new Color(0x0000ff),
    size: 8,
});

type InnerMesh = Mesh | LineSegments | Points;

export default class GPUPickHelper {
    private pickingTexture = new WebGLRenderTarget(1, 1);

    private pixelBuffer = new Uint8Array(4);

    private toPickScene = new Scene();

    private currentId = 1;

    public createPickMaterial(color: Color): MeshBasicMaterial {
        return new MeshBasicMaterial({
            color,
            transparent: false,
        });
    }

    public addPickMeshFromGeo(geometry: BufferGeometry, matrix: Matrix4, id?: number): number {
        let idInnner;
        if (!id) {
            idInnner = this.currentId;
            this.currentId++;
        } else {
            idInnner = id;
        }
        const color = GPUPickHelper.turnIdToColor(idInnner);
        const material = this.createPickMaterial(color);
        const mesh = new Mesh(geometry, material);
        mesh.name = `${idInnner}`;
        mesh.matrix.copy(matrix);
        mesh.matrixAutoUpdate = false;
        this.addPickMesh(mesh);
        return idInnner;
    }

    public static turnIdToColor(id: number): Color {
        return new Color().setHex(id);
    }

    public addPickMesh(mesh: InnerMesh): void {
        this.toPickScene.add(mesh);
    }

    public removePickMesh(mesh: InnerMesh): void {
        this.toPickScene.remove(mesh);
    }

    public removePickMeshById(id: number, dispose = false): void {
        const findMesh = this.toPickScene.children.find((item) => item.name === `${id}`) as InnerMesh;
        if (findMesh) {
            this.toPickScene.remove(findMesh);
            if (dispose) (findMesh.material as Material).dispose();
        }
    }

    public updatePickMeshMatrix(id: number, matrix: Matrix4) {
        const findMesh = this.toPickScene.children.find((item) => item.name === `${id}`);
        if (findMesh) {
            findMesh.matrix.copy(matrix);
            findMesh.matrixAutoUpdate = false;
        }
    }

    public updateAllPickMeshMatrix(matrix: Matrix4) {
        this.toPickScene.children.forEach((mesh) => {
            mesh.matrix.copy(matrix);
            mesh.matrixAutoUpdate = false;
        });
    }

    public clearPickMesh(): void {
        this.toPickScene.clear();
        this.currentId = 1;
    }

    public pick(cssPosition: Vec2, camera: OrthographicCamera | PerspectiveCamera, renderer: WebGLRenderer): number {
        const { pickingTexture, pixelBuffer } = this;

        // 设置视野偏移来表现鼠标下的1px
        const pixelRatio = renderer.getPixelRatio();
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth, // 全宽
            renderer.getContext().drawingBufferHeight, // 全高
            (cssPosition.x * pixelRatio) | 0, // rect x
            (cssPosition.y * pixelRatio) | 0, // rect y
            1, // rect width
            1, // rect height
        );
        this.toPickScene.background = new Color(0);
        renderer.setRenderTarget(pickingTexture);
        renderer.render(this.toPickScene, camera);
        renderer.setRenderTarget(null);

        camera.clearViewOffset();

        renderer.readRenderTargetPixels(
            pickingTexture,
            0, // x
            0, // y
            1, // width
            1, // height
            pixelBuffer,
        );

        const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];

        return id;
    }
}
