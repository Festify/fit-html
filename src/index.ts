export { default as connect } from './connect';
export { default as createProvider } from './provider';
export { default as withExtended } from './with-extended';
export { default as withProps } from './with-props';

export * from './connect';
export * from './provider';

export type ClassConstructor<T> = new(...args: any[]) => T;
