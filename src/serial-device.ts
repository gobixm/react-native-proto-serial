import {DeviceEventEmitter} from 'react-native';
import {
    actions,
    DataBits,
    definitions,
    FlowControls,
    Parities,
    ReturnedDataTypes,
    RNSerialport,
    StopBits
} from 'react-native-serialport';
import {Observable, Subject} from 'rxjs';
import {Base64} from 'js-base64';
import {FrameTransciever} from './frame-transciever';

export class SerialDevice {
    public get data$(): Observable<number[]> {
        return this.dataSubject$.asObservable();
    }

    public get error$(): Observable<any> {
        return this.errorSubject$.asObservable();
    }

    public get message$(): Observable<Uint8Array> {
        return this.transciever.body$;
    }

    public get connection$(): Observable<boolean> {
        return this.connectionSubject$.asObservable();
    }

    private dataSubject$ = new Subject<number[]>();

    private errorSubject$ = new Subject<any>();

    private connectionSubject$ = new Subject<boolean>();

    private transciever = new FrameTransciever(this.data$, (data) => {
        RNSerialport.writeBase64(Base64.fromUint8Array(Uint8Array.from(data)));
    });

    constructor() {
        DeviceEventEmitter.addListener(
            actions.ON_SERVICE_STARTED,
            () => {},
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_SERVICE_STOPPED,
            () => {},
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_DEVICE_ATTACHED,
            () => {},
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_DEVICE_DETACHED,
            () => {},
            this
        );
        DeviceEventEmitter.addListener(actions.ON_ERROR, this.onError, this);
        DeviceEventEmitter.addListener(
            actions.ON_CONNECTED,
            this.onConnected,
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_DISCONNECTED,
            this.onDisconnected,
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_READ_DATA,
            this.onReadData,
            this
        );

        RNSerialport.setReturnedDataType(
            <ReturnedDataTypes>definitions.RETURNED_DATA_TYPES.INTARRAY
        );
        RNSerialport.setAutoConnect(true);
        RNSerialport.setAutoConnectBaudRate(115200);

        RNSerialport.setDataBit(<DataBits>definitions.DATA_BITS.DATA_BITS_8);
        RNSerialport.setStopBit(<StopBits>definitions.STOP_BITS.STOP_BITS_1);
        RNSerialport.setParity(<Parities>definitions.PARITIES.PARITY_NONE);
        RNSerialport.setFlowControl(
            <FlowControls>definitions.FLOW_CONTROLS.FLOW_CONTROL_OFF
        );
        RNSerialport.startUsbService();
    }

    transmit(message: Uint8Array) {
        this.transciever.write(message);
    }

    private onError(err: any) {
        this.errorSubject$.next(err);
    }

    private onConnected() {
        this.connectionSubject$.next(true);
    }

    private onDisconnected() {
        this.connectionSubject$.next(false);
    }

    private onReadData(data: any) {
        const payload = <Array<number>>data.payload;
        this.dataSubject$.next(payload);
    }
}

export default SerialDevice;
