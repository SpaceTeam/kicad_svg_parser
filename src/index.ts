import * as parser from "./parser/s_expression"
import * as kicad from "./kicad/kicad_types"

export * from "./svg/svg_generator"
export * from "./kicad/kicad_types"
export * from "./svg/svg_api"

export function readSchematic(input: string): kicad.Schematic {
    return parser.parse(input)
}
