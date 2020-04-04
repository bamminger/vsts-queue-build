export function sleep(seconds: number): Promise<{}> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
