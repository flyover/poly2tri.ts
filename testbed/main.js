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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const poly2tri_1 = require("../poly2tri/poly2tri");
const poly2tri_2 = require("../poly2tri/poly2tri");
let canvas = null;
let ctx = null;
let rotate_y = 0;
let rotate_z = 0;
const rotations_per_tick = .2;
/// Screen center x
let cx = 0.0;
/// Screen center y
let cy = 0.0;
/// Constrained triangles
let triangles;
/// Triangle map
let map;
/// Polylines
const polylines = new poly2tri_1.std_vector();
/// Draw the entire triangle map?
let draw_map = false;
/// Create a random distribution of points?
let random_distribution = false;
// template <class C> void FreeClear( C & cntr ) {
//     for ( typename C::iterator it = cntr.begin();
//               it !== cntr.end(); ++it ) {
//         delete * it;
//     }
//     cntr.clear();
// }
function main(...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let num_points = 0;
        let max = 0;
        let min = 0;
        let zoom = 1;
        if (args.length !== 5) {
            console.log(args);
            console.log("-== USAGE ==-");
            console.log("Load Data File: p2t filename center_x center_y zoom");
            console.log("Example: ./build/p2t testbed/data/dude.dat 500 500 1");
            return 1;
        }
        if (args[1] === "random") {
            num_points = parseInt(args[2]);
            random_distribution = true;
            max = parseFloat(args[3]);
            min = -max;
            cx = cy = 0;
            zoom = parseFloat(args[4]);
        }
        else {
            zoom = parseFloat(args[4]);
            cx = parseFloat(args[2]);
            cy = parseFloat(args[3]);
        }
        const polyline = new poly2tri_1.std_vector();
        if (random_distribution) {
            // Create a simple bounding box
            polyline.push_back(new poly2tri_2.Point(min, min));
            polyline.push_back(new poly2tri_2.Point(min, max));
            polyline.push_back(new poly2tri_2.Point(max, max));
            polyline.push_back(new poly2tri_2.Point(max, min));
        }
        else {
            // Load pointset from file
            // Parse and tokenize data file
            // string line;
            // ifstream myfile(argv[1]);
            // if (myfile.is_open()) {
            //   while (!myfile.eof()) {
            //     getline(myfile, line);
            //     if (line.size() === 0) {
            //       break;
            //     }
            //     istringstream iss(line);
            //     vector<string> tokens;
            //     copy(istream_iterator<string>(iss), istream_iterator<string>(),
            //          back_inserter<vector<string> >(tokens));
            //     double x = StringToDouble(tokens[0]);
            //     double y = StringToDouble(tokens[1]);
            //     polyline.push_back(new Point(x, y));
            //     num_points++;
            //   }
            //   myfile.close();
            // } else {
            //   console.log("File not opened");
            // }
            try {
                const response = yield fetch(args[1]);
                const buffer = yield response.text();
                const lines = buffer.split(/[\n,\r\n]/);
                lines.forEach((line, index) => {
                    if (line.length === 0) {
                        return;
                    }
                    const tokens = line.split(/ +/);
                    const x = StringToDouble(tokens[0]);
                    const y = StringToDouble(tokens[1]);
                    polyline.push_back(new poly2tri_2.Point(x, y));
                    num_points++;
                });
            }
            catch (e) {
                console.log("File not opened", e);
            }
        }
        console.log("Number of constrained edges = ", polyline.size());
        polylines.push_back(polyline);
        Init();
        /*
         * Perform triangulation!
         */
        const init_time = performance.now();
        /*
         * STEP 1: Create CDT and add primary polyline
         * NOTE: polyline must be a simple polygon. The polyline's points
         * constitute constrained edges. No repeat points!!!
         */
        const cdt = new poly2tri_2.CDT(polyline);
        /*
         * STEP 2: Add holes or Steiner points if necessary
         */
        const s = args[1];
        if (s.search(/dude\.dat/) !== -1) {
            // Add head hole
            const head_hole = CreateHeadHole();
            num_points += head_hole.size();
            cdt.AddHole(head_hole);
            // Add chest hole
            const chest_hole = CreateChestHole();
            num_points += chest_hole.size();
            cdt.AddHole(chest_hole);
            polylines.push_back(head_hole);
            polylines.push_back(chest_hole);
        }
        else if (random_distribution) {
            max -= (1e-4);
            min += (1e-4);
            for (let i = 0; i < num_points; i++) {
                const x = Random(Fun, min, max);
                const y = Random(Fun, min, max);
                cdt.AddPoint(new poly2tri_2.Point(x, y));
            }
        }
        /*
         * STEP 3: Triangulate!
         */
        cdt.Triangulate();
        const dt = performance.now() - init_time;
        triangles = cdt.GetTriangles();
        map = cdt.GetMap();
        console.log("Number of points = ", num_points);
        console.log("Number of triangles = ", triangles.size());
        console.log("Elapsed time (ms) = ", dt);
        MainLoop(zoom);
        // Cleanup
        // delete cdt;
        cdt.destructor();
        // Free points
        for (let i = 0; i < polylines.size(); i++) {
            const poly = polylines.at(i);
            // FreeClear(poly);
        }
        ShutDown(0);
        return 0;
    });
}
exports.default = main;
function Init() {
    const window_width = 800;
    const window_height = 600;
    if (typeof window !== "undefined") {
        canvas = document.createElement("canvas");
        canvas.style.backgroundColor = "black";
        canvas.style.width = window_width + "px";
        canvas.style.height = window_height + "px";
        canvas.width = window_width;
        canvas.height = window_height;
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");
    }
    // if (glfwInit() !== GL_TRUE)
    //   ShutDown(1);
    // 800 x 600, 16 bit color, no depth, alpha or stencil buffers, windowed
    // if (glfwOpenWindow(window_width, window_height, 5, 6, 5, 0, 0, 0, GLFW_WINDOW) !== GL_TRUE)
    //   ShutDown(1);
    // glfwSetWindowTitle("Poly2Tri - C++");
    // glfwSwapInterval(1);
    // glEnable(GL_BLEND);
    // glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    // glClearColor(0.0, 0.0, 0.0, 0.0);
    // glHint(GL_LINE_SMOOTH_HINT, GL_NICEST);
}
function ShutDown(return_code) {
    // glfwTerminate();
    // exit(return_code);
}
function MainLoop(zoom) {
    // the time of the previous frame
    let old_time = performance.now();
    // this just loops as long as the program runs
    let running = true;
    while (running) {
        // calculate time elapsed, and the amount by which stuff rotates
        const current_time = performance.now();
        const delta_rotate = (current_time - old_time) * rotations_per_tick * 360;
        old_time = current_time;
        // escape to quit, arrow keys to rotate view
        // Check if ESC key was pressed or window was closed
        // running = !glfwGetKey(GLFW_KEY_ESC) && glfwGetWindowParam(GLFW_OPENED);
        running = false;
        // if (glfwGetKey(GLFW_KEY_LEFT) === GLFW_PRESS)
        //   rotate_y += delta_rotate;
        // if (glfwGetKey(GLFW_KEY_RIGHT) === GLFW_PRESS)
        //   rotate_y -= delta_rotate;
        // z axis always rotates
        rotate_z += delta_rotate;
        // Draw the scene
        if (draw_map) {
            DrawMap(zoom);
        }
        else {
            Draw(zoom);
        }
        // swap back and front buffers
        // glfwSwapBuffers();
    }
}
// function ResetZoom(zoom: number, cx: number, cy: number, width: number, height: number): void {
//   const left: number = -width / zoom;
//   const right: number = width / zoom;
//   const bottom: number = -height / zoom;
//   const top: number = height / zoom;
//   // Reset viewport
//   glLoadIdentity();
//   glMatrixMode(GL_PROJECTION);
//   glLoadIdentity();
//   // Reset ortho view
//   glOrtho(left, right, bottom, top, 1, -1);
//   glTranslatef(-cx, -cy, 0);
//   glMatrixMode(GL_MODELVIEW);
//   glDisable(GL_DEPTH_TEST);
//   glLoadIdentity();
//   // Clear the screen
//   glClear(GL_COLOR_BUFFER_BIT);
// }
function Draw(zoom) {
    // reset zoom
    // const center = new Point(cx, cy);
    // ResetZoom(zoom, center.x, center.y, 800, 600);
    // for (int i = 0; i < triangles.size(); i++) {
    //   Triangle& t = *triangles[i];
    //   Point& a = *t.GetPoint(0);
    //   Point& b = *t.GetPoint(1);
    //   Point& c = *t.GetPoint(2);
    //   // Red
    //   glColor3f(1, 0, 0);
    //   glBegin(GL_LINE_LOOP);
    //   glVertex2f(a.x, a.y);
    //   glVertex2f(b.x, b.y);
    //   glVertex2f(c.x, c.y);
    //   glEnd();
    // }
    // green
    // glColor3f(0, 1, 0);
    // for(int i = 0; i < polylines.size(); i++) {
    //   vector<Point*> poly = polylines[i];
    //   glBegin(GL_LINE_LOOP);
    //     for(int j = 0; j < poly.size(); j++) {
    //       glVertex2f(poly[j]->x, poly[j]->y);
    //     }
    //   glEnd();
    // }
    if (ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.save();
        ctx.translate(0.5 * w, 0.5 * h);
        const min = new poly2tri_2.Point(Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new poly2tri_2.Point(Number.MIN_VALUE, Number.MIN_VALUE);
        for (let i = 0; i < polylines.size(); ++i) {
            const polyline = polylines.at(i);
            for (let j = 0; j < polyline.size(); ++j) {
                const p = polyline.at(j);
                min.x = Math.min(min.x, p.x);
                min.y = Math.min(min.y, p.y);
                max.x = Math.max(max.x, p.x);
                max.y = Math.max(max.y, p.y);
            }
        }
        const scale_x = w / (max.x - min.x);
        const scale_y = h / (max.y - min.y);
        const scale = Math.min(scale_x, scale_y);
        ctx.scale(scale, scale);
        ctx.lineWidth = 1 / scale;
        const translate_x = -0.5 * (min.x + max.x);
        const translate_y = -0.5 * (min.y + max.y);
        ctx.translate(translate_x, translate_y);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1 / scale;
        for (let i = 0; i < triangles.size(); i++) {
            const t = triangles.at(i);
            const a = t.GetPoint(0);
            const b = t.GetPoint(1);
            const c = t.GetPoint(2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.strokeStyle = "green";
        ctx.lineWidth = 1 / scale;
        for (let i = 0; i < polylines.size(); i++) {
            const poly = polylines.at(i);
            ctx.beginPath();
            for (let j = 0; j < poly.size(); j++) {
                if (j === 0) {
                    ctx.moveTo(poly.at(j).x, poly.at(j).y);
                }
                else {
                    ctx.lineTo(poly.at(j).x, poly.at(j).y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
}
function DrawMap(zoom) {
    // reset zoom
    // const center = new Point(cx, cy);
    // ResetZoom(zoom, center.x, center.y, 800, 600);
    // list<Triangle*>::iterator it;
    // for (it = map.begin(); it != map.end(); it++) {
    //   Triangle& t = **it;
    //   Point& a = *t.GetPoint(0);
    //   Point& b = *t.GetPoint(1);
    //   Point& c = *t.GetPoint(2);
    //   ConstrainedColor(t.constrained_edge[2]);
    //   glBegin(GL_LINES);
    //   glVertex2f(a.x, a.y);
    //   glVertex2f(b.x, b.y);
    //   glEnd( );
    //   ConstrainedColor(t.constrained_edge[0]);
    //   glBegin(GL_LINES);
    //   glVertex2f(b.x, b.y);
    //   glVertex2f(c.x, c.y);
    //   glEnd( );
    //   ConstrainedColor(t.constrained_edge[1]);
    //   glBegin(GL_LINES);
    //   glVertex2f(c.x, c.y);
    //   glVertex2f(a.x, a.y);
    //   glEnd( );
    // }
    if (ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.save();
        ctx.translate(0.5 * w, 0.5 * h);
        const min = new poly2tri_2.Point(Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new poly2tri_2.Point(Number.MIN_VALUE, Number.MIN_VALUE);
        for (let i = 0; i < map.size(); i++) {
            const t = map.at(i);
            for (let j = 0; j < 3; ++j) {
                const p = t.GetPoint(j);
                min.x = Math.min(min.x, p.x);
                min.y = Math.min(min.y, p.y);
                max.x = Math.max(max.x, p.x);
                max.y = Math.max(max.y, p.y);
            }
        }
        const scale_x = w / (max.x - min.x);
        const scale_y = h / (max.y - min.y);
        const scale = Math.min(scale_x, scale_y);
        ctx.scale(scale, scale);
        ctx.lineWidth = 1 / scale;
        const translate_x = -0.5 * (min.x + max.x);
        const translate_y = -0.5 * (min.y + max.y);
        ctx.translate(translate_x, translate_y);
        for (let i = 0; i < map.size(); i++) {
            const t = map.at(i);
            const a = t.GetPoint(0);
            const b = t.GetPoint(1);
            const c = t.GetPoint(2);
            ConstrainedColor(t.constrained_edge[2]);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ConstrainedColor(t.constrained_edge[0]);
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
            ConstrainedColor(t.constrained_edge[1]);
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(a.x, a.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}
function ConstrainedColor(constrain) {
    if (ctx) {
        if (constrain) {
            // Green
            // glColor3f(0, 1, 0);
            ctx.strokeStyle = "green";
        }
        else {
            // Red
            // glColor3f(1, 0, 0);
            ctx.strokeStyle = "red";
        }
    }
}
function CreateHeadHole() {
    const head_hole = new poly2tri_1.std_vector();
    head_hole.push_back(new poly2tri_2.Point(325, 437));
    head_hole.push_back(new poly2tri_2.Point(320, 423));
    head_hole.push_back(new poly2tri_2.Point(329, 413));
    head_hole.push_back(new poly2tri_2.Point(332, 423));
    return head_hole;
}
function CreateChestHole() {
    const chest_hole = new poly2tri_1.std_vector();
    chest_hole.push_back(new poly2tri_2.Point(320.72342, 480));
    chest_hole.push_back(new poly2tri_2.Point(338.90617, 465.96863));
    chest_hole.push_back(new poly2tri_2.Point(347.99754, 480.61584));
    chest_hole.push_back(new poly2tri_2.Point(329.8148, 510.41534));
    chest_hole.push_back(new poly2tri_2.Point(339.91632, 480.11077));
    chest_hole.push_back(new poly2tri_2.Point(334.86556, 478.09046));
    return chest_hole;
}
function StringToDouble(s) {
    return parseFloat(s);
}
function Fun(x) {
    return 2.5 + Math.sin(10 * x) / x;
}
const RAND_MAX = 32767;
let Random_Fun;
let Random_YMin;
let Random_YMax;
let Random_First = true;
function Random(fun, xmin = 0, xmax = 1) {
    // static double (*Fun)(double) = null, YMin, YMax;
    // static bool First = true;
    // Initialises random generator for first call
    if (Random_First) {
        Random_First = false;
        // srand((unsigned) time(null));
    }
    // Evaluates maximum of function
    if (fun !== Random_Fun) {
        Random_Fun = fun;
        Random_YMin = 0, Random_YMax = Random_Fun(xmin);
        for (let iX = 1; iX < RAND_MAX; iX++) {
            const X = xmin + (xmax - xmin) * iX / RAND_MAX;
            const Y = Random_Fun(X);
            Random_YMax = Y > Random_YMax ? Y : Random_YMax;
        }
    }
    // Gets random values for X & Y
    const X = xmin + (xmax - xmin) * Math.random(); // rand() / RAND_MAX;
    const Y = Random_YMin + (Random_YMax - Random_YMin) * Math.random(); // rand() / RAND_MAX;
    // Returns if valid and try again if not valid
    return Y < fun(X) ? X : Random(Random_Fun, xmin, xmax);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTZCRzs7Ozs7Ozs7OztBQUVILG1EQUE0RDtBQUM1RCxtREFBNEQ7QUFFNUQsSUFBSSxNQUFNLEdBQTZCLElBQUksQ0FBQztBQUM1QyxJQUFJLEdBQUcsR0FBb0MsSUFBSSxDQUFDO0FBRWhELElBQUksUUFBUSxHQUFXLENBQUMsQ0FBQztBQUN6QixJQUFJLFFBQVEsR0FBVyxDQUFDLENBQUM7QUFDekIsTUFBTSxrQkFBa0IsR0FBVyxFQUFFLENBQUM7QUFFdEMsbUJBQW1CO0FBQ25CLElBQUksRUFBRSxHQUFXLEdBQUcsQ0FBQztBQUNyQixtQkFBbUI7QUFDbkIsSUFBSSxFQUFFLEdBQVcsR0FBRyxDQUFDO0FBRXJCLHlCQUF5QjtBQUN6QixJQUFJLFNBQStCLENBQUM7QUFDcEMsZ0JBQWdCO0FBQ2hCLElBQUksR0FBdUIsQ0FBQztBQUM1QixhQUFhO0FBQ2IsTUFBTSxTQUFTLEdBQWtDLElBQUkscUJBQVUsRUFBcUIsQ0FBQztBQUVyRixpQ0FBaUM7QUFDakMsSUFBSSxRQUFRLEdBQVksS0FBSyxDQUFDO0FBQzlCLDJDQUEyQztBQUMzQyxJQUFJLG1CQUFtQixHQUFZLEtBQUssQ0FBQztBQUV6QyxrREFBa0Q7QUFDbEQsb0RBQW9EO0FBQ3BELDRDQUE0QztBQUM1Qyx1QkFBdUI7QUFDdkIsUUFBUTtBQUNSLG9CQUFvQjtBQUNwQixJQUFJO0FBRUosY0FBbUMsR0FBRyxJQUFjOztRQUVsRCxJQUFJLFVBQVUsR0FBVyxDQUFDLENBQUM7UUFDM0IsSUFBSSxHQUFHLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksR0FBRyxHQUFXLENBQUMsQ0FBQztRQUNwQixJQUFJLElBQUksR0FBVyxDQUFDLENBQUM7UUFFckIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZ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