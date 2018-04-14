// tslint:disable-next-line:ban-types
export function isFunction(f: any): f is Function {
    return typeof f === 'function';
}

export function shallowEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}
