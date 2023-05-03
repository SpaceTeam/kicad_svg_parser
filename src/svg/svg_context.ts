import * as kicad from "../kicad/kicad_types"
import { Point, Transform, Bounds, toRad, toDeg, normalizeAngle } from "../util/geom"
import { SchematicCoordinateSystem } from "../util/coordinate_system"
import { SVGConfiguration } from "./svg_api"

export class SVGContext {
    parent?: SVGContext
    configuration: SVGConfiguration

    cs: SchematicCoordinateSystem
    bounds: Bounds = new Bounds()
    classes: Set<string> = new Set()

    constructor(configuration: SVGConfiguration, cs?: SchematicCoordinateSystem) {
        this.configuration = configuration
        this.cs = cs ?? new SchematicCoordinateSystem()
    }

    child(transform?: Transform, automergeBounds?: boolean) {
        let cs = this.cs.child(transform)
        let ctx = new SVGContext(this.configuration, cs)
        ctx.parent = this
        ctx.classes = new Set(this.classes)
        if ((automergeBounds??true)) ctx.bounds = this.bounds
        return ctx
    }

    withClasses(...classes: string[]) {
        let ctx = this.child()
        classes.forEach(c => ctx.classes.add(c))
        return ctx
    }

    rootCtx(): SVGContext {
        let ctx: SVGContext = this
        while (ctx.parent) ctx = ctx.parent
        return ctx
    }

    class(...additional: string[]) {
        const result = new Set(this.classes)
        additional.forEach(c => result.add(c))
        let classStr = ""
        result.forEach(c => classStr += c + " ")
        return `class="${classStr.trim()}"`
    }

    point(p: kicad.Point) {
        return this.cs.point(p)
    }

    angle(angle: number): number {
        return this.cs.angle(angle)
    }

    textAngle(angle: number): number {
        return this.cs.textAngle(angle)
    }

    textJustify(p: kicad.Position, flags?: Array<kicad.JustifyFlag>): string {
        return this.cs.textJustify(p, flags)
    }

    length(l: number): number {
        return this.cs.length(l)
    }

    getTransform(pos: kicad.Position, mirror: kicad.Mirror): Transform {
        return this.cs.getTransform(pos, mirror)
    }

}