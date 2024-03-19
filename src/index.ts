import { TextDecoder, TextEncoder } from "util";
// make available some modules that the `cborg`-module depends on
(global as any).TextDecoder = TextDecoder;
(global as any).TextEncoder = TextEncoder;

//Exports all handler functions
export * from "./mappings/mappingHandlers";
import "@polkadot/api-augment";
