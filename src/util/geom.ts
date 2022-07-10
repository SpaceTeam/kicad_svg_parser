export class Point {
    x: number;
    y: number;

    constructor(x?: number, y?: number) {
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }

    add(p: Point): Point {
        return new Point(this.x + p.x, this.y + p.y)
    }

    subtract(p: Point): Point {
        return new Point(this.x - p.x, this.y - p.y)
    }

    multiply(factor: number): Point {
        return new Point(this.x * factor, this.y * factor)
    }

    angle(): number {
        return Math.atan2(this.y, this.x)
    }

    length(): number {
        return Math.sqrt(this.x*this.x + this.y*this.y)
    }

    dotProduct(p: Point): number {
        return this.x*p.x + this.y*p.y;
    }

    normal(): Point {
        return new Point(-this.y, this.x)
    }
}

export class Transform {
    static IDENTITY = new Transform([[1, 0, 0], [0, 1, 0]])
    static MIRROR_X = Transform.scale(1, -1)
    static MIRROR_Y = Transform.scale(-1, 1)


    // Matrix
    // |a b c|
    // |d e f|
    // |0 0 1|
    
    // Identity Matrix
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    constructor(v: [[number, number, number], [number, number, number]]) {
        this.a = v[0][0]
        this.b = v[0][1]
        this.c = v[0][2]
        this.d = v[1][0]
        this.e = v[1][1]
        this.f = v[1][2]
    }

    static translate(tX: number, tY: number) {
        return new Transform([
            [1, 0, tX],
            [0, 1, tY]
        ])
    }

    static scale(scaleX: number, scaleY: number): Transform {
        return new Transform([
            [scaleX, 0, 0],
            [0, scaleY, 0]
        ])
    }

    static rotate(angle: number): Transform {
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return new Transform([
            [c, -s, 0],
            [s,  c, 0]
        ])
    }

    //Executes the given transform after this transform
    multiply(t: Transform): Transform {
        // Right Multiply!
        // other M   this M
        // |a b c|   |a b c|
        // |d e f| * |d e f|
        // |0 0 1|   |0 0 1|
        return new Transform([
            [t.a*this.a + t.b*this.d, t.a*this.b + t.b*this.e, t.a*this.c+t.b*this.f+t.c],
            [t.d*this.a + t.e*this.d, t.d*this.b + t.e*this.e, t.d*this.c+t.e*this.f+t.f]
        ])
    }

    transform(p: Point): Point {
        // Matrix   Vector
        // |a b c|   |x|
        // |d e f| * |y|
        // |0 0 1|   |1|
        return new Point(
            this.a*p.x + this.b*p.y + this.c,
            this.d*p.x + this.e*p.y + this.f
        )
    }

    transformDirection(p: Point): Point {
        return new Point(
            this.a*p.x + this.b*p.y,
            this.d*p.x + this.e*p.y
        )
    }

    getRotation(): number {
        // transform (0, 0) -> (c, f)
        // transform (1, 0) -> (a+c, d+f)
        // new direction = (a+c, d+f) - (c, f) = (a, d)
        // angle of direction = atan(y/x) = atan(d/a)
        // transform (0, 1) -> (b+c, e+f)
        // new direction = (b, e) -> rotate by 90 degrees clockwise -> (e, -b)
        // angle of direction = atan(-b, e)
        return Math.atan2(this.d, this.a);
    }

    angleDirection(): -1 | 1 {
        return this.a * this.e < 0 ? -1 : 1;
    }
}

export class Bounds {
    xMin = +Infinity;
    yMin = +Infinity;
    xMax = -Infinity;
    yMax = -Infinity;


    constructor(b?: Bounds) {
        if(b) {
            this.xMin = b.xMin;
            this.xMax = b.xMax;
            this.yMin = b.yMin;
            this.yMax = b.yMax;
        }
    }

    update(p: Point) {
        this.xMin = Math.min(this.xMin, p.x)
        this.yMin = Math.min(this.yMin, p.y)
        this.xMax = Math.max(this.xMax, p.x)
        this.yMax = Math.max(this.yMax, p.y)
    }

    translate(p: Point) {
        this.xMin += p.x;
        this.xMax += p.x;
        this.yMin += p.y;
        this.yMax += p.y; 
    }

    merge(b: Bounds) {
        this.xMin = Math.min(this.xMin, b.xMin)
        this.yMin = Math.min(this.yMin, b.yMin)
        this.xMax = Math.max(this.xMax, b.xMax)
        this.yMax = Math.max(this.yMax, b.yMax)
    }

    pad(padding: number) {
        this.xMin -= padding;
        this.yMin -= padding;
        this.xMax += padding;
        this.yMax += padding;
    }

    toViewBox(): string {
        const x = this.xMin;
        const y = this.yMin;
        const w = this.xMax - this.xMin;
        const h = this.yMax - this.yMin;
        return `${x} ${y} ${w} ${h}`
    }
}

export function toDeg(radians: number) {
    return radians / Math.PI * 180;
}

export function toRad(degrees: number) {
    return degrees * Math.PI / 180;
}

export function normalizeAngle(angle: number, max: number) {
    const mod = Math.abs(max)
    return (angle%mod + max) % mod
}