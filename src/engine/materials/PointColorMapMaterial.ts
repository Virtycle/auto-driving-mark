import { ShaderMaterial, ShaderMaterialParameters, DataTexture } from 'three';

export enum PointShaderDataGroup {
    z = 1,
    intensity = 2,
}

export default function createPointColorMapMaterial(
    params: ShaderMaterialParameters & {
        size?: number;
        dataOffset: number;
        dataRadio: number;
        dataGroup?: PointShaderDataGroup;
        dataTexture: DataTexture;
    },
): ShaderMaterial {
    const { size, dataRadio: radio, dataOffset: offset, dataGroup, dataTexture } = params;
    const uniforms = {
        dataOffset: { value: offset },
        dataRadio: { value: radio },
        dataGroup: { value: dataGroup || PointShaderDataGroup.z },
        size: { value: size || 1 },
        colorMapTexture: { value: dataTexture },
    };
    return new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
        uniform float dataOffset;
        uniform float dataRadio;
        uniform float dataGroup;
        uniform float size;
        uniform sampler2D colorMapTexture;

        attribute float intensity;

        varying vec3 vColor;

        void main() {

            float factor = position.z;
            if (dataGroup == 2.0) {
                factor = intensity;
            };
            vColor = texture2D(colorMapTexture,
                vec2((factor + dataOffset) * dataRadio, 1.)).xyz;
            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }`,
        fragmentShader: `
        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor, 1.0);

        }`,
    });
}
