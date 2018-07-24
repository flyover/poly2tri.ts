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
/**
 * Sweep-line, Constrained Delauney Triangulation (CDT) See: Domiter, V. and
 * Zalik, B.(2008)'Sweep-line algorithm for constrained Delaunay triangulation',
 * International Journal of Geographical Information Science
 *
 * "FlipScan" Constrained Edge Algorithm invented by Thomas �hl�n, thahlen@gmail.com
 */

import { std_vector } from "../common/shapes";
import { EPSILON, Orient2d, Orientation, PI_3div4, PI_div2, InScanArea } from "../common/utils";
import { Point, Edge, Triangle } from "../common/shapes";
import { SweepContext } from "./sweep_context";
import { Node } from "./advancing_front";

export class Sweep {
  /**
   * Triangulate
   * 
   * @param tcx
   */
  public Triangulate(tcx: SweepContext): void {
    tcx.InitTriangulation();
    tcx.CreateAdvancingFront(this.nodes_);
    // Sweep points; build mesh
    this.SweepPoints(tcx);
    // Clean up
    this.FinalizationPolygon(tcx);
  }

  /**
   * Destructor - clean up memory
   */
  // ~Sweep();
  public destructor(): void {
    // Clean up memory
    // for(int i = 0; i < nodes_.size(); i++) {
    //     delete nodes_[i];
    // }
  }

  /**
   * Start sweeping the Y-sorted point set from bottom to top
   * 
   * @param tcx
   */
  // void SweepPoints(SweepContext& tcx);
  private SweepPoints(tcx: SweepContext): void {
    for (let i = 1; i < tcx.point_count(); i++) {
      // Point& point = *tcx.GetPoint(i);
      const point: Point = tcx.GetPoint(i);
      // Node* node = &PointEvent(tcx, point);
      const node: Node = this.PointEvent(tcx, point);
      for (let i = 0; i < point.edge_list.size(); i++) {
        this.EdgeEvent_A(tcx, point.edge_list.at(i), node);
      }
    }
  }

  /**
   * Find closes node to the left of the new point and
   * create a new triangle. If needed new holes and basins
   * will be filled to.
   *
   * @param tcx
   * @param point
   * @return
   */
  // Node& PointEvent(SweepContext& tcx, Point& point);
  private PointEvent(tcx: SweepContext, point: Point): Node {
    // Node& node = tcx.LocateNode(point);
    const node = tcx.LocateNode(point);
    // Node& new_node = NewFrontTriangle(tcx, point, node);
    const new_node = this.NewFrontTriangle(tcx, point, node);

    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + EPSILON) {
      this.Fill(tcx, node);
    }

    //tcx.AddNode(new_node);

