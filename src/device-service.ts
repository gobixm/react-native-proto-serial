import {combineLatest, Observable, timer} from 'rxjs';
import {filter, first, map, tap, timeout} from 'rxjs/operators';
import type {ProtoSerializer} from './proto-serializer';
import type {SerialDevice} from './serial-device';

export type MessageMapper<TBase, TMessage> = (message: TBase) => TMessage;

export class DeviceService<TBase> {
    public get message$(): Observable<TBase> {
        return this.device.message$.pipe(map((m) => this.serializer.decode(m)));
    }

    constructor(
        private device: SerialDevice,
        private serializer: ProtoSerializer<TBase>
    ) {}

    send(message: TBase) {
        this.device.transmit(this.serializer.encode(message));
    }

    request$<TMessage>(
        message: TBase,
        mapper: MessageMapper<TBase, TMessage | null | undefined>,
        wait: number = 1000
    ): Observable<TMessage> {
        const response$ = this.message$.pipe(
            map((x) => mapper(x) as TMessage),
            filter((x) => !!x),
            first()
        );

        return combineLatest([
            response$,
            timer(0).pipe(
                first(),
                tap(() => this.send(message))
            )
        ]).pipe(
            map(([resp]) => resp),
            timeout(wait)
        );
    }
}
