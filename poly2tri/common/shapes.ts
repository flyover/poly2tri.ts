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

export class _std_sequence_container<T> {
  constructor(private array: T[] = []) { }
  clone(): std_vector<T> { return new std_vector<T>(this.array.slice(0)); }
  at(index: number): T { return this.array[index]; }
  size(): number { return this.array.length; }
  empty(): boolean { return this.array.length === 0; }
  clear(): void { this.array.length = 0; }
  front(): T { return this.array[0]; }
  back(): T { return this.array[this.array.length - 1]; }
  push_front(value: T): void { this.array.unshift(value); }
  pop_front(): void { this.array.shift(); }
  push_back(value: T): void { this.array.push(value); }
  pop_back(): void { this.array.pop(); }
  sort(cmp: (a: T, b: T) => number): void { this.array.sort(cmp); }
  insert(index: number, ...values: T[]): number {
    this.array.splice(index, 0, ...values);
    return index;
  }
  remove(value: T): void {
    const index: number = this.array.indexOf(value);
    if (index !== -1) {
      this.array.splice(index, 1);
    }
  }
}

export class std_vector<T> extends _std_sequence_container<T> { }
export class std_list<T> extends _std_sequence_container<T> { }

export class Point {
  /// Default constructor does nothing (for performance).
  /// Construct using coordinates.
  constructor(public x: number = 0.0, public y: number = 0.0) { }

  /// The edges this point constitutes an upper ending point
  public edge_list: std_vector<Edge> = new std_vector<Edge>();

  /// Set this point to all zeros.
  public set_zero(): void {
    this.x = 0.0;
    this.y = 0.0;
  }

  /// Set this point to some specified coordinates.
  public set(x_: number, y_: number): void {
    this.x = x_;
    this.y = y_;
  }

  public equals(other: Point): boolean {
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
  public Length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /// Convert this point into a unit point. Returns the Length.
  public Normalize(): number {
    const len: number = this.Length();
    this.x /= len;
    this.y /= len;
    return len;
  }
}

// Represents a simple polygon's edge
export class Edge {
  public p: Point;
  public q: Point;

  /// Constructor
  constructor(p1: Point, p2: Point) {
    this.p = p1;
    this.q = p2;

    if (p1.y > p2.y) {
      this.q = p1;
      this.p = p2;
    } else if (p1.y === p2.y) {
      if (p1.x > p2.x) {
        this.q = p1;
        this.p = p2;
      } else if (p1.x === p2.x) {
        // Repeat points
        throw new Error("assert");
      }
    }

    this.q.edge_list.push_back(this);
  }
}

// Triangle-based data structures are know to have better performance than quad-edge structures
// See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and Delaunay Triangulator"
//      "Triangulations in CGAL"
export class Triangle {
  /// Constructor
  constructor(a: Point, b: Point, c: Point) {
    this.points_ = [a, b, c];
  }

  /// Flags to determine if an edge is a Constrained edge
  public constrained_edge: [boolean, boolean, boolean] = [false, false, false];
  /// Flags to determine if an edge is a Delauney edge
  public delaunay_edge: [boolean, boolean, boolean] = [false, false, false];

