import {
    BufferGeometry,
    Color,
    Group,
    LineDashedMaterial,
    Mesh,
    PerspectiveCamera,
    Points,
    WebGLRenderer,
    LineSegments,
    OrthographicCamera,
    Vector3,
    Quaternion,
    ShaderMaterial,
} from 'three';
import SceneRender from './scene-render';
import MeshFactory from './mesh-factory';
import GPUPickHelper, { lineMaterialNoId, meshMaterialNoId, pointsMaterialNoId } from './GPUPickHelper';
import { PointShaderDataGroup } from './materials/PointColorMapMaterial';
import { MainRendererEvent } from './main-renderer';
import { getCanvasCssPosition, getNormalizedPosition, getDecomposedDataFrom3d, containPointsNum } from './untils';
import {
    CubeCollection,
    ObjectLayers,
    Vec3,
    ThreeViewRendererEvent,
    CURSOR_TYPE,
    STATE,
    PointsData,
} from './interface';
import { v4 as uuidv4 } from 'uuid';
import throttle from 'lodash/throttle';

export class ContentManager3D {
    // 渲染器
    private sceneRender = new SceneRender();
    // 是否编辑
    public enableEdit = true;

    public isInit = false;

    // 外圆半径
    private circleRadius = [50];
    // 外圆 或地面高
    private baseZ = 0;
    // 生成cubGroup mesh 集合
    private cubeCollection: CubeCollection[] = [];
    // active car
    private activeCubeCollection: CubeCollection | null = null;
    // active color
    private activeColor = new Color(1, 1, 0);
    // inactive color
    private inActiveColor = new Color(0, 1, 0);
    // main canvas gpu pick
    private mainPicker = new GPUPickHelper();
    // three view canvas gpu pick
    private threeViewPicker = new GPUPickHelper();
    // first pick position for mouse event
    private pickPosition = new Vector3();

    private pointsCloud!: Points;

    public defaultCubeInfo = {
        rotation: { x: 0, y: 0, z: 0 },
        dimension: { x: 3, y: 5, z: 1 },
        color: this.inActiveColor,
        label: '小汽车',
        dash: false,
    };

    private minDimension = 0.3;

    public initScene(params: {
        mainDiv: HTMLDivElement;
        topDiv: HTMLDivElement;
        frontDiv: HTMLDivElement;
        sideDiv: HTMLDivElement;
        circleRadius?: number[];
        pointCloud?: BufferGeometry;
        baseZ?: number;
    }): void {
        if (this.isInit) return;
        this.isInit = true;
        const { mainDiv, topDiv, frontDiv, sideDiv, circleRadius, pointCloud, baseZ } = params;
        this.sceneRender.init({ mainDiv, topDiv, frontDiv, sideDiv });
        this.initEvent();
        this.circleRadius = circleRadius ? circleRadius : this.circleRadius;
        const baseZInner = baseZ || this.baseZ;
        const vec3 = new Vector3(0, 0, baseZInner || 1);
        this.sceneRender.setBasePlane(vec3, Math.abs(baseZInner));
        this.circleRadius.forEach((r) => {
            const limit = MeshFactory.createCircleLimit(r);
            limit.position.set(0, 0, baseZInner);
            this.sceneRender.addCircle(limit);
        });
        if (pointCloud) {
            const pointMaterial = MeshFactory.createPointMaterial(pointCloud);
            const points = MeshFactory.createPointsCloud(pointCloud, pointMaterial);
            this.pointsCloud = points;
            this.sceneRender.addPointCloud(points);
        }

        this.sceneRender.beforeRenderFunction = this.changeActiveCube.bind(this);
        if (this.pointsCloud) this.sceneRender.requestRenderIfNotRequested();
    }

    get sceneRenderInstance() {
        return this.sceneRender;
    }

    get cubeCollections() {
        return this.cubeCollection;
    }

