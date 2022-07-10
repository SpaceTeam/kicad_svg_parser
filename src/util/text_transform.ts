import * as kicad from "../kicad/kicad_types"
import {normalizeAngle, Point, toDeg, toRad, Transform} from "./geom"

//Get anchor direction based on kicad justification flags and text rotation
//The returned direction points from the text towards the side the text is on
//The justification is assumed to be in the text coordinate system (i.e. the local coordinate system of the text, rotated by textAngle)
//The result vector is output in the local coordinate system of the text (NOT the text coordinate system the justification flags are relative to)
export function calculateAnchorDirection(textAngle: number, flags: Array<kicad.JustifyFlag> | undefined, angleSign: number): Point {
    let x = 0;
    let y = 0;
    flags?.forEach(flag => {
        switch(flag) {
            case "left": x = 1; break;
            case "right": x = -1; break;
            case "top": y = -angleSign; break;
            case "bottom": y = angleSign; break;
        }
    })
    let dir = new Point(x, y)
    if (textAngle > 45 && textAngle < 135) {
        dir = Transform.rotate(toRad(textAngle)*angleSign).transform(dir)
    }
    return dir
}

//Calculate correct svg justification flags based on text angle, and anchor direction vector
//textAngle is the angle the text should be displayed at (SVG coordinate system!),
//anchorDirection is the side of the anchor the text is displayed at (in SVG coordinate system!)
export function calculateJustification(textAngle: number, anchorDirection: Point): string {
    let horizontal = "middle"
    let vertical = "middle"

    const epsilon = 1e-12;
    if (Math.abs(anchorDirection.x) > epsilon || Math.abs(anchorDirection.y) > epsilon) {
        //Justification vector angle in [0, 360°) range, relative to rotated text
        const angle = normalizeAngle(toDeg(anchorDirection.angle()) - textAngle, 360)
        if(angle >= 22.5 && angle < 157.5) {
            vertical = "hanging"
        } else if (angle >= 202.5 && angle < 337.5) {
            vertical = "baseline"
        }
        if (angle < 67.7 || angle > 292.5) {
            horizontal = "start"
        } else if (angle >= 112.5 && angle <= 247.5) {
            horizontal = "end"
        }
    }
    
    return `text-anchor="${horizontal}" dominant-baseline="${vertical}"`
}

export function getGlobalAnchorDirection(localTextAngle: number, flags: Array<kicad.JustifyFlag> | undefined, transform: Transform, angleSign: number) {
    //Ensure [0, 180) range
    const localTextAngleNormalized = normalizeAngle(localTextAngle, 180)
    const localAnchorDirection = calculateAnchorDirection(localTextAngleNormalized, flags, angleSign)
    const globalAnchorDirection = transform.transformDirection(localAnchorDirection);
    return globalAnchorDirection
}

//call with 
//localTextAngle = p.angle*this.textAngleMultiplier
//angleSign = angleSign (NOT effectiveAngleSign)
//transform = this.transform

export function getTransformedJustifyFlags(localTextAngle: number, flags: Array<kicad.JustifyFlag> | undefined, transform: Transform, angleSign: number): string {
    
    const globalAnchorDirection = getGlobalAnchorDirection(localTextAngle, flags, transform, angleSign)

    const globalTextAngle = angleSign * transform.angleDirection() * localTextAngle + toDeg(transform.getRotation())
    //Get angle of svg text element, always in range [0, -180)
    const globalTextAngleNormalized = normalizeAngle(globalTextAngle, -180)
    const justification = calculateJustification(globalTextAngleNormalized, globalAnchorDirection)

    //DEBUG
    //const angle = (toDeg(globalAnchorDirection.angle()) % 360 + 360) % 360;
    //console.log("Just. Vec: ", globalAnchorDirection, " A=", angle.toFixed(1))
    //console.log("Just: ", justification)

    return justification
}