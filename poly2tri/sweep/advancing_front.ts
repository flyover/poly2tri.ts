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

import { Point, Triangle } from "../common/shapes";

// Advancing front node
export class Node {
  point: Point;
  triangle: Triangle | null = null;

  next: Node | null = null;
  prev: Node | null = null;

  value: number = 0;

  constructor(p: Point, t: Triangle | null = null) {
    this.point = p;
    this.triangle = t;
    this.value = p.x;
  }
}

// Advancing front
export class AdvancingFront {
  constructor(head: Node, tail: Node) {
    this.head_ = head;
    this.tail_ = tail;
    this.search_node_ = this.head_;
  }

  // Destructor
  // ~AdvancingFront();
  destructor(): void { }

  // Node* head();
  public head(): Node {
    return this.head_;
  }
  // void set_head(Node* node);
  public set_head(node: Node): void {
    this.head_ = node;
  }
  // Node* tail();
  public tail(): Node {
    return this.tail_;
  }
  // void set_tail(Node* node);
  public set_tail(node: Node): void {
    this.tail_ = node;
  }
  // Node* search();
  public search(): Node {
    return this.search_node_;
  }
  // void set_search(Node* node);
  public set_search(node: Node): void {
    this.search_node_ = node;
  }

  /// Locate insertion point along advancing front
  public LocateNode(x: number): Node | null {
    let node: Node | null = this.search_node_;

    if (x < node.value) {
      while ((node = node.prev) !== null) {
        if (x >= node.value) {
          this.search_node_ = node;
          return node;
        }
      }
    } else {
      while ((node = node.next) !== null) {
        if (x < node.value) {
          if (node.prev === null) { throw new Error("node.prev === null"); }
          this.search_node_ = node.prev;
          return node.prev;
        }
      }
    }
    return null;
  }

  public LocatePoint(point: Point): Node | null {
    const px: number = point.x;
    let node: Node | null = this.FindSearchNode(px);
    const nx: number = node.point.x;

    if (px === nx) {
      if (point !== node.point) {
        // We might have two nodes with same x value for a short time
        if (node.prev && point === node.prev.point) {
          node = node.prev;
        } else if (node.next && point === node.next.point) {
          node = node.next;
        } else {
          throw new Error("assert");
        }
      }
    } else if (px < nx) {
      while ((node = node.prev) !== null) {
        if (point === node.point) {
          break;
        }
      }
    } else {
      while ((node = node.next) !== null) {
        if (point === node.point)
          break;
      }
    }
    if (node) this.search_node_ = node;
    return node;
  }

  // Node* head_, *tail_, *search_node_;
  private head_: Node;
  private tail_: Node;
  private search_node_: Node;

  // Node* FindSearchNode(const double& x);
  private FindSearchNode(x: number): Node {
    // (void)x; // suppress compiler warnings "unused parameter 'x'"
    // TODO: implement BST index
    return this.search_node_;
  }
}