  // Point* GetPoint(const int& index);
  public GetPoint(index: number): Point {
    return this.points_[index];
  }
  // Point* PointCW(Point& point);
  public PointCW(point: Point): Point {
    if (point.equals(this.points_[0])) {
      return this.points_[2];
    } else if (point.equals(this.points_[1])) {
      return this.points_[0];
    } else if (point.equals(this.points_[2])) {
      return this.points_[1];
    }
    throw new Error("assert");
  }
  // Point* PointCCW(Point& point);
  public PointCCW(point: Point): Point {
    if (point.equals(this.points_[0])) {
      return this.points_[1];
    } else if (point.equals(this.points_[1])) {
      return this.points_[2];
    } else if (point.equals(this.points_[2])) {
      return this.points_[0];
    }
    throw new Error("assert");
  }
  // Point* OppositePoint(Triangle& t, Point& p);
  public OppositePoint(t: Triangle, p: Point): Point {
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
  public GetNeighbor(index: number): Triangle | null {
    return this.neighbors_[index];
  }
  // void MarkNeighbor(Point* p1, Point* p2, Triangle* t);
  // void MarkNeighbor(Triangle& t);
  public MarkNeighbor(p1: Point, p2: Point, t: Triangle): void;
  public MarkNeighbor(t: Triangle): void;
  public MarkNeighbor(...args: any[]): void {
    if (args.length === 3) {
      this.MarkNeighbor_A(args[0], args[1], args[2]);
    } else {
      this.MarkNeighbor_B(args[0]);
    }
  }
  public MarkNeighbor_A(p1: Point, p2: Point, t: Triangle): void {
    if ((p1.equals(this.points_[2]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[2])))
      this.neighbors_[0] = t;
    else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[2])) || (p1.equals(this.points_[2]) && p2.equals(this.points_[0])))
      this.neighbors_[1] = t;
    else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[0])))
      this.neighbors_[2] = t;
    else
      throw new Error("assert");
  }
  public MarkNeighbor_B(t: Triangle): void {
    if (t.Contains_C(this.points_[1], this.points_[2])) {
      this.neighbors_[0] = t;
      t.MarkNeighbor_A(this.points_[1], this.points_[2], this);
    } else if (t.Contains_C(this.points_[0], this.points_[2])) {
      this.neighbors_[1] = t;
      t.MarkNeighbor_A(this.points_[0], this.points_[2], this);
    } else if (t.Contains_C(this.points_[0], this.points_[1])) {
      this.neighbors_[2] = t;
      t.MarkNeighbor_A(this.points_[0], this.points_[1], this);
    }
  }

  // void MarkConstrainedEdge(const int index);
  // void MarkConstrainedEdge(Edge& edge);
  // void MarkConstrainedEdge(Point* p, Point* q);
  public MarkConstrainedEdge(index: number): void;
  public MarkConstrainedEdge(edge: Edge): void;
  public MarkConstrainedEdge(p: Point, q: Point): void;
  public MarkConstrainedEdge(...args: any[]): void {
    if (args.length === 1) {
      if (typeof args[0] === "number") {
        this.MarkConstrainedEdge_A(args[0]);
      } else {
        this.MarkConstrainedEdge_B(args[0]);
      }
    } else {
      this.MarkConstrainedEdge_C(args[0], args[1]);
    }
  }
  public MarkConstrainedEdge_A(index: number): void {
    this.constrained_edge[index] = true;
  }
  public MarkConstrainedEdge_B(edge: Edge): void {
    this.MarkConstrainedEdge_C(edge.p, edge.q);
  }
  public MarkConstrainedEdge_C(p: Point, q: Point): void {
    if ((q.equals(this.points_[0]) && p.equals(this.points_[1])) || (q.equals(this.points_[1]) && p.equals(this.points_[0]))) {
      this.constrained_edge[2] = true;
    } else if ((q.equals(this.points_[0]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[0]))) {
      this.constrained_edge[1] = true;
    } else if ((q.equals(this.points_[1]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[1]))) {
      this.constrained_edge[0] = true;
    }
  }

  // int Index(const Point* p);
  public Index(p: Point): number {
    if (p.equals(this.points_[0])) {
      return 0;
    } else if (p.equals(this.points_[1])) {
      return 1;
    } else if (p.equals(this.points_[2])) {
      return 2;
    }
    throw new Error("assert");
  }
  // int EdgeIndex(const Point* p1, const Point* p2);
  public EdgeIndex(p1: Point, p2: Point): number {
    if (this.points_[0] === p1) {
      if (this.points_[1] === p2) {
        return 2;
      } else if (this.points_[2] === p2) {
        return 1;
      }
    } else if (this.points_[1] === p1) {
      if (this.points_[2] === p2) {
        return 0;
      } else if (this.points_[0] === p2) {
        return 2;
      }
    } else if (this.points_[2] === p1) {
      if (this.points_[0] === p2) {
        return 1;
      } else if (this.points_[1] === p2) {
        return 0;
      }
    }
    return -1;
  }

  // Triangle* NeighborCW(Point& point);
  public NeighborCW(point: Point): Triangle | null {
    if (point.equals(this.points_[0])) {
      return this.neighbors_[1];
    } else if (point.equals(this.points_[1])) {
      return this.neighbors_[2];
    }
    return this.neighbors_[0];
  }
  // Triangle* NeighborCCW(Point& point);
  public NeighborCCW(point: Point): Triangle | null {
    if (point.equals(this.points_[0])) {
      return this.neighbors_[2];
    } else if (point.equals(this.points_[1])) {
      return this.neighbors_[0];
    }
    return this.neighbors_[1];
  }
  // bool GetConstrainedEdgeCCW(Point& p);
  public GetConstrainedEdgeCCW(p: Point): boolean {
    if (p.equals(this.points_[0])) {
      return this.constrained_edge[2];
    } else if (p.equals(this.points_[1])) {
      return this.constrained_edge[0];
    }
    return this.constrained_edge[1];
  }
  // bool GetConstrainedEdgeCW(Point& p);
  public GetConstrainedEdgeCW(p: Point): boolean {
    if (p.equals(this.points_[0])) {
      return this.constrained_edge[1];
    } else if (p.equals(this.points_[1])) {
      return this.constrained_edge[2];
    }
    return this.constrained_edge[0];
  }
  // void SetConstrainedEdgeCCW(Point& p, bool ce);
  public SetConstrainedEdgeCCW(p: Point, ce: boolean): void {
    if (p.equals(this.points_[0])) {
      this.constrained_edge[2] = ce;
    } else if (p.equals(this.points_[1])) {
      this.constrained_edge[0] = ce;
    } else {
      this.constrained_edge[1] = ce;
    }
  }
  // void SetConstrainedEdgeCW(Point& p, bool ce);
  public SetConstrainedEdgeCW(p: Point, ce: boolean): void {
    if (p.equals(this.points_[0])) {
      this.constrained_edge[1] = ce;
    } else if (p.equals(this.points_[1])) {
      this.constrained_edge[2] = ce;
    } else {
      this.constrained_edge[0] = ce;
    }
  }
  // bool GetDelunayEdgeCCW(Point& p);
  public GetDelunayEdgeCCW(p: Point): boolean {
    if (p.equals(this.points_[0])) {
      return this.delaunay_edge[2];
    } else if (p.equals(this.points_[1])) {
      return this.delaunay_edge[0];
    }
    return this.delaunay_edge[1];
  }
  // bool GetDelunayEdgeCW(Point& p);
  public GetDelunayEdgeCW(p: Point): boolean {
    if (p.equals(this.points_[0])) {
      return this.delaunay_edge[1];
    } else if (p.equals(this.points_[1])) {
      return this.delaunay_edge[2];
    }
    return this.delaunay_edge[0];
  }
  // void SetDelunayEdgeCCW(Point& p, bool e);
  public SetDelunayEdgeCCW(p: Point, e: boolean): void {
    if (p.equals(this.points_[0])) {
      this.delaunay_edge[2] = e;
    } else if (p.equals(this.points_[1])) {
      this.delaunay_edge[0] = e;
    } else {
      this.delaunay_edge[1] = e;
    }
  }
  // void SetDelunayEdgeCW(Point& p, bool e);
  public SetDelunayEdgeCW(p: Point, e: boolean): void {
    if (p.equals(this.points_[0])) {
      this.delaunay_edge[1] = e;
    } else if (p.equals(this.points_[1])) {
      this.delaunay_edge[2] = e;
    } else {
      this.delaunay_edge[0] = e;
    }
  }

  // bool Contains(Point* p);
  // bool Contains(const Edge& e);
  // bool Contains(Point* p, Point* q);
  public Contains(p: Point): boolean;
  public Contains(e: Edge): boolean;
  public Contains(p: Point, q: Point): boolean;
  public Contains(...args: any[]): boolean {
    if (args.length === 1) {
      if (args[0] instanceof Point) {
        return this.Contains_A(args[0]);
      } else {
        return this.Contains_B(args[0]);
      }
    } else {
      return this.Contains_C(args[0], args[1]);
    }
  }
  public Contains_A(p: Point): boolean {
    return p.equals(this.points_[0]) || p.equals(this.points_[1]) || p.equals(this.points_[2]);
  }
  public Contains_B(e: Edge): boolean {
    return this.Contains_A(e.p) && this.Contains_A(e.q);
  }
  public Contains_C(p: Point, q: Point): boolean {
    return this.Contains_A(p) && this.Contains_A(q);
  }
  // void Legalize(Point& point);
  // void Legalize(Point& opoint, Point& npoint);
  public Legalize(point: Point): void;
  public Legalize(opoint: Point, npoint: Point): void;
  public Legalize(...args: any[]): void {
    if (args.length === 1) {
      this.Legalize_A(args[0]);
    } else {
      this.Legalize_B(args[0], args[1]);
    }
  }
  // Legalized triangle by rotating clockwise around point(0)
  public Legalize_A(point: Point): void {
    this.points_[1] = this.points_[0];
    this.points_[0] = this.points_[2];
    this.points_[2] = point;
  }

  // Legalize triagnle by rotating clockwise around oPoint
  public Legalize_B(opoint: Point, npoint: Point): void {
    if (opoint.equals(this.points_[0])) {
      this.points_[1] = this.points_[0];
      this.points_[0] = this.points_[2];
      this.points_[2] = npoint;
    } else if (opoint.equals(this.points_[1])) {
      this.points_[2] = this.points_[1];
      this.points_[1] = this.points_[0];
      this.points_[0] = npoint;
    } else if (opoint.equals(this.points_[2])) {
      this.points_[0] = this.points_[2];
      this.points_[2] = this.points_[1];
      this.points_[1] = npoint;
    } else {
      throw new Error("assert");
    }
  }
  /**
   * Clears all references to all other triangles and points
   */
  // void Clear();
  public Clear(): void {
    for (let i = 0; i < 3; i++) {
      const t: Triangle | null = this.neighbors_[i];
      if (t !== null) {
        t.ClearNeighbor(this);
      }
    }
    this.ClearNeighbors();
    // this.points_[0] = this.points_[1] = this.points_[2] = null;
  }
  // void ClearNeighbor(Triangle *triangle );
  public ClearNeighbor(triangle: Triangle): void {
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
  public ClearNeighbors(): void {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
  }
  // void ClearDelunayEdges();
  public ClearDelunayEdges(): void {
    this.delaunay_edge[0] = this.delaunay_edge[1] = this.delaunay_edge[2] = false;
  }

  // inline bool IsInterior();
  // inline void IsInterior(bool b);
  public IsInterior(): boolean;
  public IsInterior(b: boolean): void;
  public IsInterior(b: boolean = this.interior_): boolean { return this.interior_ = b; }

  // Triangle& NeighborAcross(Point& opoint);
  public NeighborAcross(opoint: Point): Triangle | null {
    if (opoint.equals(this.points_[0])) {
      return this.neighbors_[0];
    } else if (opoint.equals(this.points_[1])) {
      return this.neighbors_[1];
    }
    return this.neighbors_[2];
  }

  // void DebugPrint();
  public DebugPrint(): void {
    // using namespace std;
    // cout << points_[0].x << "," << points_[0].y << " ";
    // cout << points_[1].x << "," << points_[1].y << " ";
    // cout << points_[2].x << "," << points_[2].y << endl;
    console.log(`${this.points_[0].x},${this.points_[0].y}`);
    console.log(`${this.points_[1].x},${this.points_[1].y}`);
    console.log(`${this.points_[2].x},${this.points_[2].y}`);
  }

  /// Triangle points
  private points_: [Point, Point, Point];
  /// Neighbor list
  private neighbors_: [Triangle | null, Triangle | null, Triangle | null] = [null, null, null];

  /// Has this triangle been marked as an interior triangle?
  private interior_: boolean = false;
}

export function cmp(a: Point, b: Point): number {
  if (a.y < b.y) {
    return -1;
  } else if (a.y === b.y) {
    // Make sure q is point with greater x value
    if (a.x < b.x) {
      return -1;
    }
  }
  return 1;
}

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
