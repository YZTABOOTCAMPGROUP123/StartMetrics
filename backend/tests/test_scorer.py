import pytest
from app import scorer
from app.scorer import score, ScoreResult

def test_score_basic():
    # Test scoring with minimal features
    features = {
        "Funding_Stage": "Pre-Seed",
        "Product_Market_Fit_Score": 8,
        "Team_Size": 3,
        "Founder_Experience_Years": 2,
        "Weekly_Work_Hours": 40,
        "Cofounder_Conflict_Score": 2,
        "Runway_Months_Remaining": 12,
    }
    result = score(features)
    assert isinstance(result, ScoreResult)
    assert 0 <= result.maturity_score <= 100
    assert 0.01 <= result.risk_probability <= 0.99
    assert result.risk_band in ("Düşük", "Orta", "Yüksek")
    assert len(result.drivers) > 0

def test_score_fallback_logic():
    # Force fallback logic by setting USE_ML = False
    original_use_ml = scorer.USE_ML
    scorer.USE_ML = False
    try:
        features = {
            "Funding_Stage": "Pre-Seed",
            "Product_Market_Fit_Score": 3,  # Low PMF -> should trigger driver
            "Team_Size": 3,
            "Founder_Experience_Years": 2,
            "Weekly_Work_Hours": 70,        # High work hours -> should trigger driver
            "Cofounder_Conflict_Score": 6,  # High conflict -> should trigger driver
            "Runway_Months_Remaining": 2,   # Low runway -> should trigger driver
        }
        result = score(features)
        assert isinstance(result, ScoreResult)
        drivers_text = " ".join(result.drivers)
        assert "PMF" in drivers_text
        assert "Runway" in drivers_text
        assert "çatışması" in drivers_text
        assert "tükenmişlik" in drivers_text
    finally:
        scorer.USE_ML = original_use_ml

def test_score_fallback_low_risk():
    original_use_ml = scorer.USE_ML
    scorer.USE_ML = False
    try:
        features = {
            "Funding_Stage": "Bootstrapped",
            "Product_Market_Fit_Score": 9,
            "Team_Size": 5,
            "Founder_Experience_Years": 5,
            "Weekly_Work_Hours": 40,
            "Cofounder_Conflict_Score": 1,
            "Runway_Months_Remaining": 24,
            "Employee_Turnover_Percent": 10,
        }
        result = score(features)
        assert result.maturity_score > 70
        assert result.risk_probability < 0.3
        assert result.risk_band == "Düşük"
    finally:
        scorer.USE_ML = original_use_ml
