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
/**
 * Sweep-line, Constrained Delauney Triangulation (CDT) See: Domiter, V. and
 * Zalik, B.(2008)'Sweep-line algorithm for constrained Delaunay triangulation',
 * International Journal of Geographical Information Science
 *
 * "FlipScan" Constrained Edge Algorithm invented by Thomas �hl�n, thahlen@gmail.com
 */
Object.defineProperty(exports, "__esModule", { value: true });
const shapes_1 = require("../common/shapes");
const utils_1 = require("../common/utils");
const shapes_2 = require("../common/shapes");
const advancing_front_1 = require("./advancing_front");
class Sweep {
    constructor() {
        // std::vector<Node*> nodes_;
        this.nodes_ = new shapes_1.std_vector();
    }
    /**
     * Triangulate
     *
     * @param tcx
     */
    Triangulate(tcx) {
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
    destructor() {
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
    SweepPoints(tcx) {
        for (let i = 1; i < tcx.point_count(); i++) {
            // Point& point = *tcx.GetPoint(i);
            const point = tcx.GetPoint(i);
            // Node* node = &PointEvent(tcx, point);
            const node = this.PointEvent(tcx, point);
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
    PointEvent(tcx, point) {
        // Node& node = tcx.LocateNode(point);
        const node = tcx.LocateNode(point);
        // Node& new_node = NewFrontTriangle(tcx, point, node);
        const new_node = this.NewFrontTriangle(tcx, point, node);
        // Only need to check +epsilon since point never have smaller
        // x value than node due to how we fetch nodes from the front
        if (point.x <= node.point.x + utils_1.EPSILON) {
            this.Fill(tcx, node);
        }
        //tcx.AddNode(new_node);
        this.FillAdvancingFront(tcx, new_node);
        return new_node;
    }
    EdgeEvent(tcx, ...args) {
        if (args.length === 2) {
            this.EdgeEvent_A(tcx, args[0], args[1]);
        }
        else {
            this.EdgeEvent_B(tcx, args[0], args[1], args[2], args[3]);
        }
    }
    // void EdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
    EdgeEvent_A(tcx, edge, node) {
        tcx.edge_event.constrained_edge = edge;
        tcx.edge_event.right = (edge.p.x > edge.q.x);
        if (node.triangle === null) {
            throw new Error();
        }
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
    EdgeEvent_B(tcx, ep, eq, triangle, point) {
        if (this.IsEdgeSideOfTriangle(triangle, ep, eq)) {
            return;
        }
        // Point* p1 = triangle.PointCCW(point);
        const p1 = triangle.PointCCW(point);
        // Orientation o1 = Orient2d(eq, *p1, ep);
        const o1 = utils_1.Orient2d(eq, p1, ep);
        if (o1 === utils_1.Orientation.COLLINEAR) {
            if (triangle.Contains(eq, p1)) {
                triangle.MarkConstrainedEdge(eq, p1);
                // We are modifying the constraint maybe it would be better to 
                // not change the given constraint and just keep a variable for the new constraint
                if (tcx.edge_event.constrained_edge === null) {
                    throw new Error();
                }
                tcx.edge_event.constrained_edge.q = p1;
                triangle = triangle.NeighborAcross(point);
                this.EdgeEvent_B(tcx, ep, p1, triangle, p1);
            }
            else {
                // std::runtime_error("EdgeEvent - collinear points not supported");
                // assert(0);
                throw new Error("EdgeEvent - collinear points not supported");
            }
            return;
        }
        // Point* p2 = triangle.PointCW(point);
        const p2 = triangle.PointCW(point);
        // Orientation o2 = Orient2d(eq, *p2, ep);
        const o2 = utils_1.Orient2d(eq, p2, ep);
        if (o2 === utils_1.Orientation.COLLINEAR) {
            if (triangle.Contains(eq, p2)) {
                triangle.MarkConstrainedEdge(eq, p2);
                // We are modifying the constraint maybe it would be better to 
                // not change the given constraint and just keep a variable for the new constraint
                if (tcx.edge_event.constrained_edge === null) {
                    throw new Error();
                }
                tcx.edge_event.constrained_edge.q = p2;
                triangle = triangle.NeighborAcross(point);
                this.EdgeEvent_B(tcx, ep, p2, triangle, p2);
            }
            else {
                // std::runtime_error("EdgeEvent - collinear points not supported");
                // assert(0);
                throw new Error("EdgeEvent - collinear points not supported");
            }
            return;
        }
        if (o1 === o2) {
            // Need to decide if we are rotating CW or CCW to get to a triangle
            // that will cross edge
            if (o1 === utils_1.Orientation.CW) {
                triangle = triangle.NeighborCCW(point);
            }
            else {
                triangle = triangle.NeighborCW(point);
            }
            this.EdgeEvent_B(tcx, ep, eq, triangle, point);
        }
        else {
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
    NewFrontTriangle(tcx, point, node) {
        // Triangle* triangle = new Triangle(point, *node.point, *node.next.point);
        if (node.next === null) {
            throw new Error();
        }
        const triangle = new shapes_2.Triangle(point, node.point, node.next.point);
        if (node.triangle === null) {
            throw new Error();
        }
        triangle.MarkNeighbor(node.triangle);
        tcx.AddToMap(triangle);
        // Node* new_node = new Node(point);
        const new_node = new advancing_front_1.Node(point);
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
    Fill(tcx, node) {
        // Triangle* triangle = new Triangle(*node.prev.point, *node.point, *node.next.point);
        if (node.prev === null) {
            throw new Error();
        }
        if (node.next === null) {
            throw new Error();
        }
        const triangle = new shapes_2.Triangle(node.prev.point, node.point, node.next.point);
        // TODO: should copy the constrained_edge value from neighbor triangles
        //       for now constrained_edge values are copied during the legalize
        if (node.prev.triangle === null) {
            throw new Error();
        }
        triangle.MarkNeighbor(node.prev.triangle);
        if (node.triangle === null) {
            throw new Error();
        }
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
    Legalize(tcx, t) {
        // To legalize a triangle we start by finding if any of the three edges
        // violate the Delaunay condition
        for (let i = 0; i < 3; i++) {
            if (t.delaunay_edge[i])
                continue;
            // Triangle* ot = t.GetNeighbor(i);
            const ot = t.GetNeighbor(i);
            if (ot) {
                // Point* p = t.GetPoint(i);
                const p = t.GetPoint(i);
                // Point* op = ot.OppositePoint(t, *p);
                const op = ot.OppositePoint(t, p);
                let oi = ot.Index(op);
                // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
                // then we should not try to legalize
                if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                    t.constrained_edge[i] = ot.constrained_edge[oi];
                    continue;
                }
                const inside = this.Incircle(p, t.PointCCW(p), t.PointCW(p), op);
                if (inside) {
                    // Lets mark this shared edge as Delaunay
                    t.delaunay_edge[i] = true;
                    ot.delaunay_edge[oi] = true;
                    // Lets rotate shared edge one vertex CW to legalize it
                    this.RotateTrianglePair(t, p, ot, op);
                    // We now got one valid Delaunay Edge shared by two triangles
                    // This gives us 4 new edges to check for Delaunay
                    // Make sure that triangle to node mapping is done only one time for a specific triangle
                    let not_legalized = !this.Legalize(tcx, t);
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
    Incircle(pa, pb, pc, pd) {
        const adx = pa.x - pd.x;
        const ady = pa.y - pd.y;
        const bdx = pb.x - pd.x;
        const bdy = pb.y - pd.y;
        const adxbdy = adx * bdy;
        const bdxady = bdx * ady;
        const oabd = adxbdy - bdxady;
        if (oabd <= 0)
            return false;
        const cdx = pc.x - pd.x;
        const cdy = pc.y - pd.y;
        const cdxady = cdx * ady;
        const adxcdy = adx * cdy;
        const ocad = cdxady - adxcdy;
        if (ocad <= 0)
            return false;
        const bdxcdy = bdx * cdy;
        const cdxbdy = cdx * bdy;
        const alift = adx * adx + ady * ady;
        const blift = bdx * bdx + bdy * bdy;
        const clift = cdx * cdx + cdy * cdy;
        const det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
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
    RotateTrianglePair(t, p, ot, op) {
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
        if (n1)
            ot.MarkNeighbor(n1);
        if (n2)
            t.MarkNeighbor(n2);
        if (n3)
            t.MarkNeighbor(n3);
        if (n4)
            ot.MarkNeighbor(n4);
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
    FillAdvancingFront(tcx, n) {
        // Fill right holes
        // Node* node = n.next;
        if (n.next === null) {
            throw new Error();
        }
        let node = n.next;
        while (node.next) {
            // if HoleAngle exceeds 90 degrees then break.
            if (this.LargeHole_DontFill(node))
                break;
            this.Fill(tcx, node);
            node = node.next;
        }
        // Fill left holes
        if (n.prev === null) {
            throw new Error();
        }
        node = n.prev;
        while (node.prev) {
            // if HoleAngle exceeds 90 degrees then break.
            if (this.LargeHole_DontFill(node))
                break;
            this.Fill(tcx, node);
            node = node.prev;
        }
        // Fill right basins
        if (n.next && n.next.next) {
            const angle = this.BasinAngle(n);
            if (angle < utils_1.PI_3div4) {
                this.FillBasin(tcx, n);
            }
        }
    }
    // Decision-making about when to Fill hole. 
    // Contributed by ToolmakerSteve2
    // bool LargeHole_DontFill(Node* node);
    LargeHole_DontFill(node) {
        // Node* nextNode = node.next;
        if (node.next === null) {
            throw new Error();
        }
        const nextNode = node.next;
        // Node* prevNode = node.prev;
        if (node.prev === null) {
            throw new Error();
        }
        const prevNode = node.prev;
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
    AngleExceeds90Degrees(origin, pa, pb) {
        const angle = this.Angle(origin, pa, pb);
        const exceeds90Degrees = ((angle > utils_1.PI_div2) || (angle < -utils_1.PI_div2));
        return exceeds90Degrees;
    }
    // bool AngleExceedsPlus90DegreesOrIsNegative(Point* origin, Point* pa, Point* pb);
    AngleExceedsPlus90DegreesOrIsNegative(origin, pa, pb) {
        const angle = this.Angle(origin, pa, pb);
        const exceedsPlus90DegreesOrIsNegative = (angle > utils_1.PI_div2) || (angle < 0);
        return exceedsPlus90DegreesOrIsNegative;
    }
    // double Angle(Point& origin, Point& pa, Point& pb);
    Angle(origin, pa, pb) {
        /* Complex plane
        * ab = cosA +i*sinA
        * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
        * atan2(y,x) computes the principal value of the argument function
        * applied to the complex number x+iy
        * Where x = ax*bx + ay*by
        *       y = ax*by - ay*bx
        */
        const px = origin.x;
        const py = origin.y;
        const ax = pa.x - px;
        const ay = pa.y - py;
        const bx = pb.x - px;
        const by = pb.y - py;
        const x = ax * by - ay * bx;
        const y = ax * bx + ay * by;
        const angle = Math.atan2(x, y);
        return angle;
    }
    /**
     *
     * @param node - middle node
     * @return the angle between 3 front nodes
     */
    // double HoleAngle(Node& node);
    HoleAngle(node) {
        /* Complex plane
        * ab = cosA +i*sinA
        * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
        * atan2(y,x) computes the principal value of the argument function
        * applied to the complex number x+iy
        * Where x = ax*bx + ay*by
        *       y = ax*by - ay*bx
        */
        if (node.next === null) {
            throw new Error();
        }
        const ax = node.next.point.x - node.point.x;
        const ay = node.next.point.y - node.point.y;
        if (node.prev === null) {
            throw new Error();
        }
        const bx = node.prev.point.x - node.point.x;
        const by = node.prev.point.y - node.point.y;
        return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    }
    /**
     * The basin angle is decided against the horizontal line [1,0]
     */
    // double BasinAngle(Node& node);
    BasinAngle(node) {
        if (node.next == null || node.next.next === null) {
            throw new Error();
        }
        const ax = node.point.x - node.next.next.point.x;
        const ay = node.point.y - node.next.next.point.y;
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
    FillBasin(tcx, node) {
        if (node.next == null || node.next.next === null) {
            throw new Error();
        }
        if (utils_1.Orient2d(node.point, node.next.point, node.next.next.point) === utils_1.Orientation.CCW) {
            tcx.basin.left_node = node.next.next;
        }
        else {
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
    FillBasinReq(tcx, node) {
        // if shallow stop filling
        if (this.IsShallow(tcx, node)) {
            return;
        }
        this.Fill(tcx, node);
        if (node.prev === tcx.basin.left_node && node.next === tcx.basin.right_node) {
            return;
        }
        else if (node.prev === tcx.basin.left_node) {
            if (node.next === null || node.next.next === null) {
                throw new Error();
            }
            const o = utils_1.Orient2d(node.point, node.next.point, node.next.next.point);
            if (o === utils_1.Orientation.CW) {
                return;
            }
            node = node.next;
        }
        else if (node.next === tcx.basin.right_node) {
            if (node.prev === null || node.prev.prev === null) {
                throw new Error();
            }
            const o = utils_1.Orient2d(node.point, node.prev.point, node.prev.prev.point);
            if (o === utils_1.Orientation.CCW) {
                return;
            }
            node = node.prev;
        }
        else {
            // Continue with the neighbor node with lowest Y value
            if (node.next === null || node.prev === null) {
                throw new Error();
            }
            if (node.prev.point.y < node.next.point.y) {
                node = node.prev;
            }
            else {
                node = node.next;
            }
        }
        this.FillBasinReq(tcx, node);
    }
    // bool IsShallow(SweepContext& tcx, Node& node);
    IsShallow(tcx, node) {
        let height;
        if (tcx.basin.left_highest) {
            if (tcx.basin.left_node === null) {
                throw new Error();
            }
            height = tcx.basin.left_node.point.y - node.point.y;
        }
        else {
            if (tcx.basin.right_node === null) {
                throw new Error();
            }
            height = tcx.basin.right_node.point.y - node.point.y;
        }
        // if shallow stop filling
        if (tcx.basin.width > height) {
            return true;
        }
        return false;
    }
    // bool IsEdgeSideOfTriangle(Triangle& triangle, Point& ep, Point& eq);
    IsEdgeSideOfTriangle(triangle, ep, eq) {
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
    FillEdgeEvent(tcx, edge, node) {
        if (tcx.edge_event.right) {
            this.FillRightAboveEdgeEvent(tcx, edge, node);
        }
        else {
            this.FillLeftAboveEdgeEvent(tcx, edge, node);
        }
    }
    // void FillRightAboveEdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
    FillRightAboveEdgeEvent(tcx, edge, node) {
        if (node.next === null) {
            throw new Error();
        }
        while (node.next !== null && node.next.point.x < edge.p.x) {
            // Check if next node is below the edge
            if (utils_1.Orient2d(edge.q, node.next.point, edge.p) === utils_1.Orientation.CCW) {
                this.FillRightBelowEdgeEvent(tcx, edge, node);
            }
            else {
                node = node.next;
            }
        }
    }
    // void FillRightBelowEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillRightBelowEdgeEvent(tcx, edge, node) {
        if (node.point.x < edge.p.x) {
            if (node.next === null || node.next.next === null) {
                throw new Error();
            }
            if (utils_1.Orient2d(node.point, node.next.point, node.next.next.point) === utils_1.Orientation.CCW) {
                // Concave
                this.FillRightConcaveEdgeEvent(tcx, edge, node);
            }
            else {
                // Convex
                this.FillRightConvexEdgeEvent(tcx, edge, node);
                // Retry this one
                this.FillRightBelowEdgeEvent(tcx, edge, node);
            }
        }
    }
    // void FillRightConcaveEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillRightConcaveEdgeEvent(tcx, edge, node) {
        if (node.next === null) {
            throw new Error();
        }
        this.Fill(tcx, node.next);
        if (node.next.point !== edge.p) {
            // Next above or below edge?
            if (utils_1.Orient2d(edge.q, node.next.point, edge.p) === utils_1.Orientation.CCW) {
                // Below
                if (node.next.next === null) {
                    throw new Error();
                }
                if (utils_1.Orient2d(node.point, node.next.point, node.next.next.point) === utils_1.Orientation.CCW) {
                    // Next is concave
                    this.FillRightConcaveEdgeEvent(tcx, edge, node);
                }
                else {
                    // Next is convex
                }
            }
        }
    }
    // void FillRightConvexEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillRightConvexEdgeEvent(tcx, edge, node) {
        // Next concave or convex?
        if (node.next === null || node.next.next === null || node.next.next.next === null) {
            throw new Error();
        }
        if (utils_1.Orient2d(node.next.point, node.next.next.point, node.next.next.next.point) === utils_1.Orientation.CCW) {
            // Concave
            this.FillRightConcaveEdgeEvent(tcx, edge, node.next);
        }
        else {
            // Convex
            // Next above or below edge?
            if (utils_1.Orient2d(edge.q, node.next.next.point, edge.p) === utils_1.Orientation.CCW) {
                // Below
                this.FillRightConvexEdgeEvent(tcx, edge, node.next);
            }
            else {
                // Above
            }
        }
    }
    // void FillLeftAboveEdgeEvent(SweepContext& tcx, Edge* edge, Node* node);
    FillLeftAboveEdgeEvent(tcx, edge, node) {
        if (node.prev === null) {
            throw new Error();
        }
        while (node.prev !== null && node.prev.point.x > edge.p.x) {
            // Check if next node is below the edge
            if (utils_1.Orient2d(edge.q, node.prev.point, edge.p) === utils_1.Orientation.CW) {
                this.FillLeftBelowEdgeEvent(tcx, edge, node);
            }
            else {
                node = node.prev;
            }
        }
    }
    // void FillLeftBelowEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillLeftBelowEdgeEvent(tcx, edge, node) {
        if (node.point.x > edge.p.x) {
            if (node.prev === null || node.prev.prev === null) {
                throw new Error();
            }
            if (utils_1.Orient2d(node.point, node.prev.point, node.prev.prev.point) === utils_1.Orientation.CW) {
                // Concave
                this.FillLeftConcaveEdgeEvent(tcx, edge, node);
            }
            else {
                // Convex
                this.FillLeftConvexEdgeEvent(tcx, edge, node);
                // Retry this one
                this.FillLeftBelowEdgeEvent(tcx, edge, node);
            }
        }
    }
    // void FillLeftConcaveEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillLeftConcaveEdgeEvent(tcx, edge, node) {
        if (node.prev === null) {
            throw new Error();
        }
        this.Fill(tcx, node.prev);
        if (node.prev.point !== edge.p) {
            // Next above or below edge?
            if (utils_1.Orient2d(edge.q, node.prev.point, edge.p) === utils_1.Orientation.CW) {
                // Below
                if (node.prev.prev === null) {
                    throw new Error();
                }
                if (utils_1.Orient2d(node.point, node.prev.point, node.prev.prev.point) === utils_1.Orientation.CW) {
                    // Next is concave
                    this.FillLeftConcaveEdgeEvent(tcx, edge, node);
                }
                else {
                    // Next is convex
                }
            }
        }
    }
    // void FillLeftConvexEdgeEvent(SweepContext& tcx, Edge* edge, Node& node);
    FillLeftConvexEdgeEvent(tcx, edge, node) {
        // Next concave or convex?
        if (node.prev === null || node.prev.prev === null || node.prev.prev.prev === null) {
            throw new Error();
        }
        if (utils_1.Orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) === utils_1.Orientation.CW) {
            // Concave
            this.FillLeftConcaveEdgeEvent(tcx, edge, node.prev);
        }
        else {
            // Convex
            // Next above or below edge?
            if (utils_1.Orient2d(edge.q, node.prev.prev.point, edge.p) === utils_1.Orientation.CW) {
                // Below
                this.FillLeftConvexEdgeEvent(tcx, edge, node.prev);
            }
            else {
                // Above
            }
        }
    }
    // void FlipEdgeEvent(SweepContext& tcx, Point& ep, Point& eq, Triangle* t, Point& p);
    FlipEdgeEvent(tcx, ep, eq, t, p) {
        // Triangle& ot = t.NeighborAcross(p);
        const ot = t.NeighborAcross(p);
        // Point& op = *ot.OppositePoint(*t, p);
        const op = ot.OppositePoint(t, p);
        if (ot === null) {
            // If we want to integrate the fillEdgeEvent do it here
            // With current implementation we should never get here
            //throw new RuntimeException( "[BUG:FIXME] FLIP failed due to missing triangle");
            throw new Error("[BUG:FIXME] FLIP failed due to missing triangle");
        }
        if (utils_1.InScanArea(p, t.PointCCW(p), t.PointCW(p), op)) {
            // Lets rotate shared edge one vertex CW
            this.RotateTrianglePair(t, p, ot, op);
            tcx.MapTriangleToNodes(t);
            tcx.MapTriangleToNodes(ot);
            if (p === eq && op === ep) {
                if (tcx.edge_event.constrained_edge === null) {
                    throw new Error();
                }
                if (eq === tcx.edge_event.constrained_edge.q && ep === tcx.edge_event.constrained_edge.p) {
                    t.MarkConstrainedEdge(ep, eq);
                    ot.MarkConstrainedEdge(ep, eq);
                    this.Legalize(tcx, t);
                    this.Legalize(tcx, ot);
                }
                else {
                    // XXX: I think one of the triangles should be legalized here?
                }
            }
            else {
                const o = utils_1.Orient2d(eq, op, ep);
                // t = &NextFlipTriangle(tcx, (int)o, *t, ot, p, op);
                t = this.NextFlipTriangle(tcx, o, t, ot, p, op);
                this.FlipEdgeEvent(tcx, ep, eq, t, p);
            }
        }
        else {
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
    NextFlipTriangle(tcx, o, t, ot, p, op) {
        if (o === utils_1.Orientation.CCW) {
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
    NextFlipPoint(ep, eq, ot, op) {
        const o2d = utils_1.Orient2d(eq, op, ep);
        if (o2d === utils_1.Orientation.CW) {
            // Right
            return ot.PointCCW(op);
        }
        else if (o2d === utils_1.Orientation.CCW) {
            // Left
            return ot.PointCW(op);
        }
        else {
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
    FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, t, p) {
        // Triangle& ot = t.NeighborAcross(p);
        const ot = t.NeighborAcross(p);
        // Point& op = *ot.OppositePoint(t, p);
        const op = ot.OppositePoint(t, p);
        if (t.NeighborAcross(p) === null) {
            // If we want to integrate the fillEdgeEvent do it here
            // With current implementation we should never get here
            //throw new RuntimeException( "[BUG:FIXME] FLIP failed due to missing triangle");
            throw new Error("[BUG:FIXME] FLIP failed due to missing triangle");
        }
        if (utils_1.InScanArea(eq, flip_triangle.PointCCW(eq), flip_triangle.PointCW(eq), op)) {
            // flip with new edge op.eq
            this.FlipEdgeEvent(tcx, eq, op, ot, op);
            // TODO: Actually I just figured out that it should be possible to
            //       improve this by getting the next ot and op before the the above
            //       flip and continue the flipScanEdgeEvent here
            // set new ot and op here and loop back to inScanArea test
            // also need to set a new flip_triangle first
            // Turns out at first glance that this is somewhat complicated
            // so it will have to wait.
        }
        else {
            // Point& newP = NextFlipPoint(ep, eq, ot, op);
            const newP = this.NextFlipPoint(ep, eq, ot, op);
            this.FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
        }
    }
    // void FinalizationPolygon(SweepContext& tcx);
    FinalizationPolygon(tcx) {
        // Get an Internal triangle to start with
        // Triangle* t = tcx.front().head().next.triangle;
        // Point* p = tcx.front().head().next.point;
        const front = tcx.front();
        if (front === null) {
            throw new Error();
        }
        const head = front.head();
        const next = head.next;
        if (next === null) {
            throw new Error();
        }
        let t = next.triangle;
        if (t === null) {
            throw new Error();
        }
        const p = next.point;
        while (!t.GetConstrainedEdgeCW(p)) {
            t = t.NeighborCCW(p);
        }
        // Collect interior triangles constrained by edges
        tcx.MeshClean(t);
    }
}
exports.Sweep = Sweep;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dlZXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzd2VlcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0g7Ozs7OztHQU1HOztBQUVILDZDQUE4QztBQUM5QywyQ0FBZ0c7QUFDaEcsNkNBQXlEO0FBRXpELHVEQUF5QztBQUV6QztJQUFBO1FBdStCRSw2QkFBNkI7UUFDckIsV0FBTSxHQUFxQixJQUFJLG1CQUFVLEVBQVEsQ0FBQztJQUM1RCxDQUFDO0lBeCtCQzs7OztPQUlHO0lBQ0ksV0FBVyxDQUFDLEdBQWlCO1FBQ2xDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsMkJBQTJCO1FBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEIsV0FBVztRQUNYLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZO0lBQ0wsVUFBVTtRQUNmLGtCQUFrQjtRQUNsQiwyQ0FBMkM7UUFDM0Msd0JBQXdCO1FBQ3hCLElBQUk7SUFDTixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHVDQUF1QztJQUMvQixXQUFXLENBQUMsR0FBaUI7UUFDbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxtQ0FBbUM7WUFDbkMsTUFBTSxLQUFLLEdBQVUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyx3Q0FBd0M7WUFDeEMsTUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsS0FBSyxJQUFJ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