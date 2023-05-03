import * as kicad from "../kicad/kicad_types"
import { SVGContext } from "./svg_context";
import { Point } from "../util/geom";
import * as text_transform from "../util/text_transform"

//Debug text justification

function getColor(color: kicad.Color | undefined, defaultColor: string): string {
    function mapValue(colorVal: number) {
        return Math.min(Math.max(0,Math.round(colorVal*255)), 255)
    }
    if (!color || (color.r == 0 && color.g == 0 && color.b == 0 && color.a == 0)) {
        return defaultColor
    } else {
        return `rgba(${mapValue(color.r)}, ${mapValue(color.r)}, ${mapValue(color.r)}, ${color.a.toFixed(3)})`
    }
}

function getStrokeStyle(stroke: kicad.StrokeType, defaultStroke: string): string {
    //TODO scale based on stroke width
    switch (stroke) {
        case "solid": return ""
        case "dash": return "1.2,0.8"
        case "dash_dot": return "1.2,0.3,0.2,0.3"
        case "dash_dot_dot": return "1.0,0.2,0.2,0.2,0.2,0.2"
        case "default":
        default: return defaultStroke
    }
}

function getForeBackground(styledElement: kicad.ShapeStyle, ctx: SVGContext, elementFactory: (element: string) => string): [string, string] {
    const styleVars = ctx.configuration.styleVars
    const strokeWidth = styledElement.stroke.width == 0 ? `var(${styleVars.DEFAULT_STROKE_WIDTH}, 0.1524)` : styledElement.stroke.width;
    const strokeColor = getColor(styledElement.stroke.color, `var(${styleVars.DEFAULT_STROKE_COLOR}, black)`)
    const strokeStyle = getStrokeStyle(styledElement.stroke.type, `var(${styleVars.DEFAULT_STROKE_STYLE}, black)`)

    const fgFill = styledElement.fill?.type === "outline" ? `var(${styleVars.DEFAULT_STROKE_STYLE}, black)` : "transparent"
    const bgFill = styledElement.fill?.type === "background" ? `var(${styleVars.DEFAULT_FILL_COLOR}, lightgray)` : undefined
    const fgStyle = `stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeStyle}" stroke-linecap="round" stroke-linejoin="round" fill="${fgFill}"`
    const bgStyle = `fill="${bgFill}"`

    const fgElement = elementFactory(fgStyle) + "\n"
    const bgElement = bgFill ? elementFactory(bgStyle) + "\n" : ""
    return [fgElement, bgElement]
}

function getStrokeSVG(element: kicad.ShapeStyle, ctx: SVGContext): string {
    const styleVars = ctx.configuration.styleVars
    const strokeWidth = element.stroke.width == 0 ? `var(${styleVars.DEFAULT_STROKE_WIDTH}, 0.1524)` : element.stroke.width;
    const strokeColor = getColor(element.stroke.color, `var(${styleVars.DEFAULT_STROKE_COLOR}, black)`)
    const fillColor = element.fill?.type === "background" ? `var(${styleVars.DEFAULT_FILL_COLOR}, lightgray)` : "transparent"
    const strokeStyle = getStrokeStyle(element.stroke.type, `var(${styleVars.DEFAULT_STROKE_STYLE}, black)`)
    return `stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeStyle}" stroke-linecap="round" stroke-linejoin="round" fill="${fillColor}"`
}

export function getContextDebugSVG(ctx: SVGContext): string {
    const arrowLength = 20
    let svg = ""
    const origin = ctx.point({x: 0, y: 0})
    const x = ctx.point({x: arrowLength, y: 0})
    const y = ctx.point({x: 0, y: arrowLength})
    const textAnchor = ctx.point({x: 5, y: 5})
    const angle = ctx.angle(0)
    const transform = `transform="rotate(${angle}, ${textAnchor.x}, ${textAnchor.y})"`
    const font = `font-size="2" text-color="orange"`
    const justify = `text-anchor="start" dominant-baseline="baseline"`

    ctx.bounds.update(x)
    ctx.bounds.update(y)
    ctx.bounds.update(origin)

    svg += `<path d="M ${origin.x} ${origin.y} L ${x.x} ${x.y}" stroke="red" stroke-width="0.2" fill="transparent"/>`
    svg += `<path d="M ${origin.x} ${origin.y} L ${y.x} ${y.y}" stroke="green" stroke-width="0.2" fill="transparent"/>`
    svg += `<text x="${textAnchor.x}" y="${textAnchor.y}" ${transform} ${justify} ${font}>${angle.toFixed(1)}°, ${ctx.cs.angleSign}/${ctx.cs.effectiveAngleSign}/${ctx.cs.textAngleMultiplier}</text>`
    return svg;
}