    this.FillAdvancingFront(tcx, new_node);
    return new_node;
  }

  /**
    * 
    * 
    * @param tcx
    * @param edge
    * @param node
    */
  // void EdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
  // void EdgeEvent(SweepContext& tcx, Point& ep, Point& eq, Triangle* triangle, Point& point);
  private EdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void;
  private EdgeEvent(tcx: SweepContext, ep: Point, eq: Point, triangle: Triangle, point: Point): void;
  private EdgeEvent(tcx: SweepContext, ...args: any[]): void {
    if (args.length === 2) {
      this.EdgeEvent_A(tcx, args[0], args[1]);
    } else {
      this.EdgeEvent_B(tcx, args[0], args[1], args[2], args[3]);
    }
  }

  // void EdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
  private EdgeEvent_A(tcx: SweepContext, edge: Edge, node: Node): void {
    tcx.edge_event.constrained_edge = edge;
    tcx.edge_event.right = (edge.p.x > edge.q.x);

    if (node.triangle === null) { throw new Error(); }
    if (this.IsEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
      return;
    }

    // For now we will do all needed filling
    // TODO: integrate with flip process might give some better performance
    //       but for now this avoid the issue with cases that needs both flips and fills
    this.FillEdgeEvent(tcx, edge, node);
    this.EdgeEvent_B(tcx, edge.p, edge.q, node.triangle, edge.q);
  }

  // void EdgeEvent(SweepContext& tcx, Point& ep, Point& eq, Triangle* triangle, Point& point);
  private EdgeEvent_B(tcx: SweepContext, ep: Point, eq: Point, triangle: Triangle, point: Point): void {
    if (this.IsEdgeSideOfTriangle(triangle, ep, eq)) {
      return;
    }

    // Point* p1 = triangle.PointCCW(point);
    const p1 = triangle.PointCCW(point);
    // Orientation o1 = Orient2d(eq, *p1, ep);
    const o1 = Orient2d(eq, p1, ep);
    if (o1 === Orientation.COLLINEAR) {
      if (triangle.Contains(eq, p1)) {
        triangle.MarkConstrainedEdge(eq, p1);
        // We are modifying the constraint maybe it would be better to 
        // not change the given constraint and just keep a variable for the new constraint
        if (tcx.edge_event.constrained_edge === null) { throw new Error(); }
        tcx.edge_event.constrained_edge.q = p1;
        triangle = triangle.NeighborAcross(point) as Triangle;
        this.EdgeEvent_B(tcx, ep, p1, triangle, p1);
      } else {
        // std::runtime_error("EdgeEvent - collinear points not supported");
        // assert(0);
        throw new Error("EdgeEvent - collinear points not supported");
      }
      return;
    }

    // Point* p2 = triangle.PointCW(point);
    const p2 = triangle.PointCW(point);
    // Orientation o2 = Orient2d(eq, *p2, ep);
    const o2 = Orient2d(eq, p2, ep);
    if (o2 === Orientation.COLLINEAR) {
      if (triangle.Contains(eq, p2)) {
        triangle.MarkConstrainedEdge(eq, p2);
        // We are modifying the constraint maybe it would be better to 
        // not change the given constraint and just keep a variable for the new constraint
        if (tcx.edge_event.constrained_edge === null) { throw new Error(); }
        tcx.edge_event.constrained_edge.q = p2;
        triangle = triangle.NeighborAcross(point) as Triangle;
        this.EdgeEvent_B(tcx, ep, p2, triangle, p2);
      } else {
        // std::runtime_error("EdgeEvent - collinear points not supported");
        // assert(0);
        throw new Error("EdgeEvent - collinear points not supported");
      }
      return;
    }

    if (o1 === o2) {
      // Need to decide if we are rotating CW or CCW to get to a triangle
      // that will cross edge
      if (o1 === Orientation.CW) {
        triangle = triangle.NeighborCCW(point) as Triangle;
      } else {
        triangle = triangle.NeighborCW(point) as Triangle;
      }
      this.EdgeEvent_B(tcx, ep, eq, triangle, point);
    } else {
      // This triangle crosses constraint so lets flippin start!
      this.FlipEdgeEvent(tcx, ep, eq, triangle, point);
    }
  }

  /**
   * Creates a new front triangle and legalize it
   * 
   * @param tcx
   * @param point
   * @param node
   * @return
   */
  // Node& NewFrontTriangle(SweepContext& tcx, Point& point, Node& node);
  private NewFrontTriangle(tcx: SweepContext, point: Point, node: Node): Node {
    // Triangle* triangle = new Triangle(point, *node.point, *node.next.point);
    if (node.next === null) { throw new Error(); }
    const triangle: Triangle = new Triangle(point, node.point, node.next.point);

    if (node.triangle === null) { throw new Error(); }
    triangle.MarkNeighbor(node.triangle);
    tcx.AddToMap(triangle);

    // Node* new_node = new Node(point);
    const new_node: Node = new Node(point);
    this.nodes_.push_back(new_node);

    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;

    if (!this.Legalize(tcx, triangle)) {
      tcx.MapTriangleToNodes(triangle);
    }

    return new_node;
  }

  /**
   * Adds a triangle to the advancing front to fill a hole.
   * @param tcx
   * @param node - middle node, that is the bottom of the hole
   */
  // void Fill(SweepContext& tcx, Node& node);
  private Fill(tcx: SweepContext, node: Node): void {
    // Triangle* triangle = new Triangle(*node.prev.point, *node.point, *node.next.point);
    if (node.prev === null) { throw new Error(); }
    if (node.next === null) { throw new Error(); }
    const triangle = new Triangle(node.prev.point, node.point, node.next.point);

    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    if (node.prev.triangle === null) { throw new Error(); }
    triangle.MarkNeighbor(node.prev.triangle);
    if (node.triangle === null) { throw new Error(); }
    triangle.MarkNeighbor(node.triangle);

    tcx.AddToMap(triangle);

    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;

    // If it was legalized the triangle has already been mapped
    if (!this.Legalize(tcx, triangle)) {
      tcx.MapTriangleToNodes(triangle);
    }
  }

  /**
   * Returns true if triangle was legalized
   */
  // bool Legalize(SweepContext& tcx, Triangle& t);
  private Legalize(tcx: SweepContext, t: Triangle): boolean {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (let i = 0; i < 3; i++) {
      if (t.delaunay_edge[i])
        continue;

      // Triangle* ot = t.GetNeighbor(i);
      const ot: Triangle | null = t.GetNeighbor(i);

      if (ot) {
        // Point* p = t.GetPoint(i);
        const p: Point = t.GetPoint(i);
        // Point* op = ot.OppositePoint(t, *p);
        const op: Point = ot.OppositePoint(t, p);
        let oi: number = ot.Index(op);

        // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
        // then we should not try to legalize
        if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
          t.constrained_edge[i] = ot.constrained_edge[oi];
          continue;
        }

        const inside: boolean = this.Incircle(p, t.PointCCW(p), t.PointCW(p), op);

        if (inside) {
          // Lets mark this shared edge as Delaunay
          t.delaunay_edge[i] = true;
          ot.delaunay_edge[oi] = true;

          // Lets rotate shared edge one vertex CW to legalize it
          this.RotateTrianglePair(t, p, ot, op);

          // We now got one valid Delaunay Edge shared by two triangles
          // This gives us 4 new edges to check for Delaunay

          // Make sure that triangle to node mapping is done only one time for a specific triangle
          let not_legalized: boolean = !this.Legalize(tcx, t);
          if (not_legalized) {
            tcx.MapTriangleToNodes(t);
          }

          not_legalized = !this.Legalize(tcx, ot);
          if (not_legalized)
            tcx.MapTriangleToNodes(ot);

          // Reset the Delaunay edges, since they only are valid Delaunay edges
          // until we add a new triangle or point.
          // XXX: need to think about this. Can these edges be tried after we
          //      return to previous recursive level?
          t.delaunay_edge[i] = false;
          ot.delaunay_edge[oi] = false;

          // If triangle have been legalized no need to check the other edges since
          // the recursive legalization will handles those so we can end here.
          return true;
        }
      }
    }
    return false;
  }

  /**
   * <b>Requirement</b>:<br>
   * 1. a,b and c form a triangle.<br>
   * 2. a and d is know to be on opposite side of bc<br>
   * <pre>
   *                a
   *                +
   *               / \
   *              /   \
   *            b/     \c
   *            +-------+
   *           /    d    \
   *          /           \
   * </pre>
   * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
   *  a,b and c<br>
   *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
   *  This preknowledge gives us a way to optimize the incircle test
   * @param a - triangle point, opposite d
   * @param b - triangle point
   * @param c - triangle point
   * @param d - point opposite a
   * @return true if d is inside circle, false if on circle edge
   */
  // bool Incircle(Point& pa, Point& pb, Point& pc, Point& pd);
  private Incircle(pa: Point, pb: Point, pc: Point, pd: Point): boolean {
    const adx: number = pa.x - pd.x;
    const ady: number = pa.y - pd.y;
    const bdx: number = pb.x - pd.x;
    const bdy: number = pb.y - pd.y;

    const adxbdy: number = adx * bdy;
    const bdxady: number = bdx * ady;
    const oabd: number = adxbdy - bdxady;

    if (oabd <= 0)
      return false;

    const cdx: number = pc.x - pd.x;
    const cdy: number = pc.y - pd.y;

    const cdxady: number = cdx * ady;
    const adxcdy: number = adx * cdy;
    const ocad: number = cdxady - adxcdy;

    if (ocad <= 0)
      return false;

    const bdxcdy: number = bdx * cdy;
    const cdxbdy: number = cdx * bdy;

    const alift: number = adx * adx + ady * ady;
    const blift: number = bdx * bdx + bdy * bdy;
    const clift: number = cdx * cdx + cdy * cdy;

    const det: number = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;

    return det > 0;
  }

  // /**
  //  * Rotates a triangle pair one vertex CW
  //  *<pre>
  //  *       n2                    n2
  //  *  P +-----+             P +-----+
  //  *    | t  /|               |\  t |
  //  *    |   / |               | \   |
  //  *  n1|  /  |n3           n1|  \  |n3
  //  *    | /   |    after CW   |   \ |
  //  *    |/ oT |               | oT \|
  //  *    +-----+ oP            +-----+
  //  *       n4                    n4
  //  * </pre>
  //  */
  // void RotateTrianglePair(Triangle& t, Point& p, Triangle& ot, Point& op);
  private RotateTrianglePair(t: Triangle, p: Point, ot: Triangle, op: Point): void {
    // Triangle* n1, *n2, *n3, *n4;
    const n1 = t.NeighborCCW(p);
    const n2 = t.NeighborCW(p);
    const n3 = ot.NeighborCCW(op);
    const n4 = ot.NeighborCW(op);

    // bool ce1, ce2, ce3, ce4;
    const ce1 = t.GetConstrainedEdgeCCW(p);
    const ce2 = t.GetConstrainedEdgeCW(p);
    const ce3 = ot.GetConstrainedEdgeCCW(op);
    const ce4 = ot.GetConstrainedEdgeCW(op);

    // bool de1, de2, de3, de4;
    const de1 = t.GetDelunayEdgeCCW(p);
    const de2 = t.GetDelunayEdgeCW(p);
    const de3 = ot.GetDelunayEdgeCCW(op);
    const de4 = ot.GetDelunayEdgeCW(op);

    t.Legalize(p, op);
    ot.Legalize(op, p);

    // Remap delaunay_edge
    ot.SetDelunayEdgeCCW(p, de1);
    t.SetDelunayEdgeCW(p, de2);
    t.SetDelunayEdgeCCW(op, de3);
    ot.SetDelunayEdgeCW(op, de4);

    // Remap constrained_edge
    ot.SetConstrainedEdgeCCW(p, ce1);
    t.SetConstrainedEdgeCW(p, ce2);
    t.SetConstrainedEdgeCCW(op, ce3);
    ot.SetConstrainedEdgeCW(op, ce4);

    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.ClearNeighbors();
    ot.ClearNeighbors();
    if (n1) ot.MarkNeighbor(n1);
    if (n2) t.MarkNeighbor(n2);
    if (n3) t.MarkNeighbor(n3);
    if (n4) ot.MarkNeighbor(n4);
    t.MarkNeighbor(ot);
  }

  /**
   * Fills holes in the Advancing Front
   *
   *
   * @param tcx
   * @param n
   */
  // void FillAdvancingFront(SweepContext& tcx, Node& n);
  private FillAdvancingFront(tcx: SweepContext, n: Node): void {
    // Fill right holes
    // Node* node = n.next;
    if (n.next === null) { throw new Error(); }
    let node: Node = n.next;

    while (node.next) {
      // if HoleAngle exceeds 90 degrees then break.
      if (this.LargeHole_DontFill(node)) break;
      this.Fill(tcx, node);
      node = node.next;
    }

    // Fill left holes
    if (n.prev === null) { throw new Error(); }
    node = n.prev;

    while (node.prev) {
      // if HoleAngle exceeds 90 degrees then break.
      if (this.LargeHole_DontFill(node)) break;
      this.Fill(tcx, node);
      node = node.prev;
    }

    // Fill right basins
    if (n.next && n.next.next) {
      const angle: number = this.BasinAngle(n);
      if (angle < PI_3div4) {
        this.FillBasin(tcx, n);
      }
    }
  }

  // Decision-making about when to Fill hole. 
  // Contributed by ToolmakerSteve2
  // bool LargeHole_DontFill(Node* node);
  private LargeHole_DontFill(node: Node): boolean {
    // Node* nextNode = node.next;
    if (node.next === null) { throw new Error(); }
    const nextNode: Node = node.next;
    // Node* prevNode = node.prev;
    if (node.prev === null) { throw new Error(); }
    const prevNode: Node = node.prev;
    if (!this.AngleExceeds90Degrees(node.point, nextNode.point, prevNode.point))
      return false;

    // Check additional points on front.
    // Node* next2Node = nextNode.next;
    const next2Node = nextNode.next;
    // "..Plus.." because only want angles on same side as point being added.
    if ((next2Node !== null) && !this.AngleExceedsPlus90DegreesOrIsNegative(node.point, next2Node.point, prevNode.point))
      return false;

    // Node* prev2Node = prevNode.prev;
    const prev2Node = prevNode.prev;
    // "..Plus.." because only want angles on same side as point being added.
    if ((prev2Node !== null) && !this.AngleExceedsPlus90DegreesOrIsNegative(node.point, nextNode.point, prev2Node.point))
      return false;

    return true;
  }
  // bool AngleExceeds90Degrees(Point* origin, Point* pa, Point* pb);
  private AngleExceeds90Degrees(origin: Point, pa: Point, pb: Point): boolean {
    const angle = this.Angle(origin, pa, pb);
    const exceeds90Degrees = ((angle > PI_div2) || (angle < -PI_div2));
    return exceeds90Degrees;
  }
  // bool AngleExceedsPlus90DegreesOrIsNegative(Point* origin, Point* pa, Point* pb);
  private AngleExceedsPlus90DegreesOrIsNegative(origin: Point, pa: Point, pb: Point): boolean {
    const angle = this.Angle(origin, pa, pb);
    const exceedsPlus90DegreesOrIsNegative = (angle > PI_div2) || (angle < 0);
    return exceedsPlus90DegreesOrIsNegative;
  }
  // double Angle(Point& origin, Point& pa, Point& pb);
  private Angle(origin: Point, pa: Point, pb: Point): number {
    /* Complex plane
    * ab = cosA +i*sinA
    * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
    * atan2(y,x) computes the principal value of the argument function
    * applied to the complex number x+iy
    * Where x = ax*bx + ay*by
    *       y = ax*by - ay*bx
    */
    const px: number = origin.x;
    const py: number = origin.y;
    const ax: number = pa.x - px;
    const ay: number = pa.y - py;
    const bx: number = pb.x - px;
    const by: number = pb.y - py;
    const x: number = ax * by - ay * bx;
    const y: number = ax * bx + ay * by;
    const angle: number = Math.atan2(x, y);
    return angle;
  }

  /**
   *
   * @param node - middle node
   * @return the angle between 3 front nodes
   */
  // double HoleAngle(Node& node);
  private HoleAngle(node: Node): number {
    /* Complex plane
    * ab = cosA +i*sinA
    * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
    * atan2(y,x) computes the principal value of the argument function
    * applied to the complex number x+iy
    * Where x = ax*bx + ay*by
    *       y = ax*by - ay*bx
    */
    if (node.next === null) { throw new Error(); }
    const ax: number = node.next.point.x - node.point.x;
    const ay: number = node.next.point.y - node.point.y;
    if (node.prev === null) { throw new Error(); }
    const bx: number = node.prev.point.x - node.point.x;
    const by: number = node.prev.point.y - node.point.y;
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }

  /**
   * The basin angle is decided against the horizontal line [1,0]
   */
  // double BasinAngle(Node& node);
  private BasinAngle(node: Node): number {
    if (node.next == null || node.next.next === null) { throw new Error(); }
    const ax: number = node.point.x - node.next.next.point.x;
    const ay: number = node.point.y - node.next.next.point.y;
    return Math.atan2(ay, ax);
  }

  /**
   * Fills a basin that has formed on the Advancing Front to the right
   * of given node.<br>
   * First we decide a left,bottom and right node that forms the
   * boundaries of the basin. Then we do a reqursive fill.
   *
   * @param tcx
   * @param node - starting node, this or next node will be left node
   */
  // void FillBasin(SweepContext& tcx, Node& node);
  private FillBasin(tcx: SweepContext, node: Node): void {
    if (node.next == null || node.next.next === null) { throw new Error(); }
    if (Orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
      tcx.basin.left_node = node.next.next;
    } else {
      tcx.basin.left_node = node.next;
    }

    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next
      && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
      tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node === tcx.basin.left_node) {
      // No valid basin
      return;
    }

    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next
      && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
      tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node === tcx.basin.bottom_node) {
      // No valid basins
      return;
    }

    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;

    this.FillBasinReq(tcx, tcx.basin.bottom_node);
  }

  /**
   * Recursive algorithm to fill a Basin with triangles
   *
   * @param tcx
   * @param node - bottom_node
   * @param cnt - counter used to alternate on even and odd numbers
   */
  // void FillBasinReq(SweepContext& tcx, Node* node);
  private FillBasinReq(tcx: SweepContext, node: Node): void {
    // if shallow stop filling
    if (this.IsShallow(tcx, node)) {
      return;
    }

    this.Fill(tcx, node);

    if (node.prev === tcx.basin.left_node && node.next === tcx.basin.right_node) {
      return;
    } else if (node.prev === tcx.basin.left_node) {
      if (node.next === null || node.next.next === null) { throw new Error(); }
      const o: Orientation = Orient2d(node.point, node.next.point, node.next.next.point);
      if (o === Orientation.CW) {
        return;
      }
      node = node.next;
    } else if (node.next === tcx.basin.right_node) {
      if (node.prev === null || node.prev.prev === null) { throw new Error(); }
      const o: Orientation = Orient2d(node.point, node.prev.point, node.prev.prev.point);
      if (o === Orientation.CCW) {
        return;
      }
      node = node.prev;
    } else {
      // Continue with the neighbor node with lowest Y value
      if (node.next === null || node.prev === null) { throw new Error(); }
      if (node.prev.point.y < node.next.point.y) {
        node = node.prev;
      } else {
        node = node.next;
      }
    }

    this.FillBasinReq(tcx, node);
  }

  // bool IsShallow(SweepContext& tcx, Node& node);
  private IsShallow(tcx: SweepContext, node: Node): boolean {
    let height;

    if (tcx.basin.left_highest) {
      if (tcx.basin.left_node === null) { throw new Error(); }
      height = tcx.basin.left_node.point.y - node.point.y;
    } else {
      if (tcx.basin.right_node === null) { throw new Error(); }
      height = tcx.basin.right_node.point.y - node.point.y;
    }

    // if shallow stop filling
    if (tcx.basin.width > height) {
      return true;
    }
    return false;
  }

  // bool IsEdgeSideOfTriangle(Triangle& triangle, Point& ep, Point& eq);
  private IsEdgeSideOfTriangle(triangle: Triangle, ep: Point, eq: Point): boolean {
    const index = triangle.EdgeIndex(ep, eq);

    if (index !== -1) {
      triangle.MarkConstrainedEdge(index);
      // Triangle* t = triangle.GetNeighbor(index);
      const t = triangle.GetNeighbor(index);
      if (t) {
        t.MarkConstrainedEdge(ep, eq);
      }
      return true;
    }
    return false;
  }

  // void FillEdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
  private FillEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (tcx.edge_event.right) {
      this.FillRightAboveEdgeEvent(tcx, edge, node);
    } else {
      this.FillLeftAboveEdgeEvent(tcx, edge, node);
    }
  }

  // void FillRightAboveEdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
  private FillRightAboveEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.next === null) { throw new Error(); }
    while (node.next !== null && node.next.point.x < edge.p.x) {
      // Check if next node is below the edge
      if (Orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
        this.FillRightBelowEdgeEvent(tcx, edge, node);
      } else {
        node = node.next;
      }
    }
  }

  // void FillRightBelowEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillRightBelowEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.point.x < edge.p.x) {
      if (node.next === null || node.next.next === null) { throw new Error(); }
      if (Orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
        // Concave
        this.FillRightConcaveEdgeEvent(tcx, edge, node);
      } else {
        // Convex
        this.FillRightConvexEdgeEvent(tcx, edge, node);
        // Retry this one
        this.FillRightBelowEdgeEvent(tcx, edge, node);
      }
    }
  }

  // void FillRightConcaveEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillRightConcaveEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.next === null) { throw new Error(); }
    this.Fill(tcx, node.next);
    if (node.next.point !== edge.p) {
      // Next above or below edge?
      if (Orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
        // Below
        if (node.next.next === null) { throw new Error(); }
        if (Orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
          // Next is concave
          this.FillRightConcaveEdgeEvent(tcx, edge, node);
        } else {
          // Next is convex
        }
      }
    }
  }

  // void FillRightConvexEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillRightConvexEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    // Next concave or convex?
    if (node.next === null || node.next.next === null || node.next.next.next === null) { throw new Error(); }
    if (Orient2d(node.next.point, node.next.next.point, node.next.next.next.point) === Orientation.CCW) {
      // Concave
      this.FillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
      // Convex
      // Next above or below edge?
      if (Orient2d(edge.q, node.next.next.point, edge.p) === Orientation.CCW) {
        // Below
        this.FillRightConvexEdgeEvent(tcx, edge, node.next);
      } else {
        // Above
      }
    }
  }

  // void FillLeftAboveEdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
  private FillLeftAboveEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.prev === null) { throw new Error(); }
    while (node.prev !== null && node.prev.point.x > edge.p.x) {
      // Check if next node is below the edge
      if (Orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
        this.FillLeftBelowEdgeEvent(tcx, edge, node);
      } else {
        node = node.prev;
      }
    }
  }

  // void FillLeftBelowEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillLeftBelowEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.point.x > edge.p.x) {
      if (node.prev === null || node.prev.prev === null) { throw new Error(); }
      if (Orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
        // Concave
        this.FillLeftConcaveEdgeEvent(tcx, edge, node);
      } else {
        // Convex
        this.FillLeftConvexEdgeEvent(tcx, edge, node);
        // Retry this one
        this.FillLeftBelowEdgeEvent(tcx, edge, node);
      }
    }
  }

  // void FillLeftConcaveEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillLeftConcaveEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    if (node.prev === null) { throw new Error(); }
    this.Fill(tcx, node.prev);
    if (node.prev.point !== edge.p) {
      // Next above or below edge?
      if (Orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
        // Below
        if (node.prev.prev === null) { throw new Error(); }
        if (Orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
          // Next is concave
          this.FillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
          // Next is convex
        }
      }
    }
  }

  // void FillLeftConvexEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
  private FillLeftConvexEdgeEvent(tcx: SweepContext, edge: Edge, node: Node): void {
    // Next concave or convex?
    if (node.prev === null || node.prev.prev === null || node.prev.prev.prev === null) { throw new Error(); }
    if (Orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) === Orientation.CW) {
      // Concave
      this.FillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
      // Convex
      // Next above or below edge?
      if (Orient2d(edge.q, node.prev.prev.point, edge.p) === Orientation.CW) {
        // Below
        this.FillLeftConvexEdgeEvent(tcx, edge, node.prev);
      } else {
        // Above
      }
    }
  }

  // void FlipEdgeEvent(SweepContext& tcx, Point& ep, Point& eq, Triangle* t, Point& p);
  private FlipEdgeEvent(tcx: SweepContext, ep: Point, eq: Point, t: Triangle, p: Point): void {
    // Triangle& ot = t.NeighborAcross(p);
    const ot = t.NeighborAcross(p) as Triangle;
    // Point& op = *ot.OppositePoint(*t, p);
    const op = ot.OppositePoint(t, p);

    if (ot === null) {
      // If we want to integrate the fillEdgeEvent do it here
      // With current implementation we should never get here
      //throw new RuntimeException( "[BUG:FIXME] FLIP failed due to missing triangle");
      throw new Error("[BUG:FIXME] FLIP failed due to missing triangle");
    }

    if (InScanArea(p, t.PointCCW(p), t.PointCW(p), op)) {
      // Lets rotate shared edge one vertex CW
      this.RotateTrianglePair(t, p, ot, op);
      tcx.MapTriangleToNodes(t);
      tcx.MapTriangleToNodes(ot);

      if (p === eq && op === ep) {
        if (tcx.edge_event.constrained_edge === null) { throw new Error(); }
        if (eq === tcx.edge_event.constrained_edge.q && ep === tcx.edge_event.constrained_edge.p) {
          t.MarkConstrainedEdge(ep, eq);
          ot.MarkConstrainedEdge(ep, eq);
          this.Legalize(tcx, t);
          this.Legalize(tcx, ot);
        } else {
          // XXX: I think one of the triangles should be legalized here?
        }
      } else {
        const o: Orientation = Orient2d(eq, op, ep);
        // t = &NextFlipTriangle(tcx, (int)o, *t, ot, p, op);
        t = this.NextFlipTriangle(tcx, o, t, ot, p, op);
        this.FlipEdgeEvent(tcx, ep, eq, t, p);
      }
    } else {
      // Point& newP = NextFlipPoint(ep, eq, ot, op);
      const newP = this.NextFlipPoint(ep, eq, ot, op);
      this.FlipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
      this.EdgeEvent_B(tcx, ep, eq, t, p);
    }
  }

  /**
   * After a flip we have two triangles and know that only one will still be
   * intersecting the edge. So decide which to contiune with and legalize the other
   * 
   * @param tcx
   * @param o - should be the result of an orient2d( eq, op, ep )
   * @param t - triangle 1
   * @param ot - triangle 2
   * @param p - a point shared by both triangles 
   * @param op - another point shared by both triangles
   * @return returns the triangle still intersecting the edge
   */
  // Triangle& NextFlipTriangle(SweepContext& tcx, int o, Triangle&  t, Triangle& ot, Point& p, Point& op);
  private NextFlipTriangle(tcx: SweepContext, o: number, t: Triangle, ot: Triangle, p: Point, op: Point): Triangle {
    if (o === Orientation.CCW) {
      // ot is not crossing edge after flip
      const edge_index = ot.EdgeIndex(p, op);
      ot.delaunay_edge[edge_index] = true;
      this.Legalize(tcx, ot);
      ot.ClearDelunayEdges();
      return t;
    }

    // t is not crossing edge after flip
    const edge_index = t.EdgeIndex(p, op);

    t.delaunay_edge[edge_index] = true;
    this.Legalize(tcx, t);
    t.ClearDelunayEdges();
    return ot;
  }

  /**
    * When we need to traverse from one triangle to the next we need 
    * the point in current triangle that is the opposite point to the next
    * triangle. 
    * 
    * @param ep
    * @param eq
    * @param ot
    * @param op
    * @return
    */
  // Point& NextFlipPoint(Point& ep, Point& eq, Triangle& ot, Point& op);
  private NextFlipPoint(ep: Point, eq: Point, ot: Triangle, op: Point): Point {
    const o2d: Orientation = Orient2d(eq, op, ep);
    if (o2d === Orientation.CW) {
      // Right
      return ot.PointCCW(op);
    } else if (o2d === Orientation.CCW) {
      // Left
      return ot.PointCW(op);
    } else {
      //throw new RuntimeException("[Unsupported] Opposing point on constrained edge");
      throw new Error("[Unsupported] Opposing point on constrained edge");
    }
  }

  /**
    * Scan part of the FlipScan algorithm<br>
    * When a triangle pair isn't flippable we will scan for the next 
    * point that is inside the flip triangle scan area. When found 
    * we generate a new flipEdgeEvent
    * 
    * @param tcx
    * @param ep - last point on the edge we are traversing
    * @param eq - first point on the edge we are traversing
    * @param flipTriangle - the current triangle sharing the point eq with edge
    * @param t
    * @param p
    */
  // void FlipScanEdgeEvent(SweepContext& tcx, Point& ep, Point& eq, Triangle& flip_triangle, Triangle& t, Point& p);
  private FlipScanEdgeEvent(tcx: SweepContext, ep: Point, eq: Point, flip_triangle: Triangle, t: Triangle, p: Point): void {
    // Triangle& ot = t.NeighborAcross(p);
    const ot = t.NeighborAcross(p) as Triangle;
    // Point& op = *ot.OppositePoint(t, p);
    const op = ot.OppositePoint(t, p);

    if (t.NeighborAcross(p) === null) {
      // If we want to integrate the fillEdgeEvent do it here
      // With current implementation we should never get here
      //throw new RuntimeException( "[BUG:FIXME] FLIP failed due to missing triangle");
      throw new Error("[BUG:FIXME] FLIP failed due to missing triangle");
    }

    if (InScanArea(eq, flip_triangle.PointCCW(eq), flip_triangle.PointCW(eq), op)) {
      // flip with new edge op.eq
      this.FlipEdgeEvent(tcx, eq, op, ot, op);
      // TODO: Actually I just figured out that it should be possible to
      //       improve this by getting the next ot and op before the the above
      //       flip and continue the flipScanEdgeEvent here
      // set new ot and op here and loop back to inScanArea test
      // also need to set a new flip_triangle first
      // Turns out at first glance that this is somewhat complicated
      // so it will have to wait.
    } else {
      // Point& newP = NextFlipPoint(ep, eq, ot, op);
      const newP = this.NextFlipPoint(ep, eq, ot, op);
      this.FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
  }

  // void FinalizationPolygon(SweepContext& tcx);
  private FinalizationPolygon(tcx: SweepContext): void {
    // Get an Internal triangle to start with
    // Triangle* t = tcx.front().head().next.triangle;
    // Point* p = tcx.front().head().next.point;
    const front = tcx.front();
    if (front === null) { throw new Error(); }
    const head = front.head();
    const next = head.next;
    if (next === null) { throw new Error(); }
    let t = next.triangle as Triangle;
    if (t === null) { throw new Error(); }
    const p = next.point;
    while (!t.GetConstrainedEdgeCW(p)) {
      t = t.NeighborCCW(p) as Triangle;
    }

    // Collect interior triangles constrained by edges
    tcx.MeshClean(t);
  }

  // std::vector<Node*> nodes_;
  private nodes_: std_vector<Node> = new std_vector<Node>();
}
