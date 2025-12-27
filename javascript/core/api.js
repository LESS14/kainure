/* ============================================================================ *
 * Kainure - Node.js Framework for SA-MP (San Andreas Multiplayer)              *
 * ================================= About ==================================== *
 *                                                                              *
 * Kainure embeds Node.js runtime into SA-MP servers, enabling developers       *
 * to write gamemodes using modern JavaScript/TypeScript with full access       *
 * to the Node.js ecosystem, async/await, npm packages, and native SA-MP        *
 * functions through automatic bindings.                                        *
 *                                                                              *
 * =============================== Copyright ================================== *
 *                                                                              *
 * Copyright (c) 2025, AlderGrounds                                             *
 * All rights reserved.                                                         *
 *                                                                              *
 * Repository: https://github.com/aldergrounds/kainure                          *
 *                                                                              *
 * ================================ License =================================== *
 *                                                                              *
 * Licensed under the Apache License, Version 2.0 (the "License");              *
 * you may not use this file except in compliance with the License.             *
 * You may obtain a copy of the License at:                                     *
 *                                                                              *
 *     http://www.apache.org/licenses/LICENSE-2.0                               *
 *                                                                              *
 * Unless required by applicable law or agreed to in writing, software          *
 * distributed under the License is distributed on an "AS IS" BASIS,            *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     *
 * See the License for the specific language governing permissions and          *
 * limitations under the License.                                               *
 *                                                                              *
 * ============================================================================ */

const Event_Emitter = require('node:events');
const path = require('node:path');
const fs = require('node:fs');

class Kainure_Core extends Event_Emitter {
    constructor() {
        super();

        this.call_public = null;
        this.native = {};
        this.signatures = new Map();
    }

    Public(event_name, callback) {
        if (typeof event_name !== 'string' || typeof callback !== 'function')
            throw new Error("Invalid arguments for Public. Expected (string, function).");

        const fn = callback.toString();
        let signature = "";
        const args_match = fn.match(/^[^(]*\(([^)]*)\)/);

        if (args_match && args_match[1]) {
            const params = args_match[1].split(',');

            for (const param of params) {
                if (param.trim().length === 0)
                    continue;
                
                const match = param.match(/=\s*['"]([a-zA-Z0-9]+)['"]/);

                if (match) {
                    const type_char = match[1].toLowerCase();

                    if (type_char === 'f')
                        signature += 'f';
                    else if (type_char === 's')
                        signature += 's';
                    else {
                        console.warn(
                            `[Kainure]:[Warning]: Unnecessary signature type '${type_char}' in Public '${event_name}'. ` +
                            `Only 'f' (Float) and 's' (String) need to be specified. ` +
                            `Integers and Booleans are handled automatically.`);
                            
                        signature += 'i';
                    }
                }
                else
                    signature += 'i';
            }
        }

        if (signature.length > 0)
            this.signatures.set(event_name, signature);

        this.on(event_name, callback);
    }
}

const kainure = new Kainure_Core();
globalThis.Kainure = kainure;

globalThis.Float = (value) => {
    const num = typeof value === 'number' ? value : Number(value);

    if (Number.isInteger(num))
        return num + 1e-10;

    return num;
};

globalThis.Ref = (initial_value = 0) => ({
    value: initial_value,
    __kainure_ref: true,

    get $() {
        return {
            __kainure_ptr: true,
            parent: this
        };
    },
    valueOf() {
        return this.value;
    },
    toString() {
        return String(this.value);
    }
});

globalThis.Public = (event_name, callback) => {
    kainure.Public(event_name, callback);
};

globalThis.Call_Public = new Proxy({}, {
    get(_, prop) {
        return (...args) => {
            if (!kainure.call_public)
                throw new Error('"call_public" not initialized by C++ yet.');

            return kainure.call_public(String(prop), ...args);
        };
    }
});

globalThis.Native = new Proxy(kainure.native, {
    get(target, prop) {
        if (Reflect.has(target, prop))
            return Reflect.get(target, prop);

        throw new ReferenceError(`The native '${String(prop)}' was not found.`);
    }
});

globalThis.Native_Hook = (native_name, callback) => {
    if (typeof native_name !== 'string' || typeof callback !== 'function')
        throw new Error("Usage: Native_Hook(string, function)");

    if (globalThis.Kainure_Register_Native_Hook)
        globalThis.Kainure_Register_Native_Hook(native_name, callback);
    else
        throw new Error("Native Hook system not initialized.");
};

globalThis.Include_Storage = (folder_name) => {
    if (typeof folder_name !== 'string' || folder_name.trim().length === 0)
        throw new Error("Include_Storage: 'folder_name' must be a non-empty string.");

    const safe_name = folder_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (safe_name !== folder_name) {
        console.warn(
            `[Kainure]:[Warning]: Include name '${folder_name}' was sanitized to '${safe_name}'. ` +
            `Use only letters, numbers, underscore and hyphen.`
        );
    }

    const storage_base = path.resolve(process.cwd(), 'Kainure', 'includes_storage');
    const include_storage_path = path.join(storage_base, safe_name);

    try {
        if (!fs.existsSync(include_storage_path))
            fs.mkdirSync(include_storage_path, { recursive: true });
    }
    catch (error) {
        throw new Error(`Include_Storage: Failed to create directory '${include_storage_path}': ${error.message}`);
    }

    return include_storage_path;
};

globalThis.Kainure_Emit_Event = (name, ...args) => {
    const listeners = kainure.listeners(name);

    if (listeners.length === 0)
        return undefined;

    let last_result;

    for (const listener of listeners)
        last_result = listener(...args);

    return last_result;
};

globalThis.Kainure_Has_Listeners = (name) => {
    return kainure.listenerCount(name) > 0;
};

globalThis.Kainure_Get_Signature = (name) => {
    return kainure.signatures.get(name) || "";
};

module.exports = kainure;