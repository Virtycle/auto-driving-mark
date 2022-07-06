import {
    BufferGeometry,
    Color,
    Group,
    LineBasicMaterial,
    Mesh,
    PerspectiveCamera,
    Points,
    WebGLRenderer,
    LineSegments,
    OrthographicCamera,
} from 'three';
import SceneRender from './scene-render';
import MeshFactory from './mesh-factory';
import GPUPickHelper, { lineMaterialNoId, meshMaterialNoId, pointsMaterialNoId } from './GPUPickHelper';
import { MainRendererEvent } from './main-renderer';
import { getCanvasCssPosition } from './untils';
import { CubeCollection, ObjectLayers, Vec3, ThreeViewRendererEvent, CURSOR_TYPE } from './interface';

export default class ContentManager3D {
    // 渲染器
    private sceneRender = new SceneRender();

    public isInit = false;
    // 当前帧
    private currentFrame = 0;
    // 外圆半径
    private circleRadius = 50;
    // 生成cubGroup mesh 集合
    private cubeCollection: CubeCollection[] = [];
    // active car
    private activeCubeCollectionName = '';
    // active color
    private activeColor = new Color(1, 1, 0);
    // inactive color
    private inActiveColor = new Color(0, 1, 0);
    // main canvas gpu pick
    private mainPicker = new GPUPickHelper();
    // three view canvas gpu pick
    private threeViewPicker = new GPUPickHelper();

    public initScene(params: {
        mainDiv: HTMLDivElement;
        topDiv: HTMLDivElement;
        frontDiv: HTMLDivElement;
        sideDiv: HTMLDivElement;
        circleRadius?: number;
        pointCloud: BufferGeometry;
    }): void {
        if (this.isInit) return;
        const { mainDiv, topDiv, frontDiv, sideDiv, circleRadius, pointCloud } = params;
        this.sceneRender.init({ mainDiv, topDiv, frontDiv, sideDiv });
        this.initEvent();
        this.isInit = true;
        this.circleRadius = circleRadius ? circleRadius : this.circleRadius;
        const limit = MeshFactory.createCircleLimit(this.circleRadius);
        const pointMaterial = MeshFactory.createPointMaterial(pointCloud);
        const points = MeshFactory.createPointsCloud(pointCloud, pointMaterial);
        this.sceneRender.addPointCloud(points);
        this.sceneRender.addCircle(limit);
        this.sceneRender.startAnimate();
    }

