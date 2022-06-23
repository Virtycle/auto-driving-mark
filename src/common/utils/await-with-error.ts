export default function withError<T, U = Error>(promise: Promise<T>): Promise<[U | null, T | undefined]> {
    return promise
        .then<[null, T]>((data: T) => {
            return [null, data];
        })
        .catch<[U, undefined]>((err: U) => [err, undefined]);
}
