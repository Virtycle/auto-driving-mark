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
} from 'three';
import createPointColorMapMaterial, { PointShaderDataGroup } from './materials/PointColorMapMaterial';
import TextureFactory from './texture-factory';
import { Vec3, CubeCollection, ObjectLayers } from './interface';

const boxPointMaterial = new PointsMaterial({ color: 0xff0000, size: 8 });

export default class MeshCreater {
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

        return new Line(geometry, material);
    }

    public static creatCubeMesh(cubeParams: {
        position: Vec3;
        rotation: Vec3;
        dimension: Vec3;
        name: string;
        color: Color;
    }): CubeCollection {
        const { position, rotation, dimension, name, color } = cubeParams;
        const geometry = new BoxGeometry(dimension.x, dimension.y, dimension.z);
        const material = new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
        });
        const mesh = new Mesh(geometry, material);
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
        const helper = new BoxHelper(mesh, color.getHex());
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
        };
    }
}
