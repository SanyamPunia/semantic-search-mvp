/**
 * product information type
 */
export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  currency: string;
  brand: string;
  category: string;
  subcategory?: string;
  colors: string[];
  sizes: string[];
  gender?: "men" | "women" | "unisex";
  imageUrls: string[];
  sourceUrl: string;
  sourceSite: string;
  available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
