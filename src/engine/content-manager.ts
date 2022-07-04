import SceneRender from './scene-render';
import MeshFactory from './mesh-factory';
import { MainRendererEvent } from './main-renderer';
import { CubeCollection, ObjectLayers, Vec3 } from './interface';
import { BoxHelper, BufferGeometry, Color, Group, LineBasicMaterial } from 'three';

export default class ContentManager3D {
    // 渲染器
    sceneRender = new SceneRender();

    public isInit = false;
    // 当前帧
    currentFrame = 0;
    // 外圆半径
    circleRadius = 50;
    // 生成carGroup mesh 集合
    cubeCollection: CubeCollection[] = [];
    // active car
    activeCubeCollectionName = '';
    // active color
    activeColor = new Color(1, 1, 0);
    // inactive color
    inActiveColor = new Color(0, 1, 0);

    initScene(params: {
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

    initEvent() {
        this.sceneRender.mainRendererInstance.addEventHandler(MainRendererEvent.ObjectTransform, () => {
            if (this.activeCubeCollectionName) {
                const collection = this.cubeCollection.find((item) => item.name === this.activeCubeCollectionName);
                if (collection) {
                    this.flyToCollection(collection);
                }
            }
        });
    }

    addCubeCollection(params: {
        position: Vec3;
        rotation: Vec3;
        dimension: Vec3;
        name: string;
        active: boolean;
        color?: Color;
        label: string;
    }): void {
        const { position, rotation, dimension, name, active, color, label } = params;
        const result = MeshFactory.creatCubeMesh({
            position,
            rotation,
            dimension,
            name,
            color: color ? color : this.inActiveColor,
            label,
        });
        this.cubeCollection.push(result);
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
        if (active) {
            this.activeCube(name, result);
        }
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
    }

    flyToCollection(collection: CubeCollection) {
        const {
            mesh: { matrixWorld },
            box3Origin,
        } = collection;
        this.sceneRender.flyTo(box3Origin, matrixWorld);
    }

    toggleCubeCollection(collection: CubeCollection, seleted: boolean): void {
        const { mesh, meshHelper, points, color, label2D } = collection;
        const colorI = seleted ? this.activeColor : color;
        meshHelper.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        (meshHelper.material as LineBasicMaterial).color.setHex(colorI.getHex());
        mesh.visible = !seleted;
        label2D.visible = !seleted;
        points.layers.set(seleted ? ObjectLayers.threeView : ObjectLayers.none);
    }

    resize() {
        if (!this.isInit) return;
        this.sceneRender.resize();
    }
}