    private initEvent() {
        this.sceneRender.mainRendererInstance.addEventHandler(MainRendererEvent.ObjectTransform, () => {
            this.changeActiveCube();
        });
        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.MeshSelect,
            (event, camera, renderer) => {
                const cssPosition = getCanvasCssPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                const id = this.mainPicker.pick(cssPosition, camera as PerspectiveCamera, renderer as WebGLRenderer);
                const collection = this.cubeCollection.find((item) => item.id === id);
                if (collection) {
                    this.activeCube(collection.name, collection);
                } else {
                    this.inActiveCube();
                }
            },
        );
        // this.sceneRender.topRendererInstance.addEventHandler(
        //     ThreeViewRendererEvent.ObjectSelect,
        //     (event, camera, renderer) => {
        //         if (!this.activeCubeCollectionName) return;
        //         console.log('1');
        //     },
        // );
        this.sceneRender.topRendererInstance.addEventHandler(
            ThreeViewRendererEvent.MouseMove,
            (event, camera, renderer) => {
                if (!this.activeCubeCollectionName) return;
                const cssPosition = getCanvasCssPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                // pick demo
                const id = this.threeViewPicker.pick(
                    cssPosition,
                    camera as OrthographicCamera,
                    renderer as WebGLRenderer,
                );
                if (id === 255 << 16) {
                    console.log('mesh');
                } else if (id === 255 << 8) {
                    console.log('line');
                } else if (id === 255) {
                    console.log('points');
                }
            },
        );
        // this.sceneRender.topRendererInstance.addEventHandler(
        //     ThreeViewRendererEvent.ObjectRelease,
        //     (event, camera, renderer) => {
        //         if (!this.activeCubeCollectionName) return;
        //         console.log('3');
        //     },
        // );
        // this.sceneRender.topRendererInstance.addEventHandler(
        //     ThreeViewRendererEvent.ObjectChange,
        //     (event, camera, renderer) => {
        //         if (!this.activeCubeCollectionName) return;
        //         console.log('4');
        //     },
        // );
    }

    private removeEvent() {
        //
    }

    addCubeCollection(params: {
        position: Vec3;
        rotation: Vec3;
        dimension: Vec3;
        name: string; // 唯一 标识
        active: boolean;
        color?: Color;
        label: string;
        id: number; // 唯一 gpu pick
    }): void {
        const { position, rotation, dimension, name, active, color, label, id } = params;
        const result = MeshFactory.creatCubeMesh({
            position,
            rotation,
            dimension,
            name,
            color: color ? color : this.inActiveColor,
            label,
        });
        this.cubeCollection.push(Object.assign(result, { id }));
        const { mesh, meshHelper, arrow, name: nameI, matrix, points } = result;
        const group = new Group();
        group.name = nameI;
        group.add(mesh);
        group.add(meshHelper);
        group.add(arrow);
        group.add(points);
        group.position.setFromMatrixPosition(matrix);
        group.rotation.setFromRotationMatrix(matrix);

        this.sceneRender.addCube(group);
        // for pick
        const { geometry } = mesh;
        this.mainPicker.addPickMeshFromGeo(geometry, matrix, id);

        if (active) {
            this.activeCube(name, result as CubeCollection);
        }
    }

    deleteCubeCollection(name: string) {
        const index = this.cubeCollection.findIndex((item) => item.name === name);
        if (index !== -1) {
            const collection = this.cubeCollection[index];
            const { mesh, meshHelper, arrow, points, label2D, id } = collection;
            this.sceneRender.removeCubeByName(name);
            this.mainPicker.removePickMeshById(id, true);
            this.cubeCollection.splice(index, 1);
            mesh.remove(label2D);
            MeshFactory.disposeMesh(mesh);
            MeshFactory.disposeMesh(meshHelper);
            MeshFactory.disposeMesh(points);
            MeshFactory.disposeMesh(arrow.cone);
            MeshFactory.disposeMesh(arrow.line);
        }
    }

    deleteActiveCube() {
        const name = this.activeCubeCollectionName;
        this.inActiveCube();
        this.deleteCubeCollection(name);
    }

    activeCube(name: string, collectionParam?: CubeCollection): void {
        if (this.activeCubeCollectionName === name) return;
        if (this.activeCubeCollectionName) {
            this.inActiveCube();
        }
        this.activeCubeCollectionName = name;
        const collection = collectionParam ? collectionParam : this.cubeCollection.find((item) => item.name === name);
        if (!collection) return;
        const group = this.sceneRender.findCube(name);
        if (group) {
            this.sceneRender.bindActiveCube(true, group);
        }

        this.toggleCubeCollection(collection, true);
        this.flyToCollection(collection);
        this.toggleActiveThreeViewPickerMesh(collection, true);
    }

    inActiveCube() {
        const name = this.activeCubeCollectionName;
        this.activeCubeCollectionName = '';
        const collection = this.cubeCollection.find((item) => item.name === name);
        if (!collection) return;
        const group = this.sceneRender.findCube(name);
        if (group) {
            this.sceneRender.bindActiveCube(false, group);
        }
        this.toggleCubeCollection(collection, false);
        this.toggleActiveThreeViewPickerMesh(collection, false);
    }

    private toggleActiveThreeViewPickerMesh(collection: CubeCollection, bool: boolean): void {
        if (!bool) {
            this.threeViewPicker.clearPickMesh();
        } else {
            const { meshHelper, mesh, matrix } = collection;
            const geoM = mesh.geometry;
            const geoL = meshHelper.geometry;

            const meshM = new Mesh(geoM, meshMaterialNoId);
            const meshL = new LineSegments(geoL, lineMaterialNoId);
            const meshP = new Points(geoL, pointsMaterialNoId);
            meshM.matrix.copy(matrix);
            meshM.matrixAutoUpdate = false;
            meshL.matrix.copy(matrix);
            meshL.matrixAutoUpdate = false;
            meshP.matrix.copy(matrix);
            meshP.matrixAutoUpdate = false;
            this.threeViewPicker.addPickMesh(meshM);
            this.threeViewPicker.addPickMesh(meshL);
            this.threeViewPicker.addPickMesh(meshP);
        }
    }

    changeActiveCube() {
        if (!this.activeCubeCollectionName) return;
        const collection = this.cubeCollection.find((item) => item.name === this.activeCubeCollectionName);
        const group = this.sceneRender.findCube(this.activeCubeCollectionName);
        if (collection && group) {
            const { matrix } = collection;
            this.flyToCollection(collection);
            this.mainPicker.updatePickMeshMatrix(collection.id, group.matrix);
            this.threeViewPicker.updateAllPickMeshMatrix(group.matrix);
            matrix.copy(group.matrix);
        }
    }

    flyToCollection(collection: CubeCollection) {
        const {
            mesh: { matrixWorld },
            box3Origin,
        } = collection;
        this.sceneRender.flyTo(box3Origin, matrixWorld);
    }

    toggleCubeCollection(collection: CubeCollection, seleted: boolean): void {
        const { mesh, meshHelper, points, color, label2D, arrow } = collection;
        const colorI = seleted ? this.activeColor : color;
        meshHelper.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        (meshHelper.material as LineBasicMaterial).color.setHex(colorI.getHex());
        // 显示箭头
        arrow.line.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        arrow.cone.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);

        mesh.visible = !seleted;
        label2D.visible = !seleted;
        points.layers.set(seleted ? ObjectLayers.threeView : ObjectLayers.none);
    }

    resize() {
        if (!this.isInit) return;
        this.sceneRender.resize();
    }

    public destroy(): void {
        this.sceneRender.stopAnimate();
    }
}