export function getGraphicalSectionSVG(graphicalSection: kicad.GraphicalSection, ctx: SVGContext) {
    const [fg, bg, text] = getGraphicalSectionSVGLayers(graphicalSection, ctx);
    return `<!-- BG -->\n${bg}<!-- FG -->\n${fg}<!-- TEXT -->\n${text}\n`
}

export function getGraphicalSectionSVGLayers(graphicalSection: kicad.GraphicalSection, ctx: SVGContext): [string, string, string] {
    ctx = ctx.withClasses(ctx.configuration.classes.GRAPHICS)
    let fg = "";
    let bg = "";
    let textSvg = "";
    function addElement(element: [string, string]) {
        const [elementFg, elementBg] = element
        fg += elementFg
        bg += elementBg
    }
    graphicalSection.$arc?.forEach(arc => {
        addElement(createArc(arc, ctx))
    })
    graphicalSection.$rectangle?.forEach(rect => {
        addElement(createRectangle(rect, ctx))
    })
    graphicalSection.$polyline?.forEach(line => {
        addElement(createLine(line, ctx))
    })
    graphicalSection.$circle?.forEach(circle => {
        addElement(createCircle(circle, ctx))
    })
    graphicalSection.$text?.forEach(text => {
        textSvg += createText(text, ctx) + "\n"
    })
    return [fg, bg, textSvg]
}

export function createArc(arc: kicad.Arc, ctx: SVGContext): [string, string] {
    const start = ctx.point(arc.start)
    const mid = ctx.point(arc.mid)
    const end = ctx.point(arc.end)
    //TODO this does not guarantee correct bounds
    ctx.bounds.update(start)
    ctx.bounds.update(mid)
    ctx.bounds.update(end)
    
    //https://de.wikipedia.org/wiki/Kreis#Kreis_durch_drei_Punkte

    const z = (p: kicad.Point) => p.x*p.x + p.y*p.y;
    const det = (x1: number, x2: number, x3: number, y1: number, y2: number, y3: number, z1: number, z2: number, z3: number) =>
        (x1*y2*z3) + (x2*y3*z1) + (x3*y1*z2) - (z1*y2*x3) - (z2*y3*x1) - (z3*y1*x2);

    const z1 = z(start)
    const z2 = z(mid)
    const z3 = z(end)
    const a = det(1, 1, 1, start.y, mid.y, end.y, z1, z2, z3);
    const b = det(start.x, mid.x, end.x, 1, 1, 1, z1, z2, z3);
    const c = det(start.x, mid.x, end.x, start.y, mid.y, end.y, 1, 1, 1);
    const d = det(start.x, mid.x, end.x, start.y, mid.y, end.y, z1, z2, z3);

    const r = Math.sqrt((a*a + b*b + 4*c*d) / (4*c*c))
    const dx = start.x - end.x;
    const dy = start.y - end.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    const largeArc = dist < 2*r ? "0" : "1"
    const sweepFlag = c < 0 ? "0" : "1"

    const element = (style: string) => `<!--dist=${dist} c=${c}-->\n<path ${ctx.class()} d="M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}" ${style}/>`
    return getForeBackground(arc, ctx, element)
}

export function createRectangle(rectangle: kicad.Rectangle, ctx: SVGContext): [string, string] {
    const start = ctx.point(rectangle.start)
    const end = ctx.point(rectangle.end)
    ctx.bounds.update(start)
    ctx.bounds.update(end)

    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(start.x - end.x)
    const height = Math.abs(start.y - end.y)

    const element = (style: string) => `<rect ${ctx.class()} x="${x}" y="${y}" width="${width}" height="${height}" ${style}/>`
    return getForeBackground(rectangle, ctx, element)
}

