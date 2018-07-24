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
// Advancing front node
class Node {
    constructor(p, t = null) {
        this.triangle = null;
        this.next = null;
        this.prev = null;
        this.value = 0;
        this.point = p;
        this.triangle = t;
        this.value = p.x;
    }
}
exports.Node = Node;
// Advancing front
class AdvancingFront {
    constructor(head, tail) {
        this.head_ = head;
        this.tail_ = tail;
        this.search_node_ = this.head_;
    }
    // Destructor
    // ~AdvancingFront();
    destructor() { }
    // Node* head();
    head() {
        return this.head_;
    }
    // void set_head(Node* node);
    set_head(node) {
        this.head_ = node;
    }
    // Node* tail();
    tail() {
        return this.tail_;
    }
    // void set_tail(Node* node);
    set_tail(node) {
        this.tail_ = node;
    }
    // Node* search();
    search() {
        return this.search_node_;
    }
    // void set_search(Node* node);
    set_search(node) {
        this.search_node_ = node;
    }
    /// Locate insertion point along advancing front
    LocateNode(x) {
        let node = this.search_node_;
        if (x < node.value) {
            while ((node = node.prev) !== null) {
                if (x >= node.value) {
                    this.search_node_ = node;
                    return node;
                }
            }
        }
        else {
            while ((node = node.next) !== null) {
                if (x < node.value) {
                    if (node.prev === null) {
                        throw new Error("node.prev === null");
                    }
                    this.search_node_ = node.prev;
                    return node.prev;
                }
            }
        }
        return null;
    }
    LocatePoint(point) {
        const px = point.x;
        let node = this.FindSearchNode(px);
        const nx = node.point.x;
        if (px === nx) {
            if (point !== node.point) {
                // We might have two nodes with same x value for a short time
                if (node.prev && point === node.prev.point) {
                    node = node.prev;
                }
                else if (node.next && point === node.next.point) {
                    node = node.next;
                }
                else {
                    throw new Error("assert");
                }
            }
        }
        else if (px < nx) {
            while ((node = node.prev) !== null) {
                if (point === node.point) {
                    break;
                }
            }
        }
        else {
            while ((node = node.next) !== null) {
                if (point === node.point)
                    break;
            }
        }
        if (node)
            this.search_node_ = node;
        return node;
    }
    // Node* FindSearchNode(const double& x);
    FindSearchNode(x) {
        // (void)x; // suppress compiler warnings "unused parameter 'x'"
        // TODO: implement BST index
        return this.search_node_;
    }
}
exports.AdvancingFront = AdvancingFront;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jaW5nX2Zyb250LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWR2YW5jaW5nX2Zyb250LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7O0FBSUgsdUJBQXVCO0FBQ3ZCO0lBU0UsWUFBWSxDQUFRLEVBQUUsSUFBcUIsSUFBSTtRQVAvQyxhQUFRLEdBQW9CLElBQUksQ0FBQztRQUVqQyxTQUFJLEdBQWdCLElBQUksQ0FBQztRQUN6QixTQUFJLEdBQWdCLElBQUksQ0FBQztRQUV6QixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBR2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQWRELG9CQWNDO0FBRUQsa0JBQWtCO0FBQ2xCO0lBQ0UsWUFBWSxJQUFVLEVBQUUsSUFBVTtRQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDakMsQ0FBQztJQUVELGFBQWE7SUFDYixxQkFBcUI7SUFDckIsVUFBVSxLQUFXLENBQUM7SUFFdEIsZ0JBQWdCO0lBQ1QsSUFBSTtRQUNULE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBQ0QsNkJBQTZCO0lBQ3RCLFFBQVEsQ0FBQyxJQUFVO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFDRCxnQkFBZ0I7SUFDVCxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFDRCw2QkFBNkI7SUFDdEIsUUFBUSxD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