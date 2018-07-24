"use strict";
/*
 * Poly2Tri Copyright (c) 2009-2010, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
class _std_sequence_container {
    constructor(array = []) {
        this.array = array;
    }
    clone() { return new std_vector(this.array.slice(0)); }
    at(index) { return this.array[index]; }
    size() { return this.array.length; }
    empty() { return this.array.length === 0; }
    clear() { this.array.length = 0; }
    front() { return this.array[0]; }
    back() { return this.array[this.array.length - 1]; }
    push_front(value) { this.array.unshift(value); }
    pop_front() { this.array.shift(); }
    push_back(value) { this.array.push(value); }
    pop_back() { this.array.pop(); }
    sort(cmp) { this.array.sort(cmp); }
    insert(index, ...values) {
        this.array.splice(index, 0, ...values);
        return index;
    }
    remove(value) {
        const index = this.array.indexOf(value);
        if (index !== -1) {
            this.array.splice(index, 1);
        }
    }
}
exports._std_sequence_container = _std_sequence_container;
class std_vector extends _std_sequence_container {
}
exports.std_vector = std_vector;
class std_list extends _std_sequence_container {
}
exports.std_list = std_list;
class Point {
    /// Default constructor does nothing (for performance).
    /// Construct using coordinates.
    constructor(x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
        /// The edges this point constitutes an upper ending point
        this.edge_list = new std_vector();
    }
    /// Set this point to all zeros.
    set_zero() {
        this.x = 0.0;
        this.y = 0.0;
    }
    /// Set this point to some specified coordinates.
    set(x_, y_) {
        this.x = x_;
        this.y = y_;
    }
    equals(other) {
        return this === other || this.x === other.x && this.y === other.y;
    }
    /// Negate this point.
    // Point operator -() const
    // {
    //   Point v;
    //   v.set(-x, -y);
    //   return v;
    // }
    /// Add a point to this point.
    // void operator +=(const Point& v)
    // {
    //   x += v.x;
    //   y += v.y;
    // }
    /// Subtract a point from this point.
    // void operator -=(const Point& v)
    // {
    //   x -= v.x;
    //   y -= v.y;
    // }
    /// Multiply this point by a scalar.
    // void operator *=(double a)
    // {
    //   x *= a;
    //   y *= a;
    // }
    /// Get the length of this point (the norm).
    Length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /// Convert this point into a unit point. Returns the Length.
    Normalize() {
        const len = this.Length();
        this.x /= len;
        this.y /= len;
        return len;
    }
}
exports.Point = Point;
// Represents a simple polygon's edge
class Edge {
    /// Constructor
    constructor(p1, p2) {
        this.p = p1;
        this.q = p2;
        if (p1.y > p2.y) {
            this.q = p1;
            this.p = p2;
        }
        else if (p1.y === p2.y) {
            if (p1.x > p2.x) {
                this.q = p1;
                this.p = p2;
            }
            else if (p1.x === p2.x) {
                // Repeat points
                throw new Error("assert");
            }
        }
        this.q.edge_list.push_back(this);
    }
}
exports.Edge = Edge;
// Triangle-based data structures are know to have better performance than quad-edge structures
// See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and Delaunay Triangulator"
//      "Triangulations in CGAL"
class Triangle {
    /// Constructor
    constructor(a, b, c) {
        /// Flags to determine if an edge is a Constrained edge
        this.constrained_edge = [false, false, false];
        /// Flags to determine if an edge is a Delauney edge
        this.delaunay_edge = [false, false, false];
        /// Neighbor list
        this.neighbors_ = [null, null, null];
        /// Has this triangle been marked as an interior triangle?
        this.interior_ = false;
        this.points_ = [a, b, c];
    }
    // Point* GetPoint(const int& index);
    GetPoint(index) {
        return this.points_[index];
    }
    // Point* PointCW(Point& point);
    PointCW(point) {
        if (point.equals(this.points_[0])) {
            return this.points_[2];
        }
        else if (point.equals(this.points_[1])) {
            return this.points_[0];
        }
        else if (point.equals(this.points_[2])) {
            return this.points_[1];
        }
        throw new Error("assert");
    }
    // Point* PointCCW(Point& point);
    PointCCW(point) {
        if (point.equals(this.points_[0])) {
            return this.points_[1];
        }
        else if (point.equals(this.points_[1])) {
            return this.points_[2];
        }
        else if (point.equals(this.points_[2])) {
            return this.points_[0];
        }
        throw new Error("assert");
    }
    // Point* OppositePoint(Triangle& t, Point& p);
    OppositePoint(t, p) {
        // Point *cw = t.PointCW(p);
        // double x = cw.x;
        // double y = cw.y;
        // x = p.x;
        // y = p.y;
        // return PointCW(*cw);
        const cw = t.PointCW(p);
        // const x: number = cw.x;
        // const y: number = cw.y;
        // x = p.x;
        // y = p.y;
        return this.PointCW(cw);
    }
    // Triangle* GetNeighbor(const int& index);
    GetNeighbor(index) {
        return this.neighbors_[index];
    }
    MarkNeighbor(...args) {
        if (args.length === 3) {
            this.MarkNeighbor_A(args[0], args[1], args[2]);
        }
        else {
            this.MarkNeighbor_B(args[0]);
        }
    }
    MarkNeighbor_A(p1, p2, t) {
        if ((p1.equals(this.points_[2]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[2])))
            this.neighbors_[0] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[2])) || (p1.equals(this.points_[2]) && p2.equals(this.points_[0])))
            this.neighbors_[1] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[0])))
            this.neighbors_[2] = t;
        else
            throw new Error("assert");
    }
    MarkNeighbor_B(t) {
        if (t.Contains_C(this.points_[1], this.points_[2])) {
            this.neighbors_[0] = t;
            t.MarkNeighbor_A(this.points_[1], this.points_[2], this);
        }
        else if (t.Contains_C(this.points_[0], this.points_[2])) {
            this.neighbors_[1] = t;
            t.MarkNeighbor_A(this.points_[0], this.points_[2], this);
        }
        else if (t.Contains_C(this.points_[0], this.points_[1])) {
            this.neighbors_[2] = t;
            t.MarkNeighbor_A(this.points_[0], this.points_[1], this);
        }
    }
    MarkConstrainedEdge(...args) {
        if (args.length === 1) {
            if (typeof args[0] === "number") {
                this.MarkConstrainedEdge_A(args[0]);
            }
            else {
                this.MarkConstrainedEdge_B(args[0]);
            }
        }
        else {
            this.MarkConstrainedEdge_C(args[0], args[1]);
        }
    }
    MarkConstrainedEdge_A(index) {
        this.constrained_edge[index] = true;
    }
    MarkConstrainedEdge_B(edge) {
        this.MarkConstrainedEdge_C(edge.p, edge.q);
    }
    MarkConstrainedEdge_C(p, q) {
        if ((q.equals(this.points_[0]) && p.equals(this.points_[1])) || (q.equals(this.points_[1]) && p.equals(this.points_[0]))) {
            this.constrained_edge[2] = true;
        }
        else if ((q.equals(this.points_[0]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[0]))) {
            this.constrained_edge[1] = true;
        }
        else if ((q.equals(this.points_[1]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[1]))) {
            this.constrained_edge[0] = true;
        }
    }
    // int Index(const Point* p);
    Index(p) {
        if (p.equals(this.points_[0])) {
            return 0;
        }
        else if (p.equals(this.points_[1])) {
            return 1;
        }
        else if (p.equals(this.points_[2])) {
            return 2;
        }
        throw new Error("assert");
    }
    // int EdgeIndex(const Point* p1, const Point* p2);
    EdgeIndex(p1, p2) {
        if (this.points_[0] === p1) {
            if (this.points_[1] === p2) {
                return 2;
            }
            else if (this.points_[2] === p2) {
                return 1;
            }
        }
        else if (this.points_[1] === p1) {
            if (this.points_[2] === p2) {
                return 0;
            }
            else if (this.points_[0] === p2) {
                return 2;
            }
        }
        else if (this.points_[2] === p1) {
            if (this.points_[0] === p2) {
                return 1;
            }
            else if (this.points_[1] === p2) {
                return 0;
            }
        }
        return -1;
    }
    // Triangle* NeighborCW(Point& point);
    NeighborCW(point) {
        if (point.equals(this.points_[0])) {
            return this.neighbors_[1];
        }
        else if (point.equals(this.points_[1])) {
            return this.neighbors_[2];
        }
        return this.neighbors_[0];
    }
    // Triangle* NeighborCCW(Point& point);
    NeighborCCW(point) {
        if (point.equals(this.points_[0])) {
            return this.neighbors_[2];
        }
        else if (point.equals(this.points_[1])) {
            return this.neighbors_[0];
        }
        return this.neighbors_[1];
    }
    // bool GetConstrainedEdgeCCW(Point& p);
    GetConstrainedEdgeCCW(p) {
        if (p.equals(this.points_[0])) {
            return this.constrained_edge[2];
        }
        else if (p.equals(this.points_[1])) {
            return this.constrained_edge[0];
        }
        return this.constrained_edge[1];
    }
    // bool GetConstrainedEdgeCW(Point& p);
    GetConstrainedEdgeCW(p) {
        if (p.equals(this.points_[0])) {
            return this.constrained_edge[1];
        }
        else if (p.equals(this.points_[1])) {
            return this.constrained_edge[2];
        }
        return this.constrained_edge[0];
    }
    // void SetConstrainedEdgeCCW(Point& p, bool ce);
    SetConstrainedEdgeCCW(p, ce) {
        if (p.equals(this.points_[0])) {
            this.constrained_edge[2] = ce;
        }
        else if (p.equals(this.points_[1])) {
            this.constrained_edge[0] = ce;
        }
        else {
            this.constrained_edge[1] = ce;
        }
    }
    // void SetConstrainedEdgeCW(Point& p, bool ce);
    SetConstrainedEdgeCW(p, ce) {
        if (p.equals(this.points_[0])) {
            this.constrained_edge[1] = ce;
        }
        else if (p.equals(this.points_[1])) {
            this.constrained_edge[2] = ce;
        }
        else {
            this.constrained_edge[0] = ce;
        }
    }
    // bool GetDelunayEdgeCCW(Point& p);
    GetDelunayEdgeCCW(p) {
        if (p.equals(this.points_[0])) {
            return this.delaunay_edge[2];
        }
        else if (p.equals(this.points_[1])) {
            return this.delaunay_edge[0];
        }
        return this.delaunay_edge[1];
    }
    // bool GetDelunayEdgeCW(Point& p);
    GetDelunayEdgeCW(p) {
        if (p.equals(this.points_[0])) {
            return this.delaunay_edge[1];
        }
        else if (p.equals(this.points_[1])) {
            return this.delaunay_edge[2];
        }
        return this.delaunay_edge[0];
    }
    // void SetDelunayEdgeCCW(Point& p, bool e);
    SetDelunayEdgeCCW(p, e) {
        if (p.equals(this.points_[0])) {
            this.delaunay_edge[2] = e;
        }
        else if (p.equals(this.points_[1])) {
            this.delaunay_edge[0] = e;
        }
        else {
            this.delaunay_edge[1] = e;
        }
    }
    // void SetDelunayEdgeCW(Point& p, bool e);
    SetDelunayEdgeCW(p, e) {
        if (p.equals(this.points_[0])) {
            this.delaunay_edge[1] = e;
        }
        else if (p.equals(this.points_[1])) {
            this.delaunay_edge[2] = e;
        }
        else {
            this.delaunay_edge[0] = e;
        }
    }
    Contains(...args) {
        if (args.length === 1) {
            if (args[0] instanceof Point) {
                return this.Contains_A(args[0]);
            }
            else {
                return this.Contains_B(args[0]);
            }
        }
        else {
            return this.Contains_C(args[0], args[1]);
        }
    }
    Contains_A(p) {
        return p.equals(this.points_[0]) || p.equals(this.points_[1]) || p.equals(this.points_[2]);
    }
    Contains_B(e) {
        return this.Contains_A(e.p) && this.Contains_A(e.q);
    }
    Contains_C(p, q) {
        return this.Contains_A(p) && this.Contains_A(q);
    }
    Legalize(...args) {
        if (args.length === 1) {
            this.Legalize_A(args[0]);
        }
        else {
            this.Legalize_B(args[0], args[1]);
        }
    }
    // Legalized triangle by rotating clockwise around point(0)
    Legalize_A(point) {
        this.points_[1] = this.points_[0];
        this.points_[0] = this.points_[2];
        this.points_[2] = point;
    }
    // Legalize triagnle by rotating clockwise around oPoint
    Legalize_B(opoint, npoint) {
        if (opoint.equals(this.points_[0])) {
            this.points_[1] = this.points_[0];
            this.points_[0] = this.points_[2];
            this.points_[2] = npoint;
        }
        else if (opoint.equals(this.points_[1])) {
            this.points_[2] = this.points_[1];
            this.points_[1] = this.points_[0];
            this.points_[0] = npoint;
        }
        else if (opoint.equals(this.points_[2])) {
            this.points_[0] = this.points_[2];
            this.points_[2] = this.points_[1];
            this.points_[1] = npoint;
        }
        else {
            throw new Error("assert");
        }
    }
    /**
     * Clears all references to all other triangles and points
     */
    // void Clear();
    Clear() {
        for (let i = 0; i < 3; i++) {
            const t = this.neighbors_[i];
            if (t !== null) {
                t.ClearNeighbor(this);
            }
        }
        this.ClearNeighbors();
        // this.points_[0] = this.points_[1] = this.points_[2] = null;
    }
    // void ClearNeighbor(Triangle *triangle );
    ClearNeighbor(triangle) {
        if (this.neighbors_[0] === triangle) {
            this.neighbors_[0] = null;
        }
        else if (this.neighbors_[1] === triangle) {
            this.neighbors_[1] = null;
        }
        else {
            this.neighbors_[2] = null;
        }
    }
    // void ClearNeighbors();
    ClearNeighbors() {
        this.neighbors_[0] = null;
        this.neighbors_[1] = null;
        this.neighbors_[2] = null;
    }
    // void ClearDelunayEdges();
    ClearDelunayEdges() {
        this.delaunay_edge[0] = this.delaunay_edge[1] = this.delaunay_edge[2] = false;
    }
    IsInterior(b = this.interior_) { return this.interior_ = b; }
    // Triangle& NeighborAcross(Point& opoint);
    NeighborAcross(opoint) {
        if (opoint.equals(this.points_[0])) {
            return this.neighbors_[0];
        }
        else if (opoint.equals(this.points_[1])) {
            return this.neighbors_[1];
        }
        return this.neighbors_[2];
    }
    // void DebugPrint();
    DebugPrint() {
        // using namespace std;
        // cout << points_[0].x << "," << points_[0].y << " ";
        // cout << points_[1].x << "," << points_[1].y << " ";
        // cout << points_[2].x << "," << points_[2].y << endl;
        console.log(`${this.points_[0].x},${this.points_[0].y}`);
        console.log(`${this.points_[1].x},${this.points_[1].y}`);
        console.log(`${this.points_[2].x},${this.points_[2].y}`);
    }
}
exports.Triangle = Triangle;
function cmp(a, b) {
    if (a.y < b.y) {
        return -1;
    }
    else if (a.y === b.y) {
        // Make sure q is point with greater x value
        if (a.x < b.x) {
            return -1;
        }
    }
    return 1;
}
exports.cmp = cmp;
/// Add two points_ component-wise.
// inline Point operator +(const Point& a, const Point& b)
// {
//   return Point(a.x + b.x, a.y + b.y);
// }
/// Subtract two points_ component-wise.
// inline Point operator -(const Point& a, const Point& b)
// {
//   return Point(a.x - b.x, a.y - b.y);
// }
/// Multiply point by scalar
// inline Point operator *(double s, const Point& a)
// {
//   return Point(s * a.x, s * a.y);
// }
// inline bool operator ==(const Point& a, const Point& b)
// {
//   return a.x === b.x && a.y === b.y;
// }
// inline bool operator !=(const Point& a, const Point& b)
// {
//   return !(a.x === b.x) && !(a.y === b.y);
// }
/// Peform the dot product on two vectors.
// inline double Dot(const Point& a, const Point& b)
// {
//   return a.x * b.x + a.y * b.y;
// }
/// Perform the cross product on two vectors. In 2D this produces a scalar.
// inline double Cross(const Point& a, const Point& b)
// {
//   return a.x * b.y - a.y * b.x;
// }
/// Perform the cross product on a point and a scalar. In 2D this produces
/// a point.
// inline Point Cross(const Point& a, double s)
// {
//   return Point(s * a.y, -s * a.x);
// }
/// Perform the cross product on a scalar and a point. In 2D this produces
/// a point.
// inline Point Cross(const double s, const Point& a)
// {
//   return Point(-s * a.y, s * a.x);
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2hhcGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7O0FBRUg7SUFDRSxZQUFvQixRQUFhLEVBQUU7UUFBZixVQUFLLEdBQUwsS0FBSyxDQUFVO0lBQUksQ0FBQztJQUN4QyxLQUFLLEtBQW9CLE9BQU8sSUFBSSxVQUFVLENBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsRUFBRSxDQUFDLEtBQWEsSUFBTyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksS0FBYSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM1QyxLQUFLLEtBQWMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELEtBQUssS0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLEtBQUssS0FBUSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBUSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELFVBQVUsQ0FBQyxLQUFRLElBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELFNBQVMsS0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6QyxTQUFTLENBQUMsS0FBUSxJQUFVLElB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