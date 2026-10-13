export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageurls: string;
  rating?: number;
  numReviews?: number;
};

export type CartItem = { product: Product; quantity: number };
export type User = { id: string; name: string; email: string; role: "user" | "admin"; token: string };
export type Order = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt?: string;
  items: { product: Product | string; quantity: number; price: number }[];
};

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
  if (!response.ok) throw new ApiError(body.message || `Request failed (${response.status})`, body.code);
  return body as T;
}

export const assetUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/uploads/")) return path;
  const apiOrigin = API_URL.replace(/\/api\/?$/, "");
  return `${apiOrigin}${path}`;
};

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
