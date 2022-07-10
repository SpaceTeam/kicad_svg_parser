import * as kicad from "../kicad/kicad_types"
import { Point, Transform, Bounds, toRad, toDeg, normalizeAngle } from "../util/geom"
import * as text from "../util/text_transform"
import { SVGConfiguration } from "./svg_api"

export class SVGContext {
    parent?: SVGContext
    configuration: SVGConfiguration

    bounds: Bounds = new Bounds()
    classes: Set<string> = new Set()

    private _transform: Transform = Transform.IDENTITY
    public get transform(): Transform {
        return this._transform
    }
    public set transform(value: Transform) {
        this._transform = value
        this.updateTransforms()
    }
    private _textAngleMultiplier: number = 1
    public get textAngleMultiplier(): number {
        return this._textAngleMultiplier
    }
    public set textAngleMultiplier(value: number) {
        this._textAngleMultiplier = value
    }
    private _angleSign: 1 | -1 = 1
    public get angleSign(): 1 | -1 {
        return this._angleSign
    }
    public set angleSign(value: 1 | -1) {
        this._angleSign = value
        this.updateTransforms()
    }

    effectiveAngleSign: number = 0
    effectiveAngleOffset: number = 0

    constructor(configuration: SVGConfiguration, transform?: Transform) {
        this.configuration = configuration
        this.transform = transform ?? Transform.IDENTITY
    }

    child(transform?: Transform, automergeBounds?: boolean) {
        let ctx = new SVGContext(this.configuration, transform ? transform.multiply(this.transform) : this.transform)
        ctx.parent = this
        ctx.angleSign = this.angleSign
        ctx.textAngleMultiplier = this.textAngleMultiplier
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

    private updateTransforms() {
        this.effectiveAngleSign = this.transform.angleDirection() * this.angleSign
        this.effectiveAngleOffset = toDeg(this.transform.getRotation())
    }    

    point(p: kicad.Point): Point {
        return this.transform.transform(new Point(p.x, p.y))
    }

    private angleHelper(angle: number) {
        //SVG counts positive angle clockwise, Kicad counterclockwise
        return this.effectiveAngleSign * angle + this.effectiveAngleOffset
    }

    class(...additional: string[]) {
        const result = new Set(this.classes)
        additional.forEach(c => result.add(c))
        let classStr = ""
        result.forEach(c => classStr += c + " ")
        return `class="${classStr.trim()}"`
    }

    angle(angle: number): number {
        return this.angleHelper(angle)
    }

    textAngle(angle: number): number {
        //Angle of svg text element, always in range [0, -180)
        return normalizeAngle(this.angleHelper(angle*this.textAngleMultiplier), -180)
    }

    //Returns justification flags, ajusted based on the context transform
    textJustify(p: kicad.Position, flags?: Array<kicad.JustifyFlag>): string {
        return text.getTransformedJustifyFlags(p.angle*this.textAngleMultiplier, flags, this.transform, this.angleSign)
    }

    length(l: number): number {
        return l
    }

    getTransform(pos: kicad.Position, mirror: kicad.Mirror): Transform {
        let t = Transform.rotate(toRad(this.angleSign * pos.angle))
        if (mirror === "x") {
            t = t.multiply(Transform.MIRROR_X)
        }
        if (mirror === "y") {
            t = t.multiply(Transform.MIRROR_Y)
        }
        return t.multiply(Transform.translate(pos.x, pos.y))
    }


}