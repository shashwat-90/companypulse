const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong while loading data.");
  }
  return data;
}

export function getSummary() {
  return request("/dashboard/summary");
}

export function getRevenue(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const query = params.toString();
  return request(`/analytics/revenue${query ? `?${query}` : ""}`);
}

export function getEmployeeStats() {
  return request("/analytics/employees");
}

export function getOrders() {
  return request("/orders?limit=7");
}

export function getDepartments() {
  return request("/departments");
}

export async function downloadOrdersCsv() {
  const response = await fetch(`${API_BASE}/reports/orders.csv`);
  if (!response.ok) throw new Error("Could not download the report.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "companypulse-orders.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
