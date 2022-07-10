import * as kicad from "./kicad_types"

export class SymbolIdx {

    //Library Symbol ID: <LIB_NICKNAME>:<SYMBOL_ID>
    //Unit Symbol ID: <SYMBOL_ID>_<UNIT>_<STYLE>
    //SYMBOL_ID: id of parent symbol
    //UNIT: unit the symbol represents, 0 is used for all symbols
    //This index then stores the symbols in a map with format <LIB_NICKNAME>:<SYMBOL_ID>:<UNIT>

    symbol_idx: Map<string, Array<kicad.LibSymbol>> = new Map();

    addLibrary(symbols?: Array<kicad.LibSymbol>) {
        symbols?.forEach(symbol => {
            const [libName, symbolId] = this.parseLibSymbolID(symbol.id)

            //Include root symbol as unit 0
            this.addSymbol(symbol.id, 0, symbol)

            symbol.$symbol?.forEach(unit => {
                const [parentId, unitId, style] = this.parseUnitSymbolID(unit.id)
                if (parentId !== symbolId) {
                    throw `Unit ${unit.id} doesn't match parent symbol ${symbol.id}`
                }

                //Always include unit 0 (shared across all units), only include style 1 for now
                if (unitId === 0 || style === 1) {
                    this.addSymbol(symbol.id, unitId, unit)
                }
            })
        })
    }

    addSymbol(symbolId: string, unit: number, symbol: kicad.LibSymbol) {
        const key = this.getKey(symbolId, unit)
        let entry = this.symbol_idx.get(key)
        if (entry === undefined) {
            entry = []
            this.symbol_idx.set(key, entry)
        }
        entry.push(symbol)
    }

    getSymbols(symbol: kicad.Symbol): Array<kicad.LibSymbol> {
        //Symbol may specify a name in lib differing from the schema
        const symbolId = symbol.lib_name ?? symbol.lib_id;

        const symbolsUnitZero = this.symbol_idx.get(this.getKey(symbolId, 0))
        const symbolsUnit = symbol.unit ? this.symbol_idx.get(this.getKey(symbolId, symbol.unit)) : undefined
        return (symbolsUnitZero ?? []).concat((symbolsUnit ?? []))
    }

    parseLibSymbolID(id: string): [string, string] {
        let s = id.split(":")
        return [s.slice(0,-1).join(":"), s.at(-1)!]
    }

    parseUnitSymbolID(id: string): [string, number, number] {
        let s = id.split("_")
        return [s.slice(0,-2).join("_"), parseInt(s.at(-2)!), parseInt(s.at(-1)!)]
    }

    getKey(symbolId: string, unit: number): string {
        return symbolId + ":" + unit;
    }
}