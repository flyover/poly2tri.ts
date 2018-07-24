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
exports.PI_3div4 = 3 * Math.PI / 4;
exports.PI_div2 = 1.57079632679489661923;
exports.EPSILON = 1e-12;
var Orientation;
(function (Orientation) {
    Orientation[Orientation["CW"] = 0] = "CW";
    Orientation[Orientation["CCW"] = 1] = "CCW";
    Orientation[Orientation["COLLINEAR"] = 2] = "COLLINEAR";
})(Orientation = exports.Orientation || (exports.Orientation = {}));
/**
 * Forumla to calculate signed area<br>
 * Positive if CCW<br>
 * Negative if CW<br>
 * 0 if collinear<br>
 * <pre>
 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
 * </pre>
 */
function Orient2d(pa, pb, pc) {
    const detleft = (pa.x - pc.x) * (pb.y - pc.y);
    const detright = (pa.y - pc.y) * (pb.x - pc.x);
    const val = detleft - detright;
    if (val > -exports.EPSILON && val < exports.EPSILON) {
        return Orientation.COLLINEAR;
    }
    else if (val > 0) {
        return Orientation.CCW;
    }
    return Orientation.CW;
}
exports.Orient2d = Orient2d;
/*
bool InScanArea(Point& pa, Point& pb, Point& pc, Point& pd)
{
  double pdx = pd.x;
  double pdy = pd.y;
  double adx = pa.x - pdx;
  double ady = pa.y - pdy;
  double bdx = pb.x - pdx;
  double bdy = pb.y - pdy;

  double adxbdy = adx * bdy;
  double bdxady = bdx * ady;
  double oabd = adxbdy - bdxady;

  if (oabd <= EPSILON) {
    return false;
  }

  double cdx = pc.x - pdx;
  double cdy = pc.y - pdy;

  double cdxady = cdx * ady;
  double adxcdy = adx * cdy;
  double ocad = cdxady - adxcdy;

  if (ocad <= EPSILON) {
    return false;
  }

  return true;
}
*/
function InScanArea(pa, pb, pc, pd) {
    const oadb = (pa.x - pb.x) * (pd.y - pb.y) - (pd.x - pb.x) * (pa.y - pb.y);
    if (oadb >= -exports.EPSILON) {
        return false;
    }
    const oadc = (pa.x - pc.x) * (pd.y - pc.y) - (pd.x - pc.x) * (pa.y - pc.y);
    if (oadc <= exports.EPSILON) {
        return false;
    }
    return true;
}
exports.InScanArea = InScanArea;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHOztBQUlVLFFBQUEsUUFBUSxHQUFXLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNuQyxRQUFBLE9BQU8sR0FBVyxzQkFBc0IsQ0FBQztBQUN6QyxRQUFBLE9BQU8sR0FBVyxLQUFLLENBQUM7QUFFckMsSUFBWSxXQUFrQztBQUE5QyxXQUFZLFdBQVc7SUFBRyx5Q0FBRSxDQUFBO0lBQUUsMkNBQUcsQ0FBQTtJQUFFLHVEQUFTLENBQUE7QUFBQyxDQUFDLEVBQWxDLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBQXVCO0FBRTlDOzs7Ozs7Ozs7R0FTRztBQUNILGtCQUF5QixFQUFTLEVBQUUsRUFBUyxFQUFFLEVBQVM7SUFDdEQsTUFBTSxPQUFPLEdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sUUFBUSxHQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxNQUFNLEdBQUcsR0FBVyxPQUFPLEdBQUcsUUFBUSxDQUFDO0lBQ3ZDLElBQUksR0FBRyxHQUFHLENBQUMsZUFBTyxJQUFJLEdBQUcsR0FBRyxlQUFPLEVBQUU7UUFDbkMsT0FBTyxXQUFXLENBQUMsU0FBUyxDQUFDO0tBQzlCO1NBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQztLQUN4QjtJQUNELE9BQU8sV0FBVyxDQUFDLEVBQUUsQ0FBQztBQUN4QixDQUFDO0FBVkQsNEJBVUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQStCRTtBQUVGLG9CQUEyQixFQUFTLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTO0lBQ25FLE1BQU0sSUFBSSxHQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkYsSUFBSSxJQUFJLElBQUksQ0FBQyxlQUFPLEVBQUU7UUFDcEIsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE1BQU0sSUFBSSxHQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkYsSUFBSSxJQUFJLElBQUksZUFBTyxFQUFFO1FBQ25CLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFYRCxnQ0FXQyJ9