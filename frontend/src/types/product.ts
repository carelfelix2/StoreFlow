export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  is_active: boolean;
}

export interface ProductUnit {
  id: string;
  product_id: string;
  unit_name: string;
  conversion_to_base: number;
  selling_price: number;
  is_default: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  category_id: string;
  category: ProductCategory | null;
  units: ProductUnit[];
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}
