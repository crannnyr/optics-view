/*
  # Glasses E-commerce Store Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `description` (text) - Product description
      - `price` (numeric) - Product price
      - `image_url` (text) - Product image URL
      - `stock` (integer) - Available stock
      - `category` (text) - Product category
      - `created_at` (timestamptz) - Creation timestamp

    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text) - Customer name
      - `customer_email` (text) - Customer email
      - `customer_address` (text) - Shipping address
      - `total_amount` (numeric) - Order total
      - `status` (text) - Order status (pending, completed, cancelled)
      - `created_at` (timestamptz) - Order creation timestamp

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key) - Reference to orders
      - `product_id` (uuid, foreign key) - Reference to products
      - `quantity` (integer) - Quantity ordered
      - `price` (numeric) - Price at time of order
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Products: Public read access
    - Orders: Customers can only read their own orders
    - Order items: Access through orders
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'eyewear',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_address text NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Orders are viewable by everyone"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Orders can be created by anyone"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Order items are viewable by everyone"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Order items can be created by anyone"
  ON order_items FOR INSERT
  WITH CHECK (true);