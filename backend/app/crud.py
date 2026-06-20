from sqlalchemy.orm import Session
from backend.app.models import Product, Customer, Order, OrderItem
from backend.app.schemas import ProductCreate, ProductUpdate, CustomerCreate, OrderCreate
from fastapi import HTTPException, status

# --- PRODUCT CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()

def get_products(db: Session):
    return db.query(Product).all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product

# --- CUSTOMER CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email).first()

def get_customers(db: Session):
    return db.query(Customer).all()

def create_customer(db: Session, customer: CustomerCreate):
    db_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer

# --- ORDER CRUD ---
def get_order(db: Session, order_id: int):
    return db.query(Order).filter(Order.id == order_id).first()

def get_orders(db: Session):
    return db.query(Order).all()

def create_order(db: Session, order_in: OrderCreate):
    # 1. Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {order_in.customer_id} not found"
        )

    # We will run this inside a transaction context
    total_amount = 0.0
    order_items_to_create = []

    # 2. Process and validate order items
    for item in order_in.items:
        product = get_product(db, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found"
            )
        
        if product.quantity < item.quantity_ordered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Requested: {item.quantity_ordered}, Available: {product.quantity}"
            )
        
        # Deduct quantity
        product.quantity -= item.quantity_ordered
        
        # Calculate total
        total_amount += product.price * item.quantity_ordered
        
        # Prepare OrderItem
        order_items_to_create.append(
            OrderItem(
                product_id=product.id,
                quantity_ordered=item.quantity_ordered
            )
        )

    # 3. Create Order
    db_order = Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush() # Get the order ID

    # 4. Associate OrderItems with Order ID and add them
    for order_item in order_items_to_create:
        order_item.order_id = db_order.id
        db.add(order_item)

    # 5. Commit all transaction changes
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    
    # Optional logic: do we restore the product stock on order deletion?
    # Usually in simplified order management, deleting an order deletes order_items (via cascade)
    # but let's restore stock to be clean and comprehensive!
    for item in db_order.items:
        product = get_product(db, item.product_id)
        if product:
            product.quantity += item.quantity_ordered
            
    db.delete(db_order)
    db.commit()
    return db_order
