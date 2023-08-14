import * as parser from "./parser/s_expression"
import * as kicad from "./kicad/kicad_types"

export * from "./kicad/kicad_types"
export * from "./kicad/net"
export * from "./kicad/schematic_data"
export * from "./kicad/symbol_idx"
export * from "./svg/svg_api"
export * from "./svg/svg_generator"

export function readSchematic(input: string): kicad.Schematic {
    return parser.parse(input)
}
