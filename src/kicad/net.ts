import { SchematicCoordinateSystem } from "../util/coordinate_system";
import { Point, Transform } from "../util/geom";
import * as kicad from "./kicad_types"
import { SymbolIdx } from "./symbol_idx";

const POSITION_EPSILON = 1e-9

function point(p: kicad.Point) {
    return new Point(p.x, p.y)
}

export class NetConnection {
    net: Net = new Net("")
    readonly position: Point
    readonly pin: kicad.Pin
    readonly symbol: kicad.Symbol

    constructor(pin: kicad.Pin, symbol: kicad.Symbol, symbolCs: SchematicCoordinateSystem) {
        this.position = symbolCs.point(pin.at)
        this.pin = pin
        this.symbol = symbol
    }
}

export class NetSegment {
    net: Net
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
        this.net = new Net(this.wire.uuid, this)
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
    net: Net
    readonly junction: kicad.Junction
    readonly position: Point

    constructor(junction: kicad.Junction) {
        this.junction = junction
        this.position = point(junction.at)
        this.net = new Net("")
    }
}

export class Net {
    //Internal id
    uuid: string
    name: string | undefined
    segments: NetSegment[]
    junctions: NetJunction[] = []
    connections: NetConnection[] = []

    constructor(uuid: string, ...segments: NetSegment[]) {
        this.segments = segments
        this.segments.forEach(s => s.net = this)
        this.uuid = uuid
    }

    merge(net: Net) {
        if (this !== net) {
            this.addSegments(...net.segments)
            this.addJunctions(...net.junctions)
            this.addConnections(...net.connections)
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

    addConnections(...connections: NetConnection[]) {
        this.connections.push(...connections)
        connections.forEach(connection => connection.net = this)
    }

}

export function getNets(schematic: kicad.Schematic, symbolIdx: SymbolIdx): Net[] {
    const wires = schematic.$wire
    const labels = schematic.$label
    const junctions = schematic.$junction
    const symbols = schematic.$symbol

    const rootCs = new SchematicCoordinateSystem()
    rootCs.angleSign = -1; //Schematic has reversed angle direction!

    if (wires) {
        const segments = wires.map(wire => new NetSegment(wire))
        let netJunctions = junctions?.map(junction => new NetJunction(junction))
        let netConnections = symbols?.flatMap(symbol => {
            const symbolCs = rootCs.child(Transform.MIRROR_X.multiply(rootCs.getTransform(symbol.at, symbol.mirror)))
            symbolCs.angleSign = 1
            return symbolIdx.getSymbols(symbol).flatMap(libSymbol => {
                return libSymbol.$pin?.map(pin => new NetConnection(pin, symbol, symbolCs)) ?? []
            })
        })
        const nets: Net[] = []
        segments.forEach(segment => {
            labels?.forEach(label => {
                if (segment.containsPoint(point(label.at))) {
                    segment.net.name = label.text
                }
            })

            netJunctions = netJunctions?.filter(junction => {
                if (segment.containsPoint(junction.position)) {
                    segment.net.addJunctions(junction)
                    return false // Remove processed junction
                }
                return true
            })

            netConnections = netConnections?.filter(connection => {
                if (segment.containsPoint(connection.position)) {
                    segment.net.addConnections(connection)
                    return false // Remove processed connection
                }
                return true
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