from datetime import datetime
from decimal import Decimal

import pytest
from app import app, db


@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.app_context():
        db.drop_all()
        db.create_all()
        department = app.Department(name="Engineering")
        db.session.add(department)
        db.session.flush()
        db.session.add(app.Employee(
            name="Test Person", email="test@example.com",
            department_id=department.id
        ))
        customer = app.Customer(name="Test Customer", email="customer@example.com")
        db.session.add(customer)
        db.session.flush()
        db.session.add(app.Order(
            customer_id=customer.id,
            order_date=datetime(2026, 1, 10, 12, 0),
            total_amount=Decimal("100.00"),
            status="Completed"
        ))
        db.session.commit()

    with app.test_client() as test_client:
        yield test_client

    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_summary_calculates_totals(client):
    response = client.get("/api/dashboard/summary")
    data = response.get_json()
    assert response.status_code == 200
    assert data["total_revenue"] == 100.0
    assert data["total_orders"] == 1
    assert data["active_employees"] == 1


def test_invalid_date_is_rejected(client):
    response = client.get("/api/analytics/revenue?start_date=not-a-date")
    assert response.status_code == 400