export function createLine(line: kicad.PolyLine, ctx: SVGContext): [string, string] {
    let path = ""
    for (const p of line.pts) {
        const point = ctx.point(p)
        ctx.bounds.update(point)
        path += `L ${point.x} ${point.y} `
    }
    path = "M" + path.substring(1)

    const element = (style: string) => `<path ${ctx.class()} d="${path}" ${style}/>`;
    return getForeBackground(line, ctx, element)
}

export function createCircle(circle: kicad.Circle, ctx: SVGContext): [string, string] {
    const center = ctx.point(circle.center)
    const radius = ctx.length(circle.radius)
    ctx.bounds.update(new Point(
        center.x - radius,
        center.y - radius,
    ))
    ctx.bounds.update(new Point(
        center.x + radius,
        center.y + radius,
    ))
    const element = (style: string) => `<circle ${ctx.class()} cx="${center.x}" cy="${center.y}" r="${radius}" ${style}/>`
    return getForeBackground(circle, ctx, element)
}

export function createProperty(symbol: kicad.Symbol, property: kicad.Property, fallbackProperty: kicad.Property | undefined, ctx: SVGContext, rotationCtx: SVGContext): string {
    
    //TODO maybe not fallback (probably not - tested)
    const effects = property.effects// ?? fallbackProperty?.effects
    
    
    const text: kicad.PositionedText = {
        at: property.at,
        text: ctx.configuration.callbacks.PROPERTY_TEXT?.(symbol, property) ?? property.value,
        effects: effects
    }
    let attributes = ctx.configuration.callbacks.PROPERTY_ATTRIBUTES?.(symbol, property) ?? ""
    let classes = ctx.configuration.callbacks.PROPERTY_CLASSES?.(symbol, property) ?? []
    return internalCreateText(text, attributes, classes, ctx, rotationCtx);
}

export function createText(text: kicad.PositionedText, ctx: SVGContext, rotationCtx?: SVGContext): string {
    return internalCreateText(text, "", [], ctx, rotationCtx)
}

function internalCreateText(text: kicad.PositionedText, attributes: string, classes: string[], ctx: SVGContext, rotationCtx?: SVGContext): string {
    if(!rotationCtx) rotationCtx = ctx
    const anchor = ctx.point(text.at)
    const angle = rotationCtx.textAngle(text.at.angle)
    const justify = rotationCtx.textJustify(text.at, text.effects?.justify)
    
    const defaultEffects: kicad.Effects = {
        font: {
            size: {
                width: 1.27,
                height: 1.27
            }
        },
        hide: false
    }
    const effects = text.effects ?? defaultEffects;

    if (effects.hide && !ctx.configuration.createHiddenTexts) {
        return `<!-- hidden text ${text.text} -->`
    } else {
        const transform = `transform="rotate(${angle}, ${anchor.x}, ${anchor.y})"`
        const font = `font-size="${effects.font.size.height}"`
        const visibility = effects.hide ? `visibility="hidden"` : ""
    
        //TODO maybe better text bounds
        ctx.bounds.update(anchor)

        let svg = `<text ${ctx.class(...classes)} ${attributes} x="${anchor.x}" y="${anchor.y}" ${transform} ${justify} ${font} ${visibility}>${text.text}</text>`
        if (ctx.configuration.debug.DEBUG_TEXT_ANCHOR) svg += textJustifyDebug(anchor, text.at.angle, ctx, text.effects?.justify)
        return svg
    }
}

function textJustifyDebug(anchor: Point, textAngle: number, ctx: SVGContext, justify?: Array<kicad.JustifyFlag>) {
    //DEBUG
    const globalAnchorDirection = text_transform.getGlobalAnchorDirection(textAngle*ctx.cs.textAngleMultiplier, justify, ctx.cs.transform, ctx.cs.angleSign)

    const lineEnd = anchor.add(globalAnchorDirection.multiply(5));
    const debug = `<path d="M ${anchor.x} ${anchor.y} L ${lineEnd.x} ${lineEnd.y}" stroke="yellow" stroke-width="0.2" fill="transparent"/>`
    return debug
}