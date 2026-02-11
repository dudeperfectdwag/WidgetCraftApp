/** Script runtime interface (stub). */
export const DEFAULT_SCRIPT_TIMEOUT_MS = 50;
export const DEFAULT_SCRIPT_MAX_OUTPUT_BYTES = 200 * 1024;
export const SCRIPT_RUNTIME_VERSION = 1;
export type ScriptRuntimeFactory = () => ScriptRuntime;
export const defaultRuntimeOptions = (): ScriptRuntimeOptions => ({
    timeoutMs: DEFAULT_SCRIPT_TIMEOUT_MS,
    maxOutputBytes: DEFAULT_SCRIPT_MAX_OUTPUT_BYTES,
});

export const exceedsMaxOutputBytes = (bytes: number, options?: ScriptRuntimeOptions): boolean =>
    bytes > (options?.maxOutputBytes ?? DEFAULT_SCRIPT_MAX_OUTPUT_BYTES);

export const isTimedOut = (elapsedMs: number, options?: ScriptRuntimeOptions): boolean =>
    elapsedMs > (options?.timeoutMs ?? DEFAULT_SCRIPT_TIMEOUT_MS);

export const isScriptOutput = (value: unknown): value is ScriptOutput =>
    !!value && typeof value === 'object' && 'type' in (value as Record<string, unknown>);
export type ScriptOutput =
    | { type: 'text'; value: string }
    | { type: 'list'; items: Array<{ value: string }> }
    | { type: 'shape'; shape: 'rect' | 'circle' };
export type ScriptRuntimeErrorCode = 'compile' | 'runtime' | 'timeout' | 'output';
export type ScriptRuntimeError = { message: string; code?: ScriptRuntimeErrorCode; line?: number; column?: number };
export type ScriptRunStatus = 'idle' | 'running' | 'error' | 'success';
export type ScriptRuntimeResult = { ok: boolean; status?: ScriptRunStatus; output?: ScriptOutput; error?: ScriptRuntimeError };
export const okResult = (output?: ScriptOutput): ScriptRuntimeResult => ({ ok: true, status: 'success', output });
export const errorResult = (error: ScriptRuntimeError): ScriptRuntimeResult => ({ ok: false, status: 'error', error });
export const runningResult = (): ScriptRuntimeResult => ({ ok: false, status: 'running' });
export const timeoutResult = (): ScriptRuntimeResult =>
    errorResult({ message: 'Script execution timed out.', code: 'timeout' });
export const compileErrorResult = (message: string, line?: number, column?: number): ScriptRuntimeResult =>
    errorResult({ message, code: 'compile', line, column });
export const runtimeErrorResult = (message: string, line?: number, column?: number): ScriptRuntimeResult =>
    errorResult({ message, code: 'runtime', line, column });
export const outputErrorResult = (message: string): ScriptRuntimeResult =>
    errorResult({ message, code: 'output' });
export const normalizeErrorMessage = (message: string): string =>
    message.trim() || 'Unknown script error.';
export const normalizeLineColumn = (line?: number, column?: number): { line?: number; column?: number } => ({
    line: line && line > 0 ? line : undefined,
    column: column && column > 0 ? column : undefined,
});
export type ScriptRuntimeContext = Record<string, unknown>;
export type ScriptRuntimeOptions = { timeoutMs?: number; maxOutputBytes?: number };
export interface ScriptRuntime {
    timeoutMs?: number;
    compile(script: string): ScriptRuntimeResult;
    validate(script: string): ScriptRuntimeResult;
    validateOutput(output: unknown): ScriptRuntimeResult;
    run(script: string, context: ScriptRuntimeContext, options?: ScriptRuntimeOptions): ScriptRuntimeResult;
}

export const NoopScriptRuntime: ScriptRuntime = {
    compile: () => okResult(),
    validate: () => okResult(),
    validateOutput: () => okResult(),
    run: () => errorResult({ message: 'Script runtime not implemented.' }),
};

export const createScriptRuntime: ScriptRuntimeFactory = () => BasicScriptRuntime;

export const BasicScriptRuntime: ScriptRuntime = {
    compile: (script) => {
        try {
            // eslint-disable-next-line no-new-func
            new Function('context', `"use strict";\n${script}\n`);
            return okResult();
        } catch (err) {
            return compileErrorResult(normalizeErrorMessage(String(err)));
        }
    },
    validate: (script) => BasicScriptRuntime.compile(script),
    validateOutput: (output) => isScriptOutput(output) ? okResult(output) : outputErrorResult('Invalid script output.'),
    run: (script, context, options) => {
        const start = Date.now();
        const compiled = BasicScriptRuntime.compile(script);
        if (!compiled.ok) return compiled;
        try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('context', `"use strict";\n${script}\n`);
            const output = fn(context);
            if (isTimedOut(Date.now() - start, options)) return timeoutResult();
            return BasicScriptRuntime.validateOutput(output);
        } catch (err) {
            return runtimeErrorResult(normalizeErrorMessage(String(err)));
        }
    },
};