    private initEvent() {
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
        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.ObjectTransform,
            throttle(() => {
                this.sceneRender.requestRenderIfNotRequested();
            }, 34),
        );
        this.sceneRender.mainRendererInstance.addEventHandler(MainRendererEvent.MeshDelete, () => {
            if (!this.activeCubeCollection || !this.enableEdit) return;
            this.deleteActiveCube();
        });
        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.MeshCreateClickStart,
            (event, camera, renderer) => {
                if (this.activeCubeCollection) {
                    this.inActiveCube();
                }
                this.sceneRender.mainRendererInstance.changeCursorType(CURSOR_TYPE.CROSS);
                const posNorm = getNormalizedPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                const pos = this.sceneRender.testPlanPosition(posNorm, camera as PerspectiveCamera);
                this.pickPosition.copy(pos);
                pos.z = pos.z + this.defaultCubeInfo.dimension.z / 2;
                this.addCubeCollection(
                    {
                        position: pos,
                        name: uuidv4() as string,
                        pointsNum: undefined,
                        ...this.defaultCubeInfo,
                    },
                    true,
                );
            },
        );

        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.MeshCreateClickMove,
            (event, camera, renderer) => {
                if (!this.activeCubeCollection) return;
                const posNorm = getNormalizedPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                const pos = this.sceneRender.testPlanPosition(posNorm, camera as PerspectiveCamera);
                const axis = new Vector3(0, 1, 0);
                let angleY = pos.sub(this.pickPosition).angleTo(axis);
                const dir = new Vector3().crossVectors(pos, axis);
                angleY = dir.z <= 0 ? angleY : 2 * Math.PI - angleY;
                const { group } = this.activeCubeCollection;
                const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angleY);
                group?.quaternion.copy(quaternion);
                this.sceneRender.requestRenderIfNotRequested();
            },
        );

        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.MeshCreateDragStart,
            (event, camera, renderer) => {
                if (this.activeCubeCollection) {
                    this.inActiveCube();
                }
                const posNorm = getNormalizedPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                const pos = this.sceneRender.testPlanPosition(posNorm, camera as PerspectiveCamera);
                this.pickPosition.copy(pos);
            },
        );

        this.sceneRender.mainRendererInstance.addEventHandler(
            MainRendererEvent.MeshCreateDrag,
            (event, camera, renderer) => {
                const posNorm = getNormalizedPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                const pos = this.sceneRender.testPlanPosition(posNorm, camera as PerspectiveCamera);
                const dir = new Vector3().subVectors(pos, this.pickPosition).multiplyScalar(4).round().divideScalar(4);
                const dimension = {
                    x: Math.abs(dir.x),
                    y: Math.abs(dir.y),
                    z: this.defaultCubeInfo.dimension.z,
                };
                const position = this.pickPosition.clone().add(dir.divideScalar(2));
                if (
                    !this.activeCubeCollection &&
                    (dimension.x < this.minDimension || dimension.y < this.minDimension)
                ) {
                    return;
                } else if (!this.activeCubeCollection) {
                    this.addCubeCollection(
                        {
                            position: {
                                x: position.x,
                                y: position.y,
                                z: position.z + this.defaultCubeInfo.dimension.z / 2,
                            },
                            dimension,
                            rotation: { x: 0, y: 0, z: 0 },
                            name: uuidv4() as string,
                            label: this.defaultCubeInfo.label,
                            color: this.defaultCubeInfo.color,
                            dash: false,
                            pointsNum: undefined,
                        },
                        true,
                    );
                } else {
                    const collection = this.activeCubeCollection;
                    const { group } = this.activeCubeCollection;
                    if (group && collection) {
                        const { box3Origin } = collection;
                        const scale = {
                            x: dimension.x / (box3Origin.max.x * 2),
                            y: dimension.y / (box3Origin.max.y * 2),
                        };
                        group.position.set(position.x, position.y, position.z);
                        group.scale.set(scale.x, scale.y, 1);
                    }
                    this.sceneRender.requestRenderIfNotRequested();
                }
            },
        );

        // this.sceneRender.topRendererInstance.addEventHandler(
        //     ThreeViewRendererEvent.ObjectSelect,
        //     (event, camera, renderer) => {
        //         if (!this.activeCubeCollection) return;
        //         console.log('1');
        //     },
        // );
        this.sceneRender.topRendererInstance.addEventHandler(
            ThreeViewRendererEvent.MouseMove,
            (event, camera, renderer) => {
                if (!this.activeCubeCollection) return;
                const cssPosition = getCanvasCssPosition(event as PointerEvent, (renderer as WebGLRenderer).domElement);
                // pick demo
                const id = this.threeViewPicker.pick(
                    cssPosition,
                    camera as OrthographicCamera,
                    renderer as WebGLRenderer,
                );
                // this.sceneRender.topRendererInstance.render(this.threeViewPicker.toPickScene, 1);
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
        //         if (!this.activeCubeCollection) return;
        //         console.log('3');
        //     },
        // );
        // this.sceneRender.topRendererInstance.addEventHandler(
        //     ThreeViewRendererEvent.ObjectChange,
        //     (event, camera, renderer) => {
        //         if (!this.activeCubeCollection) return;
        //         console.log('4');
        //     },
        // );
    }

    private removeEvent() {
        //
    }

    public setCircleRadius(arr: number[]) {
        this.circleRadius = arr;
    }

    addCubeCollection(
        params: {
            position: Vec3;
            rotation: Vec3;
            dimension: Vec3;
            name: string; // 唯一 标识
            color?: Color;
            label: string;
            dash: boolean;
            pointsNum: number | undefined;
        },
        active = false,
    ): void {
        const { position, rotation, dimension, name, color, label, dash } = params;
        let { pointsNum } = params;
        const result = MeshFactory.creatCubeMesh({
            position,
            rotation,
            dimension,
            name,
            color: color ? color : this.inActiveColor,
            dash,
        });
        const { mesh, meshHelper, arrow, name: nameI, matrix, points, box3Origin } = result;
        if (typeof pointsNum === 'undefined') {
            pointsNum = containPointsNum(box3Origin, matrix, this.pointsCloud);
        }
        const label2D = MeshFactory.createLabel(`${label} ${pointsNum}`, 'spo-3d-main-cube-label', color);
        mesh.add(label2D);
        const group = new Group();
        group.name = nameI;
        group.add(mesh);
        group.add(meshHelper);
        group.add(arrow);
        group.add(points);
        group.position.setFromMatrixPosition(matrix);
        group.rotation.setFromRotationMatrix(matrix);
        if (dash) {
            label2D.visible = false;
            group.visible = false;
        }
        this.sceneRender.addCube(group);
        // for pick
        const { geometry } = mesh;
        const id = this.mainPicker.addPickMeshFromGeo(geometry, matrix);

        this.cubeCollection.push(Object.assign(result, { id, pointsNum, label2D, group, labelOrigin: label }));

        if (active) {
            this.activeCube(name, result as CubeCollection);
        }
    }

    disposeCubeCollection(name: string) {
        const index = this.cubeCollection.findIndex((item) => item.name === name);
        if (index !== -1) {
            const collection = this.cubeCollection[index];
            const { mesh, meshHelper, arrow, points, id, label2D } = collection;
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

    deleteCubeCollection(cubeCollection: CubeCollection) {
        const { group, label2D, id } = cubeCollection;
        group.visible = false;
        label2D.visible = false;
        this.mainPicker.togglePickMeshVisible(id, false);
    }

    changeMainRenderState(state: STATE): void {
        if (this.enableEdit) this.sceneRender.mainRendererInstance.changeState(state);
    }

    deleteActiveCube() {
        const cubeCollection = this.activeCubeCollection;
        if (cubeCollection) {
            this.inActiveCube();
            this.deleteCubeCollection(cubeCollection);
        }
    }

    updatePointCloud(data: PointsData) {
        const pointGeo = MeshFactory.createPointsGeo(data);
        const pointMaterial = MeshFactory.createPointMaterial(pointGeo);
        const points = MeshFactory.createPointsCloud(pointGeo, pointMaterial);
        const lastPoints = this.pointsCloud;
        this.sceneRender.removePointCloud(this.pointsCloud);
        this.pointsCloud = points;
        this.sceneRender.addPointCloud(points);
        this.sceneRender.requestRenderIfNotRequested();
        if (lastPoints) {
            MeshFactory.disposeMesh(lastPoints);
        }
    }

    activeCube(name: string, collectionParam?: CubeCollection): void {
        if (this.activeCubeCollection && this.activeCubeCollection.name === name) return;
        if (this.activeCubeCollection) {
            this.inActiveCube();
        }
        const collection = collectionParam ? collectionParam : this.cubeCollection.find((item) => item.name === name);
        if (!collection) return;
        this.activeCubeCollection = collection;
        const { group } = collection;
        if (group && this.enableEdit) {
            this.sceneRender.bindActiveCube(true, group);
        }

        this.toggleCubeCollection(collection, true);
        this.toggleActiveThreeViewPickerMesh(collection, true);
        this.sceneRender.requestRenderIfNotRequested();
    }

    inActiveCube() {
        const collection = this.activeCubeCollection;
        this.activeCubeCollection = null;
        if (!collection) return;
        const { group } = collection;
        if (group) {
            this.sceneRender.bindActiveCube(false, group);
        }
        this.toggleCubeCollection(collection, false);
        this.toggleActiveThreeViewPickerMesh(collection, false);
        this.sceneRender.requestRenderIfNotRequested();
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
        if (!this.activeCubeCollection) return;
        const collection = this.activeCubeCollection;
        const { group } = collection;
        if (collection && group) {
            const { matrix, box3Origin, label2D, labelOrigin } = collection;
            matrix.copy(group.matrix);
            this.flyToCollection(collection);
            this.mainPicker.updatePickMeshMatrix(collection.id, matrix);
            this.threeViewPicker.updateAllPickMeshMatrix(matrix);
            collection.pointsNum = containPointsNum(box3Origin, matrix, this.pointsCloud);
            label2D.element.textContent = `${labelOrigin} ${collection.pointsNum}`;
        }
    }

    flyToCollection(collection: CubeCollection) {
        const { matrix, box3Origin } = collection;
        this.sceneRender.flyTo(box3Origin, matrix);
    }

    toggleCubeCollection(collection: CubeCollection, seleted: boolean): void {
        const { mesh, meshHelper, points, color, arrow, dash, label2D } = collection;
        const colorI = seleted ? this.activeColor : color;
        meshHelper.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        (meshHelper.material as LineDashedMaterial).color.setHex(colorI.getHex());
        (meshHelper.material as LineDashedMaterial).gapSize = dash ? 0.2 : 0;

        // 显示箭头
        arrow.line.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);
        arrow.cone.layers.set(seleted ? ObjectLayers.default : ObjectLayers.main);

        mesh.visible = !seleted;
        label2D.visible = !seleted;
        points.layers.set(seleted ? ObjectLayers.threeView : ObjectLayers.none);
    }

    public switchPointCloudColorType(type: PointShaderDataGroup): void {
        const { material, geometry } = this.pointsCloud;
        if (!Array.isArray(material)) {
            if ((material as ShaderMaterial).uniforms.dataGroup.value === type) return;
            if (type === PointShaderDataGroup.z) {
                if (!geometry.boundingBox) geometry.computeBoundingBox();
                const boundingBox = geometry.boundingBox;
                const zmax = boundingBox?.max.z as number;
                const zmin = boundingBox?.min.z as number;
                (material as ShaderMaterial).uniforms.dataGroup.value = type;
                (material as ShaderMaterial).uniforms.dataOffset.value = -zmin;
                (material as ShaderMaterial).uniforms.dataRadio.value = 1 / (zmax - zmin);
            } else if (type === PointShaderDataGroup.intensity) {
                const range = geometry.userData.intensity;
                if (!range?.has) return;
                const max = range?.max as number;
                const min = range?.min as number;
                (material as ShaderMaterial).uniforms.dataGroup.value = type;
                (material as ShaderMaterial).uniforms.dataOffset.value = -min;
                (material as ShaderMaterial).uniforms.dataRadio.value = 1 / (max - min);
            }
            material.needsUpdate = true;
        }
    }

    public diffCubeCollections(
        arr: {
            position: Vec3;
            rotation: Vec3;
            dimension: Vec3;
            pointsNum: number | undefined;
            id: string;
        }[],
    ): void {
        this.cubeCollection.forEach((collection) => {
            const toUpdataData = arr.find((item) => item.id === collection.name);
            if (toUpdataData) {
                const { position, rotation, dimension, pointsNum } = toUpdataData;
                this.updataCubeCollection(collection, position, rotation, dimension, pointsNum || 0);
            } else {
                if (this.activeCubeCollection && collection.name === this.activeCubeCollection.name) {
                    this.inActiveCube();
                }
                collection.group.visible = false;
                collection.label2D.visible = false;
                collection.dash = true;
            }
            this.mainPicker.togglePickMeshVisible(collection.id, !!toUpdataData);
        });
    }

    public updataCubeCollection(
        collection: CubeCollection,
        position: Vec3,
        rotation: Vec3,
        dimension: Vec3,
        pointsNum: number,
    ) {
        const { box3Origin, group, matrix, label2D, labelOrigin } = collection;
        const scaleX = dimension.x / box3Origin.max.x;
        const scaleY = dimension.y / box3Origin.max.y;
        const scaleZ = dimension.z / box3Origin.max.z;
        group.scale.set(scaleX, scaleY, scaleZ);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        group.position.set(position.x, position.y, position.z);
        group.updateMatrix();
        matrix.copy(group.matrix);
        label2D.element.textContent = `${labelOrigin} ${pointsNum}`;
        label2D.visible = true;
        group.visible = true;
        collection.dash = false;
        this.mainPicker.updatePickMeshMatrix(collection.id, matrix);
    }

    public getVisibleCubeCollectionData() {
        const map: { [k: string]: { name: string; dimension: Vec3; rotation: Vec3; position: Vec3 } } = {};
        this.cubeCollections.forEach((collection) => {
            if (collection.group.visible) {
                const { name, group, box3Origin } = collection;
                const data = getDecomposedDataFrom3d(box3Origin, group);
                map.name = Object.assign(data, { name });
            }
        });
        return map;
    }

    public resize(): void {
        if (!this.isInit) return;
        this.sceneRender.resize();
    }

    public destroy(): void {
        // todo destroy mesh
        this.sceneRender.destroy();
    }
}

export default new ContentManager3D();
