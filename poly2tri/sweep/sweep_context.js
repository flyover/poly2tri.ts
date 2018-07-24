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
const shapes_1 = require("../common/shapes");
const shapes_2 = require("../common/shapes");
const advancing_front_1 = require("./advancing_front");
// Inital triangle factor, seed triangle will extend 30% of
// PointSet width to both left and right.
const kAlpha = 0.3;
class SweepContext {
    /// Constructor
    constructor(polyline) {
        this.edge_list = new shapes_1.std_vector();
        this.basin = new SweepContext.Basin();
        this.edge_event = new SweepContext.EdgeEvent();
        this.triangles_ = new shapes_1.std_vector();
        this.map_ = new shapes_1.std_list();
        // Advancing front
        // AdvancingFront* front_;
        this.front_ = null;
        // head point used with advancing front
        this.head_ = null;
        // tail point used with advancing front
        this.tail_ = null;
        this.af_head_ = null;
        this.af_middle_ = null;
        this.af_tail_ = null;
        this.points_ = polyline.clone();
        this.InitEdges(this.points_);
    }
    /// Destructor
    destructor() {
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
    set_head(p1) {
        this.head_ = p1;
    }
    // Point* head();
    head() {
        return this.head_;
    }
    // void set_tail(Point* p1);
    set_tail(p1) {
        this.tail_ = p1;
    }
    // Point* tail();
    tail() {
        return this.tail_;
    }
    // int point_count();
    point_count() {
        return this.points_.size();
    }
    // Node& LocateNode(Point& point);
    LocateNode(point) {
        // TODO implement search tree
        // return *front_->LocateNode(point.x);
        if (this.front_ === null) {
            throw new Error("this.front_ === null");
        }
        const node = this.front_.LocateNode(point.x);
        if (node === null) {
            throw new Error("node === null");
        }
        return node;
    }
    // void RemoveNode(Node* node);
    RemoveNode(node) {
        // delete node;
    }
    // void CreateAdvancingFront(std::vector<Node*> nodes);
    CreateAdvancingFront(nodes) {
        // (void) nodes;
        // Initial triangle
        // Triangle* triangle = new Triangle(*points_[0], *tail_, *head_);
        if (this.head_ === null) {
            throw new Error("this.head_ === null");
        }
        if (this.tail_ === null) {
            throw new Error("this.tail_ === null");
        }
        const triangle = new shapes_2.Triangle(this.points_.at(0), this.tail_, this.head_);
        this.map_.push_back(triangle);
        this.af_head_ = new advancing_front_1.Node(triangle.GetPoint(1), triangle);
        this.af_middle_ = new advancing_front_1.Node(triangle.GetPoint(0), triangle);
        this.af_tail_ = new advancing_front_1.Node(triangle.GetPoint(2));
        this.front_ = new advancing_front_1.AdvancingFront(this.af_head_, this.af_tail_);
        // TODO: More intuitive if head is middles next and not previous?
        //       so swap head and tail
        this.af_head_.next = this.af_middle_;
        this.af_middle_.next = this.af_tail_;
        this.af_middle_.prev = this.af_head_;
        this.af_tail_.prev = this.af_middle_;
    }
    /// Try to map a node to all sides of this triangle that don't have a neighbor
    // void MapTriangleToNodes(Triangle& t);
    MapTriangleToNodes(t) {
        if (this.front_ === null) {
            throw new Error("this.front_ === null");
        }
        for (let i = 0; i < 3; i++) {
            if (!t.GetNeighbor(i)) {
                // Node* n = front_->LocatePoint(t.PointCW(*t.GetPoint(i)));
                const n = this.front_.LocatePoint(t.PointCW(t.GetPoint(i)));
                if (n)
                    n.triangle = t;
            }
        }
    }
    // void AddToMap(Triangle* triangle);
    AddToMap(triangle) {
        this.map_.push_back(triangle);
    }
    // Point* GetPoint(const int& index);
    GetPoint(index) {
        return this.points_.at(index);
    }
    // Point* GetPoints();
    GetPoints() { throw new Error("TODO"); }
    // void RemoveFromMap(Triangle* triangle);
    RemoveFromMap(triangle) {
        this.map_.remove(triangle);
    }
    // void AddHole(std::vector<Point*> polyline);
    AddHole(polyline) {
        this.InitEdges(polyline);
        for (let i = 0; i < polyline.size(); i++) {
            this.points_.push_back(polyline.at(i));
        }
    }
    // void AddPoint(Point* point);
    AddPoint(point) {
        this.points_.push_back(point);
    }
    // AdvancingFront* front();
    front() {
        return this.front_;
    }
    // void MeshClean(Triangle& triangle);
    MeshClean(triangle) {
        const triangles = new shapes_1.std_vector();
        triangles.push_back(triangle);
        while (!triangles.empty()) {
            const t = triangles.back();
            triangles.pop_back();
            if (t !== null && !t.IsInterior()) {
                t.IsInterior(true);
                this.triangles_.push_back(t);
                for (let i = 0; i < 3; i++) {
                    if (!t.constrained_edge[i]) {
                        // triangles.push_back(t.GetNeighbor(i));
                        const neighbor = t.GetNeighbor(i);
                        if (neighbor === null) {
                            throw new Error("neighbor === null");
                        }
                        triangles.push_back(neighbor);
                    }
                }
            }
        }
    }
    // std::vector<Triangle*> GetTriangles();
    GetTriangles() {
        return this.triangles_;
    }
    // std::list<Triangle*> GetMap();
    GetMap() {
        return this.map_;
    }
    // void InitTriangulation();
    InitTriangulation() {
        // double xmax(points_[0]->x), xmin(points_[0]->x);
        // double ymax(points_[0]->y), ymin(points_[0]->y);
        let xmax = this.points_.at(0).x, xmin = this.points_.at(0).x;
        let ymax = this.points_.at(0).y, ymin = this.points_.at(0).y;
        // Calculate bounds.
        for (let i = 0; i < this.points_.size(); i++) {
            const p = this.points_.at(i);
            if (p.x > xmax)
                xmax = p.x;
            if (p.x < xmin)
                xmin = p.x;
            if (p.y > ymax)
                ymax = p.y;
            if (p.y < ymin)
                ymin = p.y;
        }
        const dx = kAlpha * (xmax - xmin);
        const dy = kAlpha * (ymax - ymin);
        // head_ = new Point(xmax + dx, ymin - dy);
        this.head_ = new shapes_2.Point(xmax + dx, ymin - dy);
        // tail_ = new Point(xmin - dx, ymin - dy);
        this.tail_ = new shapes_2.Point(xmin - dx, ymin - dy);
        // Sort points along y-axis
        // std::sort(points_.begin(), points_.end(), cmp);
        this.points_.sort(shapes_2.cmp);
    }
    // void InitEdges(std::vector<Point*> polyline);
    InitEdges(polyline) {
        const num_points = polyline.size();
        for (let i = 0; i < num_points; i++) {
            const j = i < num_points - 1 ? i + 1 : 0;
            this.edge_list.push_back(new shapes_2.Edge(polyline.at(i), polyline.at(j)));
        }
    }
}
exports.SweepContext = SweepContext;
(function (SweepContext) {
    class Basin {
        constructor() {
            this.left_node = null;
            this.bottom_node = null;
            this.right_node = null;
            this.width = 0.0;
            this.left_highest = false;
        }
        Clear() {
            this.left_node = null;
            this.bottom_node = null;
            this.right_node = null;
            this.width = 0.0;
            this.left_highest = false;
        }
    }
    SweepContext.Basin = Basin;
    class EdgeEvent {
        constructor() {
            this.constrained_edge = null;
            this.right = false;
        }
    }
    SweepContext.EdgeEvent = EdgeEvent;
})(SweepContext = exports.SweepContext || (exports.SweepContext = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dlZXBfY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN3ZWVwX2NvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTZCRzs7QUFFSCw2Q0FBd0Q7QUFDeEQsNkNBQThEO0FBQzlELHVEQUF5RDtBQUV6RCwyREFBMkQ7QUFDM0QseUNBQXlDO0FBQ3pDLE1BQU0sTUFBTSxHQUFXLEdBQUcsQ0FBQztBQUUzQjtJQUNFLGVBQWU7SUFDZixZQUFZLFFBQTJCO1FBOEtoQyxjQUFTLEdBQXFCLElBQUksbUJBQVUsRUFBUSxDQUFDO1FBRXJELFVBQUssR0FBdUIsSUFBSSxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckQsZUFBVSxHQUEyQixJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVqRSxlQUFVLEdBQXlCLElBQUksbUJBQVUsRUFBWSxDQUFDO1FBQzlELFNBQUksR0FBdUIsSUFBSSxpQkFBUSxFQUFZLENBQUM7UUFHNUQsa0JBQWtCO1FBQ2xCLDBCQUEwQjtRQUNsQixXQUFNLEdBQTBCLElBQUksQ0FBQztRQUM3Qyx1Q0FBdUM7UUFDL0IsVUFBSyxHQUFpQixJQUFJLENBQUM7UUFDbkMsdUNBQXVDO1FBQy9CLFVBQUssR0FBaUIsSUFBSSxDQUFDO1FBRTNCLGFBQVEsR0FBZ0IsSUFBSSxDQUFDO1FBQzdCLGVBQVUsR0FBZ0IsSUFBSSxDQUFDO1FBQy9CLGFBQVEsR0FBZ0IsSUFBSSxDQUFDO1FBaE1uQyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsY0FBYztJQUNkLFVBQVU7UUFDUixrQkFBa0I7UUFFbEIsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixpQkFBaUI7UUFDakIsbUJBQW1CO1FB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