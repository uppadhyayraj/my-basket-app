export interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number; // Percentage discount (0.00 – 100.00), up to two decimal places
  description: string;
  image: string;
  dataAiHint: string;
  category?: string;
  inStock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
