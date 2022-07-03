import SceneRender from './scene-render';
import MeshCreater from './mesh-creater';
import { CubeCollection, ObjectLayers, Vec3 } from './interface';
import { BoxHelper, BufferGeometry, Color, Group, LineBasicMaterial } from 'three';

export default class ContentManager3D {
    // 渲染器
    sceneRender = new SceneRender();
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
        const { mainDiv, topDiv, frontDiv, sideDiv, circleRadius, pointCloud } = params;
        this.sceneRender.init({ mainDiv, topDiv, frontDiv, sideDiv });
        this.circleRadius = circleRadius ? circleRadius : this.circleRadius;
        const limit = MeshCreater.createCircleLimit(this.circleRadius);
        const pointMaterial = MeshCreater.createPointMaterial(pointCloud);
        const points = MeshCreater.createPointsCloud(pointCloud, pointMaterial);
        this.sceneRender.addPointCloud(points);
        this.sceneRender.addCircle(limit);
        this.sceneRender.startAnimate();
    }

    addCubeCollection(params: {
        position: Vec3;
        rotation: Vec3;
        dimension: Vec3;
        name: string;
        active: boolean;
        color?: Color;
    }): void {
        const { position, rotation, dimension, name, active, color } = params;
        const result = MeshCreater.creatCubeMesh({
            position,
            rotation,
            dimension,
            name,
            color: color ? color : this.inActiveColor,
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

        this.sceneRender.addCarCube(group);
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
        const group = this.sceneRender.findCarCube(name);
        if (group) {
            this.sceneRender.bindActiveCarCube(true, group);
        }
        this.toggleCubeCollection(collection, true);
        this.flyToCollection(collection);
    }

    inActiveCube() {
        const name = this.activeCubeCollectionName;
        this.activeCubeCollectionName = '';
        const collection = this.cubeCollection.find((item) => item.name === name);
        if (!collection) return;
        const group = this.sceneRender.findCarCube(name);
        if (group) {
            this.sceneRender.bindActiveCarCube(false, group);
        }
        this.toggleCubeCollection(collection, false);
    }

    flyToCollection(collection: CubeCollection) {
        this.sceneRender.flyTo(collection.box3Origin, collection.matrix);
    }

    toggleCubeCollection(collection: CubeCollection, seleted: boolean): void {
        const { mesh, meshHelper, points, color } = collection;
        const colorI = seleted ? this.activeColor : color;
        meshHelper.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        (meshHelper.material as LineBasicMaterial).color.setHex(colorI.getHex());
        mesh.visible = !seleted;
        points.layers.set(seleted ? ObjectLayers.threeView : ObjectLayers.none);
    }

    resize() {
        this.sceneRender.resize();
    }
}
