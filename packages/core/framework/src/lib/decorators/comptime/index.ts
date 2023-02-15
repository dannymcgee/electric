import comptimeDecorators from "@electric/comptime-decorators"

import { Component } from "./component"
import { input } from "./input"

// Plugin hook for Nx custom transformers loader
export const before = comptimeDecorators({ Component, input })
