export interface FletcherSum {
    hi: number;
    lo: number;
}

// Fletcher sum
export function calcArrayChecksum(
    sum: FletcherSum,
    data: ArrayLike<number>,
    index: number,
    size: number = data.length
) {
    for (let i = index; i < size; i += 1) {
        sum.lo = (sum.lo + data[i]) % 255;
        sum.hi = (sum.hi + sum.lo) % 255;
    }
}

export function calcByteChecksum(sum: FletcherSum, byte: number) {
    sum.lo = (sum.lo + byte) % 255;
    sum.hi = (sum.hi + sum.lo) % 255;
}
