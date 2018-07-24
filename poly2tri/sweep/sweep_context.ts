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

import { std_vector, std_list } from "../common/shapes";
import { Point, Edge, Triangle, cmp } from "../common/shapes";
import { AdvancingFront, Node } from "./advancing_front";

// Inital triangle factor, seed triangle will extend 30% of
// PointSet width to both left and right.
const kAlpha: number = 0.3;

export class SweepContext {
  /// Constructor
  constructor(polyline: std_vector<Point>) {
    this.points_ = polyline.clone();
    this.InitEdges(this.points_);
  }
  /// Destructor
  destructor(): void {
    // Clean up memory

    // delete head_;
    // delete tail_;
    // delete front_;
    // delete af_head_;
    // delete af_middle_;
    // delete af_tail_;

    // typedef std::list<Triangle*> type_list;

    // for(type_list::iterator iter = map_.begin(); iter !== map_.end(); ++iter) {
    //     Triangle* ptr = *iter;
    //     delete ptr;
    // }

    // for(unsigned int i = 0; i < edge_list.size(); i++) {
    //     delete edge_list[i];
    // }
  }

  // void set_head(Point* p1);
  public set_head(p1: Point | null): void {
    this.head_ = p1;
  }

  // Point* head();
  public head(): Point | null {
    return this.head_;
  }

  // void set_tail(Point* p1);
  public set_tail(p1: Point | null): void {
    this.tail_ = p1;
  }

  // Point* tail();
  public tail(): Point | null {
    return this.tail_;
  }

  // int point_count();
  public point_count(): number {
    return this.points_.size();
  }

  // Node& LocateNode(Point& point);
  public LocateNode(point: Point): Node {
    // TODO implement search tree
    // return *front_->LocateNode(point.x);
    if (this.front_ === null) { throw new Error("this.front_ === null"); }
    const node: Node | null = this.front_.LocateNode(point.x);
    if (node === null) { throw new Error("node === null"); }
    return node;
  }

  // void RemoveNode(Node* node);
  public RemoveNode(node: Node): void {
    // delete node;
  }

  // void CreateAdvancingFront(std::vector<Node*> nodes);
  public CreateAdvancingFront(nodes: std_vector<Node>): void {
    // (void) nodes;
    // Initial triangle
    // Triangle* triangle = new Triangle(*points_[0], *tail_, *head_);
    if (this.head_ === null) { throw new Error("this.head_ === null"); }
    if (this.tail_ === null) { throw new Error("this.tail_ === null"); }
    const triangle: Triangle = new Triangle(this.points_.at(0), this.tail_, this.head_);

    this.map_.push_back(triangle);

    this.af_head_ = new Node(triangle.GetPoint(1), triangle);
    this.af_middle_ = new Node(triangle.GetPoint(0), triangle);
    this.af_tail_ = new Node(triangle.GetPoint(2));
    this.front_ = new AdvancingFront(this.af_head_, this.af_tail_);

    // TODO: More intuitive if head is middles next and not previous?
    //       so swap head and tail
    this.af_head_.next = this.af_middle_;
    this.af_middle_.next = this.af_tail_;
    this.af_middle_.prev = this.af_head_;
    this.af_tail_.prev = this.af_middle_;
  }

  /// Try to map a node to all sides of this triangle that don't have a neighbor
  // void MapTriangleToNodes(Triangle& t);
  public MapTriangleToNodes(t: Triangle): void {
    if (this.front_ === null) { throw new Error("this.front_ === null"); }
    for (let i = 0; i < 3; i++) {
      if (!t.GetNeighbor(i)) {
        // Node* n = front_->LocatePoint(t.PointCW(*t.GetPoint(i)));
        const n: Node | null = this.front_.LocatePoint(t.PointCW(t.GetPoint(i)));
        if (n)
          n.triangle = t;
      }
    }
  }

  // void AddToMap(Triangle* triangle);
  public AddToMap(triangle: Triangle): void {
    this.map_.push_back(triangle);
  }

  // Point* GetPoint(const int& index);
  public GetPoint(index: number): Point {
    return this.points_.at(index);
  }

  // Point* GetPoints();
  public GetPoints(): Point[] { throw new Error("TODO"); }

  // void RemoveFromMap(Triangle* triangle);
  public RemoveFromMap(triangle: Triangle): void {
    this.map_.remove(triangle);
  }

