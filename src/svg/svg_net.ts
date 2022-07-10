import { Net } from "../kicad/net"
import { indent, sanitizeForCSS } from "../util/string_util"
import { SVGContext } from "./svg_context"
import { createLine } from "./svg_primitives"

export function getNetSVG(net: Net, ctx: SVGContext): string {
    let netCtx = ctx.withClasses(ctx.configuration.classes.WIRE)
    let svg = ""
    net.segments.forEach(segment => {
        //Wires only have fg
        const [fg, _] = createLine(segment.wire, netCtx)
        svg += fg + "\n"
    })
    net.junctions.forEach(junction => {
        const diameter = junction.junction.diameter ?? 0
        const center = ctx.point(junction.position)
        //Note: inside the svg viewbox px = mm
        const radius = diameter === 0 ? `var(${ctx.configuration.styleVars.DEFAULT_JUNCTION_RADIUS}, 0.508px)` : ctx.length(diameter*0.5)
        ctx.bounds.update(center)
        svg += `<circle ${netCtx.class()} cx="${center.x}" cy="${center.y}" r="${radius}" fill="var(${ctx.configuration.styleVars.DEFAULT_FILL_COLOR}, black)"/>\n`
    })
    const classes = net.name ? [sanitizeForCSS(net.name)] : []
    classes.push(...(ctx.configuration.callbacks.NET_CLASSES?.(net) ?? []))
    const attributes = ctx.configuration.callbacks.NET_ATTRIBUTES?.(net) ?? ""
    return `<g ${netCtx.class(...classes)} ${attributes}>\n${indent(svg)}\n</g>`
}