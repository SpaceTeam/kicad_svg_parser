import * as kicad from "../kicad/kicad_types"

const defaultStroke: kicad.Stroke = {
    width: 0,
    type: "default",
    color: {r: 0, g: 0, b: 0, a: 0}
}

const defaultFill: kicad.Fill = {
    type: "none"
}

function createLine(pts: Array<kicad.Point>): kicad.PolyLine {
    return  {
        pts: pts,
        stroke: defaultStroke,
        fill: defaultFill
    }
}

export class PinStyle {
    lineClearance: number
    graphics: kicad.GraphicalSection


    constructor(lineClearance: number, graphics: kicad.GraphicalSection) {
        this.lineClearance = lineClearance
        this.graphics = graphics
    }

    private getGraphics(pin: kicad.Pin): kicad.GraphicalSection {
        const graphics = {
            ...this.graphics
        }
        if (pin.length > this.lineClearance) {
            const lines: Array<kicad.PolyLine> = [createLine([{x: -pin.length, y: 0}, {x: -this.lineClearance, y: 0}])]
            lines.push(...(this.graphics.$polyline ?? []))
            graphics.$polyline = lines
        }
        return graphics
    }

    static getPinGraphics(pin: kicad.Pin): kicad.GraphicalSection {
        const style = PIN_STYLES[pin.graphicStyle] ?? FALLBACK_PIN_STYLE
        return style.getGraphics(pin)
    }
}

const MIL_5 = 2.54 / 2
const MIL_2_5 = MIL_5 / 2

const PIN_STYLES = {
    "line": new PinStyle(0, {}),
    "inverted": new PinStyle(MIL_5, {
        $circle: [
            {center: {x: -MIL_2_5, y: 0}, radius: MIL_2_5, stroke: defaultStroke, fill: defaultFill}
        ]
    }),
    "clock": undefined,
    "inverted_clock": undefined,
    "input_low": undefined,
    "clock_low": undefined,
    "output_low": undefined,
    "edge_clock_high": undefined,
    "non_logic": new PinStyle(0, {
        $polyline: [
            createLine([{x: -MIL_2_5, y: -MIL_5}, {x: +MIL_2_5, y: +MIL_2_5}]),
            createLine([{x: -MIL_2_5, y: +MIL_5}, {x: +MIL_2_5, y: -MIL_2_5}])
        ]
    })
}

const FALLBACK_PIN_STYLE = PIN_STYLES.line