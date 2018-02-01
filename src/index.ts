export { default as connect } from './connect';
export { default as createProvider } from './provider';
export { default as withProps } from './with-props';

export * from './connect';
export * from './provider';

/**
 * A class constructor function.
 */
export type ClassConstructor<T> = new(...args: any[]) => T;
