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

import { std_vector, std_list } from "../poly2tri/poly2tri";
import { Point, Triangle, CDT } from "../poly2tri/poly2tri";

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

let rotate_y: number = 0;
let rotate_z: number = 0;
const rotations_per_tick: number = .2;

/// Screen center x
let cx: number = 0.0;
/// Screen center y
let cy: number = 0.0;

/// Constrained triangles
let triangles: std_vector<Triangle>;
/// Triangle map
let map: std_list<Triangle>;
/// Polylines
const polylines: std_vector<std_vector<Point>> = new std_vector<std_vector<Point>>();

/// Draw the entire triangle map?
let draw_map: boolean = false;
/// Create a random distribution of points?
let random_distribution: boolean = false;

// template <class C> void FreeClear( C & cntr ) {
//     for ( typename C::iterator it = cntr.begin();
//               it !== cntr.end(); ++it ) {
//         delete * it;
//     }
//     cntr.clear();
// }

export default async function main(...args: string[]): Promise<number> {

  let num_points: number = 0;
  let max: number = 0;
  let min: number = 0;
  let zoom: number = 1;

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
  } else {
    zoom = parseFloat(args[4]);
    cx = parseFloat(args[2]);
    cy = parseFloat(args[3]);
  }

  const polyline: std_vector<Point> = new std_vector<Point>();

  if (random_distribution) {
    // Create a simple bounding box
    polyline.push_back(new Point(min, min));
    polyline.push_back(new Point(min, max));
    polyline.push_back(new Point(max, max));
    polyline.push_back(new Point(max, min));
  } else {
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
      const response = await fetch(args[1]);
      const buffer = await response.text();
      const lines: string[] = buffer.split(/[\n,\r\n]/);
      lines.forEach((line: string, index: number): void => {
        if (line.length === 0) { return; }
        const tokens: string[] = line.split(/ +/)
        const x: number = StringToDouble(tokens[0]);
        const y: number = StringToDouble(tokens[1]);
        polyline.push_back(new Point(x, y));
        num_points++;
      });
    } catch (e) {
      console.log("File not opened", e);
    }
  }

  console.log("Number of constrained edges = ", polyline.size());
  polylines.push_back(polyline);

  Init();

  /*
   * Perform triangulation!
   */

  const init_time: number = performance.now();

  /*
   * STEP 1: Create CDT and add primary polyline
   * NOTE: polyline must be a simple polygon. The polyline's points
   * constitute constrained edges. No repeat points!!!
   */
  const cdt: CDT = new CDT(polyline);

  /*
   * STEP 2: Add holes or Steiner points if necessary
   */

  const s: string = args[1];
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
  } else if (random_distribution) {
    max -= (1e-4);
    min += (1e-4);
    for (let i = 0; i < num_points; i++) {
      const x: number = Random(Fun, min, max);
      const y: number = Random(Fun, min, max);
      cdt.AddPoint(new Point(x, y));
    }
  }

  /*
   * STEP 3: Triangulate!
   */
  cdt.Triangulate();

  const dt: number = performance.now() - init_time;

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
    const poly: std_vector<Point> = polylines.at(i);
    // FreeClear(poly);
  }

  ShutDown(0);
  return 0;
}

function Init(): void {
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

function ShutDown(return_code: number): void {
  // glfwTerminate();
  // exit(return_code);
}

function MainLoop(zoom: number): void {
  // the time of the previous frame
  let old_time: number = performance.now();
  // this just loops as long as the program runs
  let running: boolean = true;

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
    } else {
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

function Draw(zoom: number): void {
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

    const min = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
    const max = new Point(Number.MIN_VALUE, Number.MIN_VALUE);
    for (let i = 0; i < polylines.size(); ++i) {
      const polyline = polylines.at(i);
      for (let j = 0; j < polyline.size(); ++j) {
        const p: Point = polyline.at(j);
        min.x = Math.min(min.x, p.x); min.y = Math.min(min.y, p.y);
        max.x = Math.max(max.x, p.x); max.y = Math.max(max.y, p.y);
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
      const t: Triangle = triangles.at(i);
      const a: Point = t.GetPoint(0);
      const b: Point = t.GetPoint(1);
      const c: Point = t.GetPoint(2);

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
        } else {
          ctx.lineTo(poly.at(j).x, poly.at(j).y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function DrawMap(zoom: number): void {
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

    const min = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
    const max = new Point(Number.MIN_VALUE, Number.MIN_VALUE);
    for (let i = 0; i < map.size(); i++) {
      const t: Triangle = map.at(i);
      for (let j = 0; j < 3; ++j) {
        const p: Point = t.GetPoint(j);
        min.x = Math.min(min.x, p.x); min.y = Math.min(min.y, p.y);
        max.x = Math.max(max.x, p.x); max.y = Math.max(max.y, p.y);
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
      const t: Triangle = map.at(i);
      const a: Point = t.GetPoint(0);
      const b: Point = t.GetPoint(1);
      const c: Point = t.GetPoint(2);
  
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

function ConstrainedColor(constrain: boolean): void {
  if (ctx) {
    if (constrain) {
      // Green
      // glColor3f(0, 1, 0);
      ctx.strokeStyle = "green";
    } else {
      // Red
      // glColor3f(1, 0, 0);
      ctx.strokeStyle = "red";
    }
  }
}

function CreateHeadHole(): std_vector<Point> {

  const head_hole = new std_vector<Point>();
  head_hole.push_back(new Point(325, 437));
  head_hole.push_back(new Point(320, 423));
  head_hole.push_back(new Point(329, 413));
  head_hole.push_back(new Point(332, 423));

  return head_hole;
}

function CreateChestHole(): std_vector<Point> {

  const chest_hole = new std_vector<Point>();
  chest_hole.push_back(new Point(320.72342, 480));
  chest_hole.push_back(new Point(338.90617, 465.96863));
  chest_hole.push_back(new Point(347.99754, 480.61584));
  chest_hole.push_back(new Point(329.8148, 510.41534));
  chest_hole.push_back(new Point(339.91632, 480.11077));
  chest_hole.push_back(new Point(334.86556, 478.09046));

  return chest_hole;
}

function StringToDouble(s: string): number {
  return parseFloat(s);
}

function Fun(x: number): number {
  return 2.5 + Math.sin(10 * x) / x;
}

const RAND_MAX: number = 32767;
let Random_Fun: (n: number) => number;
let Random_YMin: number;
let Random_YMax: number;
let Random_First: boolean = true;
function Random(fun: (n: number) => number, xmin: number = 0, xmax: number = 1): number {
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
      const X: number = xmin + (xmax - xmin) * iX / RAND_MAX;
      const Y: number = Random_Fun(X);
      Random_YMax = Y > Random_YMax ? Y : Random_YMax;
    }
  }

  // Gets random values for X & Y
  const X: number = xmin + (xmax - xmin) * Math.random(); // rand() / RAND_MAX;
  const Y: number = Random_YMin + (Random_YMax - Random_YMin) * Math.random(); // rand() / RAND_MAX;

  // Returns if valid and try again if not valid
  return Y < fun(X) ? X : Random(Random_Fun, xmin, xmax);
}
