import type {Writer} from 'protobufjs/minimal';

export class ProtoSerializer<T> {
    constructor(
        private decoder: (message: Uint8Array, length?: number) => T,
        private encoder: (message: T, writer?: Writer) => Writer
    ) {}

    decode(message: Uint8Array): T {
        return this.decoder(message);
    }

    encode(message: T): Uint8Array {
        return this.encoder(message).finish();
    }
}

export default ProtoSerializer;
