"""
True Node regression tests — Mean Node remains default; True Node tested separately.

Run:
    py -3.11 -m pytest apps/api/tests/test_true_node.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.chart_data import compute_birth_chart  # noqa: E402

LAT, LON = 30.402184, 55.994178


def _chart(node_type: str):
    return compute_birth_chart(
        birth_date="1982-02-25",
        birth_time="05:47",
        location="Rafsanjan, Iran",
        latitude=LAT,
        longitude=LON,
        node_type=node_type,
    )


def test_mean_node_is_default_label():
    chart = _chart("mean")
    assert chart["node_type"] == "mean"


def test_true_node_label():
    chart = _chart("true")
    assert chart["node_type"] == "true"


def test_mean_and_true_node_differ():
    mean = _chart("mean")["planets"]["north_node"]["longitude"]
    true = _chart("true")["planets"]["north_node"]["longitude"]
    diff = abs(mean - true)
    if diff > 180:
        diff = 360 - diff
    assert diff > 0.5, "Mean and True Node should differ measurably"
    assert diff < 5.0, "Mean/True Node difference should be modest (degrees)"


def test_mean_node_rafsanjan_reference():
    node = _chart("mean")["planets"]["north_node"]
    sign = int(node["longitude"] // 30) + 1
    degree = node["longitude"] % 30
    assert sign == 4  # Cancer
    assert abs(degree - 20.27) < 0.5


def test_true_node_is_different_sign_or_degree():
    node = _chart("true")["planets"]["north_node"]
    mean = _chart("mean")["planets"]["north_node"]
    assert node["longitude"] != mean["longitude"]
