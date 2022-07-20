import {
    BufferGeometry,
    Points,
    ShaderMaterial,
    EllipseCurve,
    LineBasicMaterial,
    Line,
    ArrowHelper,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Box3,
    BoxHelper,
    Color,
    PointsMaterial,
    Vector3,
    Matrix4,
    Euler,
    Quaternion,
    Float32BufferAttribute,
    LineDashedMaterial,
    Material,
    LineSegments,
} from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import createPointColorMapMaterial, { PointShaderDataGroup } from './materials/PointColorMapMaterial';
import TextureFactory from './texture-factory';
import { Vec3, CubeCollection, ObjectLayers, MaxAndMin } from './interface';

const boxPointMaterial = new PointsMaterial({ color: 0xff0000, size: 8 });

export default class MeshFactory {
    public static createPointsGeo(
        points: Float32Array,
        intensity: Float32Array,
        range: {
            x: MaxAndMin;
            y: MaxAndMin;
            z: MaxAndMin;
            intensity: MaxAndMin;
        },
    ): BufferGeometry {
        const geo = new BufferGeometry();
        geo.setAttribute('position', new Float32BufferAttribute(points, 3));
        if (intensity.length) geo.setAttribute('intensity', new Float32BufferAttribute(intensity, 1));
        geo.userData.intensity = {
            has: !!intensity.length,
            max: range.intensity.max,
            min: range.intensity.min,
        };
        geo.boundingBox = new Box3(
            new Vector3(range.x.min, range.y.min, range.z.min),
            new Vector3(range.x.max, range.y.max, range.z.max),
        );
        return geo;
    }

    public static createPointsCloud(geometry: BufferGeometry, material: ShaderMaterial): Points {
        return new Points(geometry, material);
    }

    public static createPointMaterial(
        geometry: BufferGeometry,
        opt: { group: PointShaderDataGroup } = { group: PointShaderDataGroup.z },
    ): ShaderMaterial {
        const texture = TextureFactory.fromLut();
        const boundingBox = geometry.boundingBox;
        const zmax = boundingBox?.max.z as number;
        const zmin = boundingBox?.min.z as number;
        return createPointColorMapMaterial({
            size: 1,
            dataOffset: -zmin,
            dataRadio: 1 / (zmax - zmin),
            dataGroup: opt.group,
            dataTexture: texture,
        });
    }

    public static createCircleLimit(radius = 50) {
        const curve = new EllipseCurve(
            0,
            0,
            radius,
            radius, // xRadius, yRadius
            0,
            2 * Math.PI, // aStartAngle, aEndAngle
            false, // aClockwise
            0, // aRotation
        );

        const points = curve.getPoints(50);
        const geometry = new BufferGeometry().setFromPoints(points);

        const material = new LineBasicMaterial({ color: 0xff0000 });

        const line = new Line(geometry, material);

        const label2D = MeshFactory.createLabel(radius.toString() + 'm', 'spo-3d-main-circle-label');
        label2D.position.set(0, radius, 0);
        line.add(label2D);
        return line;
    }

    public static creatCubeMesh(cubeParams: {
        position: Vec3;
        rotation: Vec3;
        dimension: Vec3;
        name: string;
        color: Color;
        label: string;
        dash: boolean;
    }): Pick<CubeCollection, Exclude<keyof CubeCollection, 'id' | 'pointsNum'>> {
        const { position, rotation, dimension, name, color, label, dash } = cubeParams;
        const geometry = new BoxGeometry(dimension.x, dimension.y, dimension.z);
        const material = new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
        });
        const mesh = new Mesh(geometry, material);
        const label2D = MeshFactory.createLabel(label, 'spo-3d-main-cube-label', color);
        mesh.add(label2D);
        //origin data
        const box3Origin = new Box3();
        box3Origin.setFromObject(mesh);
        //matrix4
        const matrix = new Matrix4();
        const trans = new Vector3(position.x, position.y, position.z);
        const euler = new Euler(rotation.x, rotation.y, rotation.z);
        const quaternion = new Quaternion().setFromEuler(euler);
        const scale = new Vector3(1, 1, 1);
        matrix.compose(trans, quaternion, scale);
        // line
        let helperTempUse: BoxHelper | null = new BoxHelper(mesh, 0x0000000);
        const { geometry: geoHelperTempUse, material: materialLineBase } = helperTempUse;
        const geoHelper = geoHelperTempUse.toNonIndexed();
        helperTempUse = null;
        geoHelperTempUse.dispose();
        (materialLineBase as Material).dispose();
        const helper = new LineSegments(
            geoHelper,
            new LineDashedMaterial({ color: color.getHex(), dashSize: 0.2, gapSize: dash ? 0.2 : 0 }),
        );
        helper.computeLineDistances();
        // 8 - points
        const geometryBox = helper.geometry;
        const points = new Points(geometryBox, boxPointMaterial);
        // arrow
        const dir = new Vector3(0, 1, 0);
        const origin = new Vector3(0, 0, 0);
        const arrow = new ArrowHelper(dir, origin, dimension.y / 4, 0xffff00, 0.2, 0.22);
        mesh.layers.set(ObjectLayers.main);
        arrow.line.layers.set(ObjectLayers.main);
        arrow.cone.layers.set(ObjectLayers.main);
        label2D.layers.set(ObjectLayers.main);
        helper.layers.set(ObjectLayers.main);
        points.layers.set(ObjectLayers.none);

        return {
            name: name,
            mesh,
            meshHelper: helper,
            points,
            arrow,
            matrix,
            box3Origin,
            color,
            label2D,
            dash,
        };
    }

    public static createLabel(string: string, className: string, color?: Color): CSS2DObject {
        const divEle = document.createElement('div');
        const label2d = new CSS2DObject(divEle);
        divEle.className = className;
        divEle.textContent = string;
        if (color) divEle.style.background = `linear-gradient(90deg, ${color.getStyle()} 0%, rgba(0, 0, 0, 0) 100%)`;
        return label2d;
    }

    public static disposeGeo(geometry: BufferGeometry): void {
        geometry.dispose();
    }

    public static disposeMesh(itemToRemove: Mesh | Points | Line): void {
        itemToRemove.geometry.dispose();

        if (Array.isArray(itemToRemove.material)) {
            itemToRemove.material.forEach((v) => v.dispose());
        } else {
            itemToRemove.material.dispose();
        }
    }
}
