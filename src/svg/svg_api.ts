import * as kicad from "../kicad/kicad_types"
import { Net } from "../kicad/net"

export interface SVGConfiguration {
    classes: SVGClasses
    styleVars: SVGStyleVars
    callbacks: SVGCallbacks
    createHiddenTexts: boolean
    createBounds: boolean
    debug: SVGDebugSettings
}

export interface SVGClasses {
    DIAGRAM: string
    SYMBOL: string
    WIRE: string
    GRAPHICS: string
    SYMBOL_GRAPHICS: string
    PROPERTY: string
    PIN: string
    PIN_NUMBER: string
    PIN_NAME: string
    BOUNDS: string
}

export interface SVGStyleVars {
    DEFAULT_STROKE_WIDTH: string
    DEFAULT_STROKE_COLOR: string
    DEFAULT_FILL_COLOR: string
    DEFAULT_STROKE_STYLE: string
    DEFAULT_JUNCTION_RADIUS: string
}

export interface SVGDebugSettings {
    DEBUG_CS_SCHEMATIC: boolean //Debug schematic coordinate system
    DEBUG_TEXT_ANCHOR: boolean //Debug text justification / rotation
}

export interface SVGCallbacks {
    SYMBOL_ADDITIONAL_ELEMENTS?: SymbolCallback<string>
    SYMBOL_ATTRIBUTES?: SymbolCallback<string>
    SYMBOL_CLASSES?: SymbolCallback<string[]>
    PROPERTY_ATTRIBUTES?: PropertyCallback<string>
    PROPERTY_CLASSES?: PropertyCallback<string[]>
    PROPERTY_TEXT?: PropertyCallback<string>
    NET_ATTRIBUTES?: NetCallback<string>
    NET_CLASSES?: NetCallback<string[]>
}

export type SymbolCallback<T> = (symbol: kicad.Symbol) => T
export type PropertyCallback<T> = (symbol: kicad.Symbol, property: kicad.Property) => T
export type NetCallback<T> = (net: Net) => T