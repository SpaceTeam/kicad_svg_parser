import * as kicad from "../kicad/kicad_types"
import { SVGContext } from "./svg_context";
import { SymbolIdx } from "../kicad/symbol_idx";
import { getGraphicalSectionSVG, getContextDebugSVG } from "./svg_primitives";
import { getNetsFromSchematic } from "../kicad/net";
import { indent } from "../util/string_util";
import { getSymbolSVG } from "./svg_symbol";
import { getNetSVG } from "./svg_net";
import { SVGClasses, SVGConfiguration, SVGDebugSettings, SVGStyleVars } from "./svg_api";


export const DEFAULT_SVG_CLASSES: SVGClasses = {
    DIAGRAM: "pnid-diagram",
    SYMBOL: "pnid-symbol",
    WIRE: "pnid-wire",
    GRAPHICS: "pnid-graphics",
    SYMBOL_GRAPHICS: "pnid-symbol-graphics",
    PROPERTY: "pnid-property",
    PIN: "pnid-pin",
    PIN_NUMBER: "pnid-pin-number",
    PIN_NAME: "pnid-pin-name",
    BOUNDS: "pnid-bounds"
}

export const DEFAULT_SVG_STYLEVARS: SVGStyleVars = {
    DEFAULT_STROKE_WIDTH: "--pnid-default-stroke-width",
    DEFAULT_STROKE_COLOR: "--pnid-default-stroke-color",
    DEFAULT_FILL_COLOR: "--pnid-default-fill-color",
    DEFAULT_STROKE_STYLE: "--pnid-default-stroke-style",
    DEFAULT_JUNCTION_RADIUS: "--pnid-default-junction-radius"
}

export const DEFAULT_SVG_DEBUG_SETTINGS: SVGDebugSettings = {
    DEBUG_CS_SCHEMATIC: false,
    DEBUG_TEXT_ANCHOR: false
}

const DEFAULT_CONFIGURAITON: SVGConfiguration = {
    classes: DEFAULT_SVG_CLASSES,
    styleVars: DEFAULT_SVG_STYLEVARS,
    callbacks: {},
    createHiddenTexts: true,
    createBounds: true,
    debug: DEFAULT_SVG_DEBUG_SETTINGS
}

export class SVGGenerator {
    configuration: SVGConfiguration

    constructor(configuration?: SVGConfiguration) {
        this.configuration = configuration ?? DEFAULT_CONFIGURAITON
    }
    
    generateSVG(schematic: kicad.Schematic): string {
        const ctx = new SVGContext(this.configuration);
        ctx.angleSign = -1; //Schematic has reversed angle direction!
    
        let symbolIdx = new SymbolIdx()
        symbolIdx.addLibrary(schematic.lib_symbols)
    
        let svg = ""
    
        //DEBUG
        if(ctx.configuration.debug.DEBUG_CS_SCHEMATIC) svg += getContextDebugSVG(ctx);
    
        schematic.$symbol?.forEach(symbol => {
            svg += getSymbolSVG(symbol, symbolIdx, ctx) + "\n";
        })
        svg += "<!-- graphics -->\n"
        svg += getGraphicalSectionSVG(schematic, ctx);
    
        svg += "<!-- wires -->\n"
        const nets = getNetsFromSchematic(schematic)
        nets.forEach(net => {
            svg += getNetSVG(net, ctx) + "\n"
        })
    
        svg = `<g>\n${indent(svg)}\n</g>`
        ctx.bounds.pad(10)
        return `<svg class="${ctx.configuration.classes.DIAGRAM}" viewBox="${ctx.bounds.toViewBox()}">\n${indent(svg)}\n</svg>`;
    }

    generateKicadStyleCSS() {
        
        //Note: inside svg viewbox 1px == 1mm
        function dashArray(baseLine: string, ...values: number[]) {
            return values.map(v => `calc(${baseLine} * ${v})`).join(",")
        }

        const styleVars = this.configuration.styleVars
        const classes = this.configuration.classes
        return ""+
`
.${classes.DIAGRAM} {width: 1000px;}
text {font-family: "Montserrat", "Monospace"}
svg {
    ${styleVars.DEFAULT_STROKE_COLOR}: blue;
    ${styleVars.DEFAULT_STROKE_WIDTH}: 0.1524px;
    ${styleVars.DEFAULT_JUNCTION_RADIUS}: 0.508px;
    ${styleVars.DEFAULT_STROKE_STYLE}: ${dashArray(`var(${styleVars.DEFAULT_STROKE_WIDTH})`, 12, 8)}
}
.${classes.SYMBOL} {
    ${styleVars.DEFAULT_STROKE_COLOR}: maroon;
    ${styleVars.DEFAULT_FILL_COLOR}: lightyellow;
    ${styleVars.DEFAULT_STROKE_STYLE}: none;
}
.${classes.WIRE} {
    ${styleVars.DEFAULT_STROKE_COLOR}: green;
    ${styleVars.DEFAULT_FILL_COLOR}: green;
    ${styleVars.DEFAULT_STROKE_STYLE}: none;
}
.${classes.PROPERTY} {fill: darkcyan }
.${classes.PIN_NUMBER} {fill: maroon }
.${classes.PIN_NAME} {fill: darkcyan }
`
    }

    generateKicadStyleHTML(schematic: kicad.Schematic) {
        const svg = this.generateSVG(schematic);
        const css = this.generateKicadStyleCSS()
        return ""+
`<!DOCTYPE html>
<html>
    <head>
        <style>
${indent(indent(indent(css)))}
        </style>
    </head>
    <body>
${indent(indent(svg))}
    </body>
</html>
`
    }
}

