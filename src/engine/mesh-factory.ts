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
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import createPointColorMapMaterial, { PointShaderDataGroup } from './materials/PointColorMapMaterial';
import TextureFactory from './texture-factory';
import { Vec3, CubeCollection, ObjectLayers } from './interface';

const boxPointMaterial = new PointsMaterial({ color: 0xff0000, size: 8 });

export default class MeshFactory {
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
        label: string;
    }): Pick<CubeCollection, Exclude<keyof CubeCollection, 'id'>> {
        const { position, rotation, dimension, name, color, label } = cubeParams;
        const geometry = new BoxGeometry(dimension.x, dimension.y, dimension.z);
        const material = new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
        });
        const mesh = new Mesh(geometry, material);
        const label2D = MeshFactory.createLabel(label, color);
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
        };
    }

    public static createLabel(string: string, color: Color): CSS2DObject {
        const divEle = document.createElement('div');
        const label2d = new CSS2DObject(divEle);
        divEle.className = 'spo-3d-main-label';
        divEle.textContent = string;
        divEle.style.background = `linear-gradient(90deg, ${color.getStyle()} 0%, rgba(0, 0, 0, 0) 100%)`;
        return label2d;
    }

    public static disposeGeo(geometry: BufferGeometry): void {
        geometry.dispose();
    }

    public static disposeMesh(itemToRemove: Mesh | Points): void {
        itemToRemove.geometry.dispose();

        if (itemToRemove.material instanceof Array) {
            itemToRemove.material.forEach((v) => v.dispose());
        } else {
            itemToRemove.material.dispose();
        }
    }
}
