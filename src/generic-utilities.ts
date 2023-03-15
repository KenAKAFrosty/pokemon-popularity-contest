export function getUuId() {
    const inDev = import.meta.env.DEV;

    return inDev ? Math.random().toString() : crypto.randomUUID();

}