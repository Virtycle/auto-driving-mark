import { Box3, Euler, Matrix4, Vector3 } from 'three';

function getBoxDirection(
    box: Box3,
    matrix?: Matrix4,
): { center: Vector3; dirX: Vector3; dirY: Vector3; dirZ: Vector3 } {
    const boxI = new Box3().copy(box);
    const x = new Vector3(1, 0, 0);
    const y = new Vector3(0, 1, 0);
    const z = new Vector3(0, 0, 1);
    const center = boxI.getCenter(new Vector3());
    if (matrix) {
        const euler = new Euler().setFromRotationMatrix(matrix);
        center.applyMatrix4(matrix);
        x.applyEuler(euler);
        y.applyEuler(euler);
        z.applyEuler(euler);
    }
    return { center, dirX: x, dirY: y, dirZ: z };
}

export { getBoxDirection };
