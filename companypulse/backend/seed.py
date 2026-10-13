"""Create fictional demo data for CompanyPulse. Safe to re-run on a fresh database."""
from datetime import date, datetime
from decimal import Decimal
from app import app, db


def seed():
    with app.app_context():
        Department = app.Department
        Employee = app.Employee
        Customer = app.Customer
        Order = app.Order

        # If records already exist, leave them in place to avoid duplicate demo data.
        if Department.query.count():
            print("Demo data already exists. Nothing changed.")
            return

        department_names = ["Engineering", "Sales", "Marketing", "Human Resources", "Finance"]
        departments = [Department(name=name) for name in department_names]
        db.session.add_all(departments)
        db.session.flush()

        employees = [
            Employee(name="Aarav Sharma", email="aarav@example.com", department_id=departments[0].id, hire_date=date(2023, 2, 15)),
            Employee(name="Diya Patel", email="diya@example.com", department_id=departments[0].id, hire_date=date(2022, 7, 10)),
            Employee(name="Kabir Singh", email="kabir@example.com", department_id=departments[1].id, hire_date=date(2024, 1, 5)),
            Employee(name="Ananya Das", email="ananya@example.com", department_id=departments[1].id, hire_date=date(2023, 8, 22)),
            Employee(name="Ishaan Roy", email="ishaan@example.com", department_id=departments[2].id, hire_date=date(2024, 4, 12)),
            Employee(name="Meera Nair", email="meera@example.com", department_id=departments[3].id, hire_date=date(2021, 11, 2)),
            Employee(name="Rohan Verma", email="rohan@example.com", department_id=departments[4].id, hire_date=date(2022, 5, 18)),
            Employee(name="Sara Khan", email="sara@example.com", department_id=departments[0].id, hire_date=date(2025, 3, 1), status="Inactive"),
        ]
        customers = [
            Customer(name="Northstar Retail", email="northstar@example.com", status="Active"),
            Customer(name="Bluebird Stores", email="bluebird@example.com", status="Active"),
            Customer(name="Urban Basket", email="urbanbasket@example.com", status="Active"),
            Customer(name="Greenline Market", email="greenline@example.com", status="Inactive"),
            Customer(name="Sunrise Supplies", email="sunrise@example.com", status="Active"),
        ]
        db.session.add_all(employees + customers)
        db.session.flush()

        orders = [
            Order(customer_id=customers[0].id, order_date=datetime(2026, 1, 12, 10, 30), total_amount=Decimal("42000.00"), status="Completed"),
            Order(customer_id=customers[1].id, order_date=datetime(2026, 1, 24, 14, 0), total_amount=Decimal("18500.00"), status="Completed"),
            Order(customer_id=customers[2].id, order_date=datetime(2026, 2, 8, 9, 15), total_amount=Decimal("32750.00"), status="Completed"),
            Order(customer_id=customers[4].id, order_date=datetime(2026, 2, 21, 16, 45), total_amount=Decimal("25900.00"), status="Completed"),
            Order(customer_id=customers[0].id, order_date=datetime(2026, 3, 5, 11, 20), total_amount=Decimal("51000.00"), status="Completed"),
            Order(customer_id=customers[1].id, order_date=datetime(2026, 3, 19, 13, 5), total_amount=Decimal("21800.00"), status="Pending"),
            Order(customer_id=customers[2].id, order_date=datetime(2026, 4, 2, 10, 10), total_amount=Decimal("38600.00"), status="Completed"),
            Order(customer_id=customers[4].id, order_date=datetime(2026, 4, 17, 15, 30), total_amount=Decimal("29750.00"), status="Completed"),
            Order(customer_id=customers[0].id, order_date=datetime(2026, 5, 7, 12, 0), total_amount=Decimal("46500.00"), status="Completed"),
            Order(customer_id=customers[3].id, order_date=datetime(2026, 5, 26, 17, 0), total_amount=Decimal("15000.00"), status="Cancelled"),
            Order(customer_id=customers[1].id, order_date=datetime(2026, 6, 10, 9, 45), total_amount=Decimal("33400.00"), status="Completed"),
            Order(customer_id=customers[4].id, order_date=datetime(2026, 6, 28, 14, 20), total_amount=Decimal("27800.00"), status="Completed"),
        ]
        db.session.add_all(orders)
        db.session.commit()
        print("Demo data created successfully.")


if __name__ == "__main__":
    seed()
