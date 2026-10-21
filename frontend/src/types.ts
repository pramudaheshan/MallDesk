export type Role = 'administrator' | 'manager' | 'staff' | string;

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

export interface Store {
  id: number;
  name: string;
  role?: Role;
  address?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  selling_price: number | string;
  cost_price?: number | string;
  supplier?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  store_id?: number;
}

export interface Membership {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  role: Role;
  store_id?: number;
}

export interface AssistantResponse {
  answer: string;
  store_id: number;
  store_name?: string;
}

export interface AuthMe {
  user: User;
  stores: Store[];
}

export type ProductInput = Omit<Product, 'id' | 'store_id'>;
