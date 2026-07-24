import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_config():
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert "fikrim_var" in data
    assert "startup_var" in data
    assert "sirketim_var" in data

def test_analyze_valid():
    payload = {
        "branch": "fikrim_var",
        "answers": {
            "Industry": "AI",
            "Product_Market_Fit_Score": 8,
            "Team_Size": 3,
            "Founder_Experience_Years": 2,
            "Weekly_Work_Hours": 40,
            "Cofounder_Conflict_Score": 2,
            "Runway_Months_Remaining": 12
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "maturity_score" in data
    assert "risk_probability" in data
    assert "navigation_report" in data
    assert len(data["navigation_report"]) == 3

def test_analyze_invalid_min():
    payload = {
        "branch": "fikrim_var",
        "answers": {
            "Industry": "AI",
            "Team_Size": 0,  # Min Team_Size is 1
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 400
    assert "en az 1" in response.json()["detail"]

def test_analyze_invalid_max():
    payload = {
        "branch": "fikrim_var",
        "answers": {
            "Industry": "AI",
            "Product_Market_Fit_Score": 12,  # Max is 10
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 400
    assert "en fazla 10" in response.json()["detail"]

def test_certificate_not_eligible():
    payload = {
        "branch": "fikrim_var",
        "answers": {
            "Industry": "AI",
            "Product_Market_Fit_Score": 2,  # Low score -> not eligible
            "Team_Size": 3,
            "Founder_Experience_Years": 2,
            "Weekly_Work_Hours": 40,
            "Cofounder_Conflict_Score": 9,  # High conflict
            "Runway_Months_Remaining": 1
        }
    }
    response = client.post("/api/certificate", json=payload)
    assert response.status_code == 403
    assert "Sertifika için" in response.json()["detail"]
