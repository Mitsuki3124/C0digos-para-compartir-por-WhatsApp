/* tslint:disable */
/* eslint-disable */

/**
 * Criba de Eratostenes: cantidad de primos <= n. Ejemplo de calculo pesado.
 */
export function contar_primos(n: number): number;

export function normalizar(texto: string): string;

/**
 * Puntua cada texto contra la consulta (sin acentos ni mayusculas).
 * Devuelve un Uint32Array en JS con un puntaje por texto (0 = sin coincidencia).
 * Cada palabra de la consulta debe aparecer; mas puntos si empieza una palabra.
 */
export function puntuar(consulta: string, textos: string[]): Uint32Array;

/**
 * Ejemplo minimo: saludo desde Rust.
 */
export function saludar(nombre: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly contar_primos: (a: number) => number;
    readonly normalizar: (a: number, b: number, c: number) => void;
    readonly puntuar: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly saludar: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: () => number;
    readonly __wbindgen_export5: (a: number, b: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
