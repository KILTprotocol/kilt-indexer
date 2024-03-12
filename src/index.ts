//Exports all handler functions
export * from "./mappings/mappingHandlers";
import "@polkadot/api-augment";

import { TextDecoder, TextEncoder } from "util";

(global as any).TextDecoder = TextDecoder;
(global as any).TextEncoder = TextEncoder;
