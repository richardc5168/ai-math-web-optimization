# -*- coding: utf-8 -*-

"""
Knowledge Graph Definition
Inspired by Khan Academy's dependency structure.
Matches the user's requested snippet + detailed metadata.
"""

KNOWLEDGE_GRAPH = {
    # --- Algebra: Linear Equations ---
    "A1": {
        "id": "A1",
        "title": "一元一次方程式",
        "description": "基礎移項法則與求解 (ax + b = 0)",
        "prereqs": [],
        "khan_mapped_id": "linear-equations-basics"
    },
    
    # --- Algebra: Factoring ---
    "A2": {
        "id": "A2",
        "title": "因式分解-提公因式",
        "description": "利用分配律提取公因式 (ax + ay = a(x+y))",
        "prereqs": ["A1"],
        "khan_mapped_id": "factoring-common-factor"
    },
    
    # --- Algebra: Quadratic Equations ---
    "A3": {
        "id": "A3",
        "title": "一元二次方程式-因式分解法",
        "description": "利用十字交乘法求解 (x-a)(x-b)=0",
        "prereqs": ["A2"],
        "khan_mapped_id": "solving-quadratics-factoring"
    },
    "A4": {
        "id": "A4",
        "title": "一元二次方程式-配方法",
        "description": "完全平方式的應用 (x+a)^2 = k",
        "prereqs": ["A3"],
        "khan_mapped_id": "solving-quadratics-completing-square"
    },
    "A5": {
        "id": "A5",
        "title": "一元二次方程式-公式解",
        "description": "判別式與公式解的推導與應用",
        "prereqs": ["A4"],
        "khan_mapped_id": "quadratic-formula"
    }
}

def get_prerequisites(topic_id: str) -> list[str]:
    """Return list of prerequisite IDs for a given topic."""
    node = KNOWLEDGE_GRAPH.get(topic_id)
    if not node:
        return []
    return node.get("prereqs", [])

def get_topic_info(topic_id: str) -> dict:
    return KNOWLEDGE_GRAPH.get(topic_id, {})
