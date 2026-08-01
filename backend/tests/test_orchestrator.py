import pytest
from app import orchestrator
from app.schemas import AnalysisResponse

def test_clean_valid_data():
    raw_answers = {
        "Industry": "AI",
        "Product_Market_Fit_Score": 8,
        "Team_Size": "5",  # String number should be converted to float
        "Founder_Experience_Years": 3.5,
        "Weekly_Work_Hours": 45,
        "Cofounder_Conflict_Score": 2,
        "Runway_Months_Remaining": 18,
        "Extra_Field": "Should be ignored"
    }
    
    cleaned = orchestrator._clean("fikrim_var", raw_answers)
    
    # Check that keys are mapped correctly
    assert cleaned["Funding_Stage"] == "Pre-Seed"
    assert cleaned["Industry"] == "AI"
    assert cleaned["Product_Market_Fit_Score"] == 8.0
    assert cleaned["Team_Size"] == 5.0
    assert cleaned["Founder_Experience_Years"] == 3.5
    assert cleaned["Weekly_Work_Hours"] == 45.0
    assert cleaned["Cofounder_Conflict_Score"] == 2.0
    assert cleaned["Runway_Months_Remaining"] == 18.0
    
    # Unrecognized fields must be ignored
    assert "Extra_Field" not in cleaned

def test_clean_validation_min_error():
    raw_answers = {
        "Industry": "AI",
        "Team_Size": 0,  # Min for Team_Size is 1
    }
    with pytest.raises(ValueError) as exc_info:
        orchestrator._clean("fikrim_var", raw_answers)
    assert "en az 1" in str(exc_info.value)

def test_clean_validation_max_error():
    raw_answers = {
        "Industry": "AI",
        "Product_Market_Fit_Score": 11,  # Max is 10
    }
    with pytest.raises(ValueError) as exc_info:
        orchestrator._clean("fikrim_var", raw_answers)
    assert "en fazla 10" in str(exc_info.value)

def test_analyze_flow():
    raw_answers = {
        "Industry": "SaaS",
        "Product_Market_Fit_Score": 8,
        "Team_Size": 4,
        "Founder_Experience_Years": 3,
        "Weekly_Work_Hours": 40,
        "Cofounder_Conflict_Score": 2,
        "Runway_Months_Remaining": 12,
    }
    
    response = orchestrator.analyze("fikrim_var", raw_answers)
    assert isinstance(response, AnalysisResponse)
    assert isinstance(response.maturity_score, int)
    assert isinstance(response.risk_percent, int)
    assert isinstance(response.certificate_available, bool)
    assert len(response.navigation_report) == 3
