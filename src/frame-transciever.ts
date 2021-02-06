/* eslint-disable no-bitwise */
import { Observable, Subject } from 'rxjs';
import { calcArrayChecksum, calcByteChecksum, FletcherSum } from './checksum';

enum FrameState {
  WaitingStart = 0,
  WaitingEnd = 1,
}

enum EscapeState {
  None = 0,
  WaitingUnescape = 1,
}

const FRAME_START_FLAG = 0x7c;
const FRAME_END_FLAG = 0x7e;
const FRAME_ESCAPE_FLAG = 0x7d;
const FRAME_ESCAPE_XOR = 0x20;

export class FrameTransciever {
  public get body$(): Observable<Uint8Array> {
    return this.bodySubject.asObservable();
  }

  public get error$(): Observable<Error> {
    return this.errorSubject.asObservable();
  }

  private frame: number[] = [];

  private bodySubject = new Subject<Uint8Array>();

  private errorSubject = new Subject<Error>();

  private frameState = FrameState.WaitingStart;

  private escapeState = EscapeState.None;

  constructor(
    reader: Observable<number[]>,
    private writer: (data: number[]) => void
  ) {
    reader.subscribe((buf) => this.processData(buf));
  }

  public write(message: Uint8Array) {
    const frame = [FRAME_START_FLAG];
    const checksum: FletcherSum = { hi: 0, lo: 0 };

    function writeByte(b: number) {
      let currentByte = b;
      if (
        currentByte === FRAME_START_FLAG ||
        currentByte === FRAME_END_FLAG ||
        currentByte === FRAME_ESCAPE_FLAG
      ) {
        frame.push(FRAME_ESCAPE_FLAG);
        calcByteChecksum(checksum, currentByte);
        currentByte ^= FRAME_ESCAPE_XOR;
      }
      frame.push(currentByte);
      calcByteChecksum(checksum, currentByte);
    }

    message.forEach((b) => writeByte(b));

    const sumHi = checksum.hi;
    const sumLo = checksum.lo;

    writeByte(sumHi);
    writeByte(sumLo);
    frame.push(FRAME_END_FLAG);
    this.writer(frame);
  }

  private processData(buf: number[]) {
    buf.forEach((byte) => {
      if (byte === FRAME_START_FLAG) {
        if (this.frameState !== FrameState.WaitingStart) {
          this.errorSubject.next(new Error('Received unexpected Frame Start'));
        }
        this.resetFrame();
        this.frameState = FrameState.WaitingEnd;
      } else if (byte === FRAME_END_FLAG) {
        if (this.frameState !== FrameState.WaitingEnd) {
          this.errorSubject.next(new Error('Received unexpected Frame End'));
          this.frameState = FrameState.WaitingStart;
          return;
        }
        this.frameState = FrameState.WaitingStart;
        this.emitMessage();
      } else if (byte === FRAME_ESCAPE_FLAG) {
        this.escapeState = EscapeState.WaitingUnescape;
      } else if (this.escapeState === EscapeState.WaitingUnescape) {
        this.frame.push(byte ^ FRAME_ESCAPE_XOR);
        this.escapeState = EscapeState.None;
      } else {
        this.frame.push(byte);
      }
    });
  }

  private resetFrame() {
    this.frame = [];
  }

  private checkCrc(): boolean {
    const checksum: FletcherSum = { hi: 0, lo: 0 };
    calcArrayChecksum(checksum, this.frame, 0, this.frame.length - 2);

    return this.frame[-1] === checksum.lo && this.frame[-2] === checksum.hi;
  }

  private emitMessage() {
    if (!this.checkCrc) {
      console.error('Invalid CRC');
      return;
    }

    this.bodySubject.next(
      Uint8Array.from(this.frame.slice(0, this.frame.length - 2))
    );
  }
}

export default FrameTransciever;
