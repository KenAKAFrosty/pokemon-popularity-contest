export function getUuId() {
    const inDev = import.meta.env.DEV;
    return inDev ? "yep it's dev" : "nope not dev"

}