export { default as connect } from './connect';
export { default as withFit } from './fit-element';
export { default as withProps } from './props';
export { default as withStore } from './store';

export * from './connect';
export * from './fit-element';

/**
 * A class constructor function.
 */
export type ClassConstructor<T> = new(...args: any[]) => T;
