from datetime import date, datetime
from decimal import Decimal
import csv
import io

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

db = SQLAlchemy()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///companypulse.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if test_config:
        app.config.update(test_config)

    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
    db.init_app(app)

    class Department(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(80), unique=True, nullable=False)
        employees = db.relationship("Employee", backref="department", lazy=True)

    class Employee(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(120), nullable=False)
        email = db.Column(db.String(160), unique=True, nullable=False)
        department_id = db.Column(db.Integer, db.ForeignKey("department.id"), nullable=False)
        hire_date = db.Column(db.Date, nullable=False, default=date.today)
        status = db.Column(db.String(20), nullable=False, default="Active")

    class Customer(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(120), nullable=False)
        email = db.Column(db.String(160), unique=True, nullable=False)
        created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
        status = db.Column(db.String(20), nullable=False, default="Active")

    class Order(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
        order_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
        total_amount = db.Column(db.Numeric(12, 2), nullable=False)
        status = db.Column(db.String(20), nullable=False, default="Completed")
        customer = db.relationship("Customer", backref="orders")

    # Expose model classes on the app for tests and seed script.
    app.Department = Department
    app.Employee = Employee
    app.Customer = Customer
    app.Order = Order

    with app.app_context():
        db.create_all()

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "CompanyPulse API is running"})

    @app.get("/api/dashboard/summary")
    def dashboard_summary():
        revenue = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.status == "Completed"
        ).scalar()
        completed_orders = Order.query.filter_by(status="Completed").count()
        active_customers = Customer.query.filter_by(status="Active").count()
        active_employees = Employee.query.filter_by(status="Active").count()

        return jsonify({
            "total_revenue": float(revenue or 0),
            "total_orders": completed_orders,
            "active_customers": active_customers,
            "active_employees": active_employees,
            "currency": "INR"
        })

    @app.get("/api/analytics/revenue")
    def revenue_analytics():
        start_text = request.args.get("start_date")
        end_text = request.args.get("end_date")

        try:
            start_date = date.fromisoformat(start_text) if start_text else date(date.today().year, 1, 1)
            end_date = date.fromisoformat(end_text) if end_text else date.today()
        except ValueError:
            return jsonify({"error": "Dates must use YYYY-MM-DD format."}), 400

        if start_date > end_date:
            return jsonify({"error": "start_date must be on or before end_date."}), 400

        # Include the entire end date by using an exclusive next-day boundary.
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date.fromordinal(end_date.toordinal() + 1), datetime.min.time())

        rows = db.session.query(
            func.strftime("%Y-%m", Order.order_date).label("month"),
            func.sum(Order.total_amount).label("revenue")
        ).filter(
            Order.status == "Completed",
            Order.order_date >= start_dt,
            Order.order_date < end_dt
        ).group_by("month").order_by("month").all()

        return jsonify([
            {"month": row.month, "revenue": float(row.revenue or 0)}
            for row in rows
        ])

    @app.get("/api/analytics/employees")
    def employee_analytics():
        rows = db.session.query(
            Department.name,
            func.count(Employee.id).label("count")
        ).outerjoin(Employee).filter(
            (Employee.status == "Active") | (Employee.id.is_(None))
        ).group_by(Department.id, Department.name).order_by(Department.name).all()

        return jsonify([
            {"department": row.name, "employees": row.count}
            for row in rows
        ])

    @app.get("/api/departments")
    def departments():
        return jsonify([
            {"id": d.id, "name": d.name}
            for d in Department.query.order_by(Department.name).all()
        ])

    @app.get("/api/employees")
    def employees():
        department_id = request.args.get("department_id", type=int)
        query = Employee.query
        if department_id is not None:
            query = query.filter_by(department_id=department_id)

        return jsonify([
            {
                "id": e.id,
                "name": e.name,
                "email": e.email,
                "department": e.department.name,
                "hire_date": e.hire_date.isoformat(),
                "status": e.status
            }
            for e in query.order_by(Employee.name).all()
        ])

    @app.post("/api/employees")
    def create_employee():
        data = request.get_json(silent=True) or {}
        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        department_id = data.get("department_id")
        hire_date_text = data.get("hire_date") or date.today().isoformat()

        if not name or not email or not department_id:
            return jsonify({"error": "name, email and department_id are required."}), 400
        if "@" not in email:
            return jsonify({"error": "Please provide a valid email address."}), 400

        department = db.session.get(Department, department_id)
        if not department:
            return jsonify({"error": "Department not found."}), 404
        if Employee.query.filter(func.lower(Employee.email) == email).first():
            return jsonify({"error": "An employee with this email already exists."}), 400

        try:
            parsed_hire_date = date.fromisoformat(hire_date_text)
        except (TypeError, ValueError):
            return jsonify({"error": "hire_date must use YYYY-MM-DD format."}), 400

        employee = Employee(
            name=name,
            email=email,
            department_id=department.id,
            hire_date=parsed_hire_date,
            status="Active"
        )
        db.session.add(employee)
        db.session.commit()

        return jsonify({
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "department": department.name,
            "hire_date": employee.hire_date.isoformat(),
            "status": employee.status
        }), 201

    @app.get("/api/orders")
    def orders():
        limit = request.args.get("limit", default=8, type=int)
        limit = max(1, min(limit or 8, 100))
        rows = Order.query.order_by(Order.order_date.desc()).limit(limit).all()

        return jsonify([
            {
                "id": order.id,
                "customer": order.customer.name,
                "order_date": order.order_date.isoformat(),
                "total_amount": float(order.total_amount),
                "status": order.status
            }
            for order in rows
        ])

    @app.get("/api/reports/orders.csv")
    def orders_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Order ID", "Customer", "Order Date", "Amount (INR)", "Status"])

        for order in Order.query.order_by(Order.order_date.desc()).all():
            writer.writerow([
                order.id, order.customer.name, order.order_date.isoformat(),
                float(order.total_amount), order.status
            ])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=companypulse-orders.csv"}
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
