import { Box3, Euler, Matrix4, Quaternion, Vector3, Points } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB';
import { Vec2 } from './interface';

function getBoxDirection(
    box: Box3,
    matrix?: Matrix4,
): { center: Vector3; dirX: Vector3; dirY: Vector3; dirZ: Vector3; disX: number; disY: number; disZ: number } {
    const boxI = new Box3().copy(box);
    const x = new Vector3(1, 0, 0);
    const y = new Vector3(0, 1, 0);
    const z = new Vector3(0, 0, 1);
    const center = boxI.getCenter(new Vector3());
    let disX = boxI.max.x;
    let disY = boxI.max.y;
    let disZ = boxI.max.z;
    if (matrix) {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        matrix.decompose(position, quaternion, scale);
        center.applyMatrix4(matrix);
        x.applyQuaternion(quaternion);
        y.applyQuaternion(quaternion);
        z.applyQuaternion(quaternion);
        disX = disX * scale.x;
        disY = disY * scale.y;
        disZ = disZ * scale.z;
    }
    return { center, dirX: x, dirY: y, dirZ: z, disX, disY, disZ };
}

function getCanvasRelativePosition(event: MouseEvent, canvas: HTMLCanvasElement): Vec2 {
    const rect = canvas.getBoundingClientRect();
    // canvas 像素空间位置
    return {
        x: ((event.clientX - rect.left) * canvas.width) / rect.width,
        y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
}

function getCanvasCssPosition(event: MouseEvent, canvas: HTMLCanvasElement): Vec2 {
    const rect = canvas.getBoundingClientRect();
    // css 像素空间位置
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

// see raycaster
function getNormalizedPosition(event: MouseEvent, canvas: HTMLCanvasElement): Vec2 {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) * 2) / rect.width - 1,
        y: ((event.clientY - rect.top) * -2) / rect.height + 1,
    };
}

function containPointsNum(box3: Box3, matrix: Matrix4, points: Points): number {
    let number = 0;
    const obb = new OBB().fromBox3(box3).applyMatrix4(matrix);
    const positions = points.geometry.getAttribute('position');
    const vec3 = new Vector3();
    for (let i = 0; i < positions.count; i++) {
        vec3.fromBufferAttribute(positions, i);
        if (obb.containsPoint(vec3)) {
            number++;
        }
    }
    return number;
}

export { getBoxDirection, getCanvasRelativePosition, getCanvasCssPosition, getNormalizedPosition, containPointsNum };
