import comptimeDecorators from "@electric/comptime-decorators"

import { Component } from "./lib/decorators/comptime"

export * from "./lib/decorators/runtime/"

// Plugin hook for Nx custom transformers loader
// TODO: Move this into a sub-module definition,
// like @electric/framework/decorators/comptime
export const before = comptimeDecorators({ Component })
