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
const sweep_context_1 = require("./sweep_context");
const sweep_1 = require("./sweep");
/**
 *
 * @author Mason Green <mason.green@gmail.com>
 *
 */
class CDT {
    /**
     * Constructor - add polyline with non repeating points
     *
     * @param polyline
     */
    constructor(polyline) {
        this.sweep_ = new sweep_1.Sweep();
        this.sweep_context_ = new sweep_context_1.SweepContext(polyline);
    }
    /**
     * Destructor - clean up memory
     */
    // ~CDT();
    destructor() {
        // delete sweep_context_;
        this.sweep_context_.destructor();
        // delete sweep_;
        this.sweep_.destructor();
    }
    /**
     * Add a hole
     *
     * @param polyline
     */
    // void AddHole(std::vector<Point*> polyline);
    AddHole(polyline) {
        this.sweep_context_.AddHole(polyline);
    }
    /**
     * Add a steiner point
     *
     * @param point
     */
    // void AddPoint(Point* point);
    AddPoint(point) {
        this.sweep_context_.AddPoint(point);
    }
    /**
     * Triangulate - do this AFTER you've added the polyline, holes, and Steiner points
     */
    Triangulate() {
        this.sweep_.Triangulate(this.sweep_context_);
    }
    /**
     * Get CDT triangles
     */
    // std::vector<Triangle*> GetTriangles();
    GetTriangles() {
        return this.sweep_context_.GetTriangles();
    }
    /**
     * Get triangle map
     */
    // std::list<Triangle*> GetMap();
    GetMap() {
        return this.sweep_context_.GetMap();
    }
}
exports.CDT = CDT;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2R0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2R0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7O0FBSUgsbURBQStDO0FBQy9DLG1DQUFnQztBQUVoQzs7OztHQUlHO0FBRUg7SUFDRTs7OztPQUlHO0lBQ0gsWUFBWSxRQUEyQjtRQStEL0IsV0FBTSxHQUFVLElBQUksYUFBSyxFQUFFLENBQUM7UUE5RGxDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSw0QkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVU7SUFDVixVQUFVO1FBQ1IseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDakMsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCw4Q0FBOEM7SUFDdkMsT0FBTyxDQUFDLFFBQTJCO1FBQ3hDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsK0JBQStCO0lBQ3hCLFFBQVEsQ0FBQyxLQUFZO1FBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7T0FFRztJQUNJLFdBQVc7UUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7T0FFRztJQUNILHlDQUF5QztJQUNsQyxZQUFZO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxpQ0FBaUM7SUFDMUIsTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0NBUUY7QUF0RUQsa0JBc0VDIn0=