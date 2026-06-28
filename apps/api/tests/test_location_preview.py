"""Location preview endpoint — same geocode/timezone path as chart API."""
from services.chart_data import preview_birth_location


def test_preview_birth_location_with_coordinates():
    result = preview_birth_location(
        location="Tehran",
        latitude=35.689252,
        longitude=51.389600,
    )
    assert result["latitude"] == 35.689252
    assert result["longitude"] == 51.389600
    assert result["timezone"] == "Asia/Tehran"
    assert result["coordinate_source"] == "selected_city_coordinates"


def test_preview_birth_location_geocoded(monkeypatch):
    monkeypatch.setattr(
        "services.chart_data.resolve_coordinates",
        lambda loc: (35.689252, 51.389600),
    )
    result = preview_birth_location(location="Tehran")
    assert result["timezone"] == "Asia/Tehran"
    assert result["coordinate_source"] == "geocoded_fallback"
