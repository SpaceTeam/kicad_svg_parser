import * as kicad from "../kicad/kicad_types"
import { Net } from "../kicad/net"

export interface SVGConfiguration {
    classes: SVGClasses
    styleVars: SVGStyleVars
    callbacks: SVGCallbacks
    createHiddenTexts: boolean
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
    SYMBOL_ADDITIONAL_ELEMENTS?: SVGElementCallback<kicad.Symbol>
    SYMBOL_ATTRIBUTES?: SVGAttributeCallback<kicad.Symbol>
    SYMBOL_CLASSES?: SVGClassesCallback<kicad.Symbol>
    PROPERTY_ATTRIBUTES?: SVGAttributeCallback<kicad.Property>
    PROPERTY_CLASSES?: SVGClassesCallback<kicad.Property>
    NET_ATTRIBUTES?: SVGAttributeCallback<Net>
    NET_CLASSES?: SVGClassesCallback<Net>
}

export type SVGElementCallback<T> = (target: T) => string
export type SVGAttributeCallback<T> = (target: T) => string
export type SVGClassesCallback<T> = (target: T) => string[]