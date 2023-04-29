import * as kicad from "../kicad/kicad_types"
import { Transform } from "../util/geom"
import { SVGContext } from "./svg_context";
import { SymbolIdx } from "../kicad/symbol_idx";
import { createProperty, getGraphicalSectionSVG, getContextDebugSVG, getGraphicalSectionSVGLayers } from "./svg_primitives";
import { getPinSVG } from "./svg_pin";
import { indent } from "../util/string_util";

const DEBUG_CS_SYMBOL = false

export function getSymbolSVG(symbol: kicad.Symbol, symbolIdx: SymbolIdx, ctx: SVGContext): string {
    let symbolOrigin = ctx.point(symbol.at)
    //Translation is handled by group transform, mirror and rotate by ctx transform, symbol coordinate systems are flipped around x-axis for some reason
    //This everything in a symbol is a y-Up coordinate system => positive angle sign
    let symbolContext = ctx.child(Transform.MIRROR_X.multiply(ctx.getTransform({x: 0, y: 0, angle: symbol.at.angle}, symbol.mirror)), false)
    symbolContext.angleSign = 1 

    //Look up symbols from library
    let libSymbols = symbolIdx.getSymbols(symbol)
        
    if (libSymbols.length === 0) {
        console.warn(`Couldn't find any symbols for symbol id='${symbol.lib_id}' unit='${symbol.unit}'`)
    }

    let rootSymbol = libSymbols[0]
    let properties: Map<number, kicad.Property> = new Map()

    let graphicsCtx = symbolContext.child()
    graphicsCtx.textAngleMultiplier = 0.1;
    let fg = "<!-- FG -->\n"
    let bg = "<!-- BG -->\n"
    let text ="<!-- TEXT -->\n"
    let pins = "<!-- PINS -->\n"
    let graphicsSvg = ""
    
    //DEBUG
    if (DEBUG_CS_SYMBOL) graphicsSvg += getContextDebugSVG(graphicsCtx);

    libSymbols.forEach(libSymbol => {
        const unitComment = `<!-- Symbol Unit '${libSymbol.id}' -->\n`
        const [unitFg, unitBg, unitText, unitPins] = getLibSymbolSVG(libSymbol, rootSymbol, graphicsCtx)
        fg += unitComment + unitFg
        bg += unitComment + unitBg
        text += unitComment + unitText
        pins += unitComment + unitPins
        libSymbol.$property?.forEach(property => {
            properties.set(property.id, property)
        })
    })

    graphicsSvg += bg + fg + text + pins
    if (ctx.configuration.createBounds) {
        graphicsSvg += `<rect class="${ctx.configuration.classes.BOUNDS}" ${graphicsCtx.bounds.toRectAttributes()} visibility="hidden"/>`
    }
    graphicsSvg = `<g class="${ctx.configuration.classes.SYMBOL_GRAPHICS}" transform="translate(${symbolOrigin.x} ${symbolOrigin.y})">\n${indent(graphicsSvg)}\n</g>`

    //Bounds are already calculated for correct rotation / mirror, now translate them to the symbol position
    symbolContext.bounds.translate(symbolOrigin);
    //Merge the symbol bounds with the parent bounds
    ctx.bounds.merge(symbolContext.bounds);

    //Properties have locations in sheet coordinates, but rotation relative to the symbol coordinate system
    let propertyCtx = ctx.child().withClasses(ctx.configuration.classes.PROPERTY)
    let propSvg = "<!-- properties -->\n"
    symbol.$property?.forEach(property => {
        propSvg += createProperty(symbol, property, properties.get(property.id), propertyCtx, symbolContext) + "\n";
    })

    let additionalSvg = "\n" + (ctx.configuration.callbacks.SYMBOL_ADDITIONAL_ELEMENTS?.(symbol) ?? "") + "\n"
    let attributes = ctx.configuration.callbacks.SYMBOL_ATTRIBUTES?.(symbol) ?? ""
    let classes = ctx.configuration.callbacks.SYMBOL_CLASSES?.(symbol) ?? []
    
    return `<!-- Symbol '${symbol.lib_id}'-->\n<g ${ctx.class(ctx.configuration.classes.SYMBOL, ...classes)} ${attributes}>\n${indent(graphicsSvg)}\n${indent(propSvg)}\n${indent(additionalSvg)}\n</g>`;
}

function getLibSymbolSVG(unitSymbol: kicad.LibSymbol, rootSymbol: kicad.LibSymbol, ctx: SVGContext): [string, string, string, string] {    
    const [fg, bg, text] = getGraphicalSectionSVGLayers(unitSymbol, ctx);
    let pins = ""
    
    const defaultOffset = 0.508;
    const offset = unitSymbol.pin_names?.offset ?? rootSymbol.pin_names?.offset ?? defaultOffset
    const hideNames = unitSymbol.pin_names?.hide ?? rootSymbol.pin_names?.hide ?? false
    const hideNumbers = unitSymbol.pin_numbers?.hide ?? rootSymbol.pin_numbers?.hide ?? false

    unitSymbol.$pin?.forEach(pin => {
        if (!pin.hide) pins += getPinSVG(pin, offset, hideNames, hideNumbers, ctx) + "\n"
    })
    
    return [fg, bg, text, pins];
}