  // void AddHole(std::vector<Point*> polyline);
  public AddHole(polyline: std_vector<Point>): void {
    this.InitEdges(polyline);
    for (let i = 0; i < polyline.size(); i++) {
      this.points_.push_back(polyline.at(i));
    }
  }

  // void AddPoint(Point* point);
  public AddPoint(point: Point): void {
    this.points_.push_back(point);
  }

  // AdvancingFront* front();
  public front(): AdvancingFront | null {
    return this.front_;
  }

  // void MeshClean(Triangle& triangle);
  public MeshClean(triangle: Triangle): void {
    const triangles: std_vector<Triangle> = new std_vector<Triangle>();
    triangles.push_back(triangle);

    while (!triangles.empty()) {
      const t: Triangle = triangles.back();
      triangles.pop_back();

      if (t !== null && !t.IsInterior()) {
        t.IsInterior(true);
        this.triangles_.push_back(t);
        for (let i = 0; i < 3; i++) {
          if (!t.constrained_edge[i]) {
            // triangles.push_back(t.GetNeighbor(i));
            const neighbor = t.GetNeighbor(i);
            if (neighbor === null) { throw new Error("neighbor === null"); }
            triangles.push_back(neighbor);
          }
        }
      }
    }
  }

  // std::vector<Triangle*> GetTriangles();
  public GetTriangles(): std_vector<Triangle> {
    return this.triangles_;
  }
  // std::list<Triangle*> GetMap();
  public GetMap(): std_list<Triangle> {
    return this.map_;
  }

  public edge_list: std_vector<Edge> = new std_vector<Edge>();

  public basin: SweepContext.Basin = new SweepContext.Basin();
  public edge_event: SweepContext.EdgeEvent = new SweepContext.EdgeEvent();

  private triangles_: std_vector<Triangle> = new std_vector<Triangle>();
  private map_: std_list<Triangle> = new std_list<Triangle>();
  private points_: std_vector<Point>;

  // Advancing front
  // AdvancingFront* front_;
  private front_: AdvancingFront | null = null;
  // head point used with advancing front
  private head_: Point | null = null;
  // tail point used with advancing front
  private tail_: Point | null = null;

  private af_head_: Node | null = null;
  private af_middle_: Node | null = null;
  private af_tail_: Node | null = null;

  // void InitTriangulation();
  public InitTriangulation(): void {
    // double xmax(points_[0]->x), xmin(points_[0]->x);
    // double ymax(points_[0]->y), ymin(points_[0]->y);
    let xmax = this.points_.at(0).x, xmin = this.points_.at(0).x;
    let ymax = this.points_.at(0).y, ymin = this.points_.at(0).y;

    // Calculate bounds.
    for (let i = 0; i < this.points_.size(); i++) {
      const p: Point = this.points_.at(i);
      if (p.x > xmax)
        xmax = p.x;
      if (p.x < xmin)
        xmin = p.x;
      if (p.y > ymax)
        ymax = p.y;
      if (p.y < ymin)
        ymin = p.y;
    }

    const dx: number = kAlpha * (xmax - xmin);
    const dy: number = kAlpha * (ymax - ymin);
    // head_ = new Point(xmax + dx, ymin - dy);
    this.head_ = new Point(xmax + dx, ymin - dy);
    // tail_ = new Point(xmin - dx, ymin - dy);
    this.tail_ = new Point(xmin - dx, ymin - dy);

    // Sort points along y-axis
    // std::sort(points_.begin(), points_.end(), cmp);
    this.points_.sort(cmp);
  }
  // void InitEdges(std::vector<Point*> polyline);
  private InitEdges(polyline: std_vector<Point>): void {
    const num_points: number = polyline.size();
    for (let i = 0; i < num_points; i++) {
      const j: number = i < num_points - 1 ? i + 1 : 0;
      this.edge_list.push_back(new Edge(polyline.at(i), polyline.at(j)));
    }
  }
}

export namespace SweepContext {
  export class Basin {
    left_node: Node | null = null;
    bottom_node: Node | null = null;
    right_node: Node | null = null;
    width: number = 0.0;
    left_highest: boolean = false;

    Clear(): void {
      this.left_node = null;
      this.bottom_node = null;
      this.right_node = null;
      this.width = 0.0;
      this.left_highest = false;
    }
  }

  export class EdgeEvent {
    constrained_edge: Edge | null = null;
    right: boolean = false;
  }
}
