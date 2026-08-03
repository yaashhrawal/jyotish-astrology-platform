"""
Shared test setup — makes every test deterministic regardless of run order.

Swiss Ephemeris keeps GLOBAL state (ephemeris path, sidereal mode). If one test
changes it and doesn't reset, later tests silently compute against the wrong state —
an order-dependent bug that hides real regressions. This autouse fixture resets that
global state to the engine's configuration before each test.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
import swisseph as swe
from core.engine import _EPHE_DIR


@pytest.fixture(autouse=True)
def _reset_swe_global_state():
    if os.path.isdir(_EPHE_DIR) and any(f.endswith(".se1") for f in os.listdir(_EPHE_DIR)):
        swe.set_ephe_path(_EPHE_DIR)
    else:
        swe.set_ephe_path(None)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    yield
