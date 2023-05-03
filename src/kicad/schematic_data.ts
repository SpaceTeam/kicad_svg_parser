import * as kicad from "./kicad_types"
import { Net, getNets } from "./net"
import { SymbolIdx } from "./symbol_idx"

export class SchematicData {
    schematic: kicad.Schematic
    symbolIdx: SymbolIdx
    nets: Net[]

    constructor(schematic: kicad.Schematic, symbolIdx?: SymbolIdx) {
        if (symbolIdx === undefined) {
            symbolIdx = new SymbolIdx()
            symbolIdx.addLibrary(schematic.lib_symbols)
        }
        this.symbolIdx = symbolIdx
        this.schematic = schematic
        this.nets = getNets(this.schematic, this.symbolIdx)
    }

}