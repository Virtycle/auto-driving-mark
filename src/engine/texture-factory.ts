import { NearestFilter, RGBAFormat, DataTexture } from 'three';
import { Lut } from 'three/examples/jsm/math/Lut';

export default class TextureFactory {
    public static fromLut(n = 32): DataTexture {
        const lut = new Lut('rainbow', n);
        const width = lut.lut.length;
        const height = 1;
        const size = width;

        const data = new Uint8Array(size * 4);
        for (let i = 0; i < size; i += 1) {
            const c = lut.lut[i];
            data[i * 4] = c.r * 255;
            data[i * 4 + 1] = c.g * 255;
            data[i * 4 + 2] = c.b * 255;
            data[i * 4 + 3] = 255;
        }
        const texture = new DataTexture(data, width, height, RGBAFormat);
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.needsUpdate = true;
        return texture;
    }
}
