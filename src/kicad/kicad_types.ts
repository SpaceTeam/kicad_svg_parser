export interface Point {
    x: number
    y: number
}

export interface Position extends Point {
    angle: number
}

export type Mirror = undefined | "x" | "y"

export interface Size {
    height: number
    width: number
}

export interface Color {
    r: number,
    g: number,
    b: number,
    a: number
}

export interface Property {
    key: string
    value: string
    id: number
    at: Position
    effects?: Effects
}

export type StrokeType = "dash" | "dash_dot" | "dash_dot_dot" | "dot" | "default" | "solid"

export interface Stroke {
    width: number
    type: StrokeType
    color: Color
}

export type FillType = "none" | "outline" | "background"

export interface Fill {
    type: FillType
}

export interface ShapeStyle {
    stroke: Stroke
    fill?: Fill
}

export interface Font {
    face?: string
    size: Size
    thickness?: number
    bold?: never
    italic?: never
    line_spacing?: number
}

export type JustifyFlag = "left" | "right" | "top" | "bottom" | "mirror"

export interface Effects {
    font: Font
    justify?: Array<JustifyFlag>
    hide: boolean
}

export interface Arc extends ShapeStyle {
    start: Point
    mid: Point
    end: Point
}

export interface Circle extends ShapeStyle {
    center: Point
    radius: number
}

export interface Curve extends ShapeStyle {
    pts: Array<Point>
}

export interface PolyLine extends ShapeStyle {
    pts: Array<Point>
}

export interface Rectangle extends ShapeStyle {
    start: Point
    end: Point
}

export interface Text {
    text: string
    effects?: Effects
}

export interface PositionedText extends Text {
    at: Position
}

export type PinElectricalType =
    "input" | "output" | "bidirectional" |
    "tri_state" | "passive" | "free" |
    "unspecified" | "power_in" | "power_out" |
    "open_collector" | "open_emitter" | "no_connect"

export type PinGraphicStyle = 
    "line" | "inverted" | "clock" |
    "inverted_clock" | "input_low" | "clock_low" |
    "output_low" | "edge_clock_high" | "non_logic"

export interface Pin {
    electricalType: PinElectricalType
    graphicStyle: PinGraphicStyle
    at: Position
    length: number
    name: Text
    number: Text
    hide: boolean
}

export interface PinNames {
    offset?: number
    hide: boolean
}

export interface PinNumbers {
    hide: boolean
}

export interface GraphicalSection {
    $arc?: Array<Arc>
    $circle?: Array<Circle>
    $gr_curve?: Array<Curve>
    $polyline?: Array<PolyLine>
    $rectangle?: Array<Rectangle>
    $text?: Array<PositionedText>
}

export interface LibSymbol extends GraphicalSection {
    id: string
    //TODO support extends
    pin_numbers?: PinNumbers
    pin_names?: PinNames
    at: Position
    uuid: string
    $property?: Array<Property>
    $symbol?: Array<LibSymbol>
    $pin?: Array<Pin>
}

export interface Symbol {
    lib_id: string
    lib_name?: string
    at: Position
    mirror: Mirror
    unit?: number
    uuid: string
    $property: Array<Property>
}

export interface Wire extends PolyLine {
    uuid: string
}

export interface Junction {
    at: Position
    diameter?: number,
    color?: Color,
    uuid: string
}

export interface Label extends PositionedText {
    uuid: string
}

//TODO
export interface GlobalLabel extends Label {

}

//TODO
export interface HierarchicalLabel extends Label {

}

export interface Schematic extends GraphicalSection {
    version: number
    uuid: string
    paper: string
    lib_symbols: Array<LibSymbol>
    sheet_instances: any
    symbol_instances: any
    $symbol?: Array<Symbol>
    $junction?: Array<Junction>
    $wire?: Array<Wire>
    $bus?: Array<Wire>
    $label?: Array<Label>
    $global_label?: Array<GlobalLabel>
    $hierarchical_label?: Array<HierarchicalLabel>
}