export function has<T>(t?: T): t is T {
    return !!t;
}