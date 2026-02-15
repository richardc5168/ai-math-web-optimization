"""Learning analytics + remediation subsystem (local-first, deterministic).

This package is intentionally stdlib-only and SQLite-first.
"""

from .service import recordAttempt, getStudentAnalytics, getRemediationPlan

__all__ = [
    "recordAttempt",
    "getStudentAnalytics",
    "getRemediationPlan",
]
