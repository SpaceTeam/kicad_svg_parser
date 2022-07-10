import * as kicad from "../kicad/kicad_types"
import { createText, getContextDebugSVG, getGraphicalSectionSVG } from "./svg_primitives"
import { normalizeAngle, Transform } from "../util/geom"
import { PinStyle } from "./svg_pin_style"
import { SVGContext } from "./svg_context"

const DEBUG_CS_PIN = false
const DEBUG_CS_PIN_LIST = ["3", "6"]

export function getPinSVG(pin: kicad.Pin, nameOffset: number, hideNames: boolean, hideNumbers: boolean, ctx: SVGContext): string {
    const pinCtx = ctx.child(ctx.getTransform(pin.at, undefined)).withClasses(ctx.configuration.classes.PIN)

    //Pin style    
    const graphics = PinStyle.getPinGraphics(pin)
    const graphicsCtx = pinCtx.child(Transform.translate(pin.length, 0))
    let svg = getGraphicalSectionSVG(graphics, graphicsCtx)

    //DEBUG
    if (DEBUG_CS_PIN && DEBUG_CS_PIN_LIST.includes(pin.number.text)) svg += getContextDebugSVG(pinCtx)

    //Pin Names & Numbers
    if(!hideNames && pin.name.text !== "~") svg += createPinNameText(pin, nameOffset, pinCtx) + "\n";
    if(!hideNumbers && pin.number.text !== "~") svg += createPinNumberText(pin, pinCtx) + "\n";
    

    ctx.bounds.merge(graphicsCtx.bounds)
    ctx.bounds.merge(pinCtx.bounds)

    return svg
}

function createPinNameText(pin: kicad.Pin, nameOffset: number, ctx: SVGContext) {
    const text: kicad.PositionedText = {
        ...pin.name,
        at: {x: pin.length+nameOffset, y: 0, angle: 0}
    }

    if(!text.effects) {
        text.effects = {
            font: {
                size: {width: 1.27, height: 1.27}
            },
            hide: false
        }
    }
    if(!text.effects.justify) {
        text.effects.justify = ["left"]
    }

    return createText(text, ctx.withClasses(ctx.configuration.classes.PIN_NAME));
}

function createPinNumberText(pin: kicad.Pin, ctx: SVGContext) {
    const numberVerticalOffset = 0.254;

    const rootCtx = ctx.rootCtx()

    //Bring into [0, -360) range
    const effectivePinAngle = normalizeAngle(ctx.angle(0), -360)
    const pinNumberAngle = normalizeAngle(effectivePinAngle, 180)*rootCtx.effectiveAngleSign/rootCtx.textAngleMultiplier
    //If the pin should be under / below the pin in the coordinate system
    const flip = effectivePinAngle <= -179
    const offset = (flip ? 1 : -1) * ctx.transform.angleDirection() * numberVerticalOffset

    const text: kicad.PositionedText = {
        ...pin.number,
        at: {x: pin.length/2, y: offset, angle: pinNumberAngle}
    }

    if(!text.effects) {
        text.effects = {
            font: {
                size: {width: 1.27, height: 1.27}
            },
            hide: false
        }
    }
    if(!text.effects.justify) {
        text.effects.justify = [ "bottom" ]
    }

    return createText(text, ctx.withClasses(ctx.configuration.classes.PIN_NUMBER), ctx.rootCtx());
}