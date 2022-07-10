import { Point } from "../util/geom";
import * as kicad from "./kicad_types"

const POSITION_EPSILON = 1e-9

function point(p: kicad.Point) {
    return new Point(p.x, p.y)
}

export class NetSegment {
    net: Net = new Net(this)
    readonly wire: kicad.Wire
    readonly start: Point
    readonly end: Point

    private readonly length: number
    private readonly dir: Point
    private readonly normal: Point

    constructor(wire: kicad.Wire) {
        this.wire = wire
        this.start = point(wire.pts[0])
        this.end = point(wire.pts[1])
        const diff = this.end.subtract(this.start)
        this.length = diff.length()
        this.dir = diff.multiply(1/this.length)
        this.normal = this.dir.normal()
    }

    containsPoint(p: Point): boolean {
        const dirP = p.subtract(this.start)
        const t = dirP.dotProduct(this.dir) / this.length
        const q = dirP.dotProduct(this.normal)
        return (t >= -POSITION_EPSILON && t <= 1+POSITION_EPSILON && Math.abs(q) <= POSITION_EPSILON)
    }

    connectedTo(segment: NetSegment): boolean {
        return this.containsPoint(segment.start) || this.containsPoint(segment.end)
    }

}

export class NetJunction {
    net: Net = new Net()
    readonly junction: kicad.Junction
    readonly position: Point

    constructor(junction: kicad.Junction) {
        this.junction = junction
        this.position = point(junction.at)
    }
}

export class Net {
    //Internal id
    name: string | undefined
    segments: NetSegment[]
    junctions: NetJunction[] = []

    constructor(...segments: NetSegment[]) {
        this.segments = segments
        this.segments.forEach(s => s.net = this)
    }

    merge(net: Net) {
        if (this !== net) {
            this.addSegments(...net.segments)
            if (!this.name) this.name = net.name
        }
    }

    addSegments(...segments: NetSegment[]) {
        this.segments.push(...segments)
        segments.forEach(segment => segment.net = this)
    }

    addJunctions(...junctions: NetJunction[]) {
        this.junctions.push(...junctions)
        junctions.forEach(junction => junction.net = this)
    }

}

export function getNetsFromSchematic(schematic: kicad.Schematic): Net[] {
    return getNets(schematic.$wire, schematic.$label, schematic.$junction)
}

export function getNets(wires?: kicad.Wire[], labels?: kicad.Label[], junctions?: kicad.Junction[]): Net[] {
    if (wires) {
        const segments = wires.map(wire => new NetSegment(wire))
        const netJunctions = junctions?.map(junction => new NetJunction(junction))
        const nets: Net[] = []
        segments.forEach(segment => {
            labels?.forEach(label => {
                if (segment.containsPoint(point(label.at))) {
                    segment.net.name = label.text
                }
            })
            netJunctions?.forEach(junction => {
                if (segment.containsPoint(junction.position)) {
                    segment.net.addJunctions(junction)
                }
            })
            segments.forEach(otherSegment => {
                if (segment.connectedTo(otherSegment)) {
                    //Merge nets
                    segment.net.merge(otherSegment.net)
                }
            })
        })
        segments.forEach(segment => {
            const sameNet = nets.find(net => net == segment.net || (net.name !== undefined && net.name === segment.net.name))
            if (sameNet !== undefined) {
                sameNet.merge(segment.net)
            } else {
                nets.push(segment.net)
            }
            if (!nets.includes(segment.net)) nets.push(segment.net)
        })
        return nets
    } else {
        return []
    }
}