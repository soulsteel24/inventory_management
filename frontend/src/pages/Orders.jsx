import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Plus, Eye, Trash2, X, AlertCircle, ShoppingBag, Receipt } from 'lucide-react';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // New Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([]); // [{ product_id, quantity_ordered, product_obj }]
  
  // Current Item State (being added to draft list)
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [itemError, setItemError] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/customers/'),
        api.get('/products/')
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Handle live stock checks during item selection/editing
  const selectedProduct = products.find(p => p.id === parseInt(currentProductId, 10));

  function handleAddDraftItem() {
    if (!currentProductId) {
      setItemError('Please select a product');
      return;
    }
    const qty = parseInt(currentQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setItemError('Quantity ordered must be greater than zero');
      return;
    }

    if (selectedProduct.quantity < qty) {
      setItemError(`Insufficient stock. Only ${selectedProduct.quantity} units available.`);
      return;
    }

    // Check if product is already in draft order items list
    const existingIndex = orderItems.findIndex(item => item.product_id === selectedProduct.id);
    if (existingIndex >= 0) {
      const newQty = orderItems[existingIndex].quantity_ordered + qty;
      if (selectedProduct.quantity < newQty) {
        setItemError(`Cannot add. Total requested (${newQty}) exceeds stock (${selectedProduct.quantity}).`);
        return;
      }
      const updated = [...orderItems];
      updated[existingIndex].quantity_ordered = newQty;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        product_id: selectedProduct.id,
        quantity_ordered: qty,
        product: selectedProduct
      }]);
    }

    // Reset current item selections
    setCurrentProductId('');
    setCurrentQuantity('1');
    setItemError('');
  }

  function handleRemoveDraftItem(index) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  // Calculate total draft order amount
  const draftTotal = orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity_ordered), 0);

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (orderItems.length === 0) {
      showToast('Please add at least one product to the order', 'error');
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered
      }))
    };

    try {
      await api.post('/orders/', payload);
      showToast('Order created successfully!');
      setIsAddOpen(false);
      setSelectedCustomerId('');
      setOrderItems([]);
      fetchData(); // Refresh orders and products stock count
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteOrder(id) {
    if (!window.confirm('Are you sure you want to cancel and delete this order? Stock will be restored.')) return;
    try {
      await api.delete(`/orders/${id}`);
      showToast('Order deleted and stock restored.');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage client invoices and receipts.</p>
        </div>
        <button
          onClick={() => {
            setOrderItems([]);
            setSelectedCustomerId('');
            setCurrentProductId('');
            setCurrentQuantity('1');
            setItemError('');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
          <p className="text-lg font-medium mb-1 dark:text-white">No orders found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Click the "New Order" button to place your first invoice.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Items Count</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-brand-600 dark:text-brand-400">#ORD-{order.id}</td>
                    <td className="px-6 py-4">
                      {order.customer ? (
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{order.customer.full_name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-550">{order.customer.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Unknown Customer</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">₹{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex gap-2.5">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Order Details (#ORD-{viewingOrder.id})
                  </h3>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Customer</h4>
                  {viewingOrder.customer ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">Name</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingOrder.customer.full_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">Email</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingOrder.customer.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-450 text-sm">Guest Account / Not Registered</p>
                  )}
                </div>

                {/* Items List */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Ordered Items</h4>
                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-2">Item</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Price</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {viewingOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                              {item.product?.name || `Product ID: ${item.product_id}`}
                              {item.product && <span className="block text-xs font-mono text-slate-400 dark:text-slate-550">{item.product.sku}</span>}
                            </td>
                            <td className="py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">{item.quantity_ordered}</td>
                            <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">₹{(item.product?.price || 0).toFixed(2)}</td>
                            <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                              ₹{((item.product?.price || 0) * item.quantity_ordered).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Totals */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">Grand Total</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">₹{viewingOrder.total_amount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Close Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE ORDER MODAL */}
      {isAddOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-2xl w-full overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Order</h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
                {/* Customer Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 input-focus-ring"
                  >
                    <option value="" className="dark:bg-slate-900">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-slate-900">
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Item Panel */}
                <div className="bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3">Add Products</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Dropdown */}
                    <div className="md:col-span-2">
                      <select
                        value={currentProductId}
                        onChange={(e) => {
                          setCurrentProductId(e.target.value);
                          setItemError('');
                        }}
                        className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white input-focus-ring"
                      >
                        <option value="" className="dark:bg-slate-900">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="dark:bg-slate-900">
                            {p.name} - ₹{p.price.toFixed(2)} (Stock: {p.quantity})
                          </option>
                        ))}
                      </select>
                      {selectedProduct && (
                        <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">
                          Available Stock: <span className="font-bold text-slate-700 dark:text-slate-350">{selectedProduct.quantity} units</span>
                        </p>
                      )}
                    </div>

                    {/* Quantity and Add Button */}
                    <div className="flex gap-2 items-start">
                      <input
                        type="number"
                        min="1"
                        value={currentQuantity}
                        onChange={(e) => {
                          setCurrentQuantity(e.target.value);
                          setItemError('');
                        }}
                        className="w-20 px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg text-sm input-focus-ring"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={handleAddDraftItem}
                        className="flex-1 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>

                  {itemError && (
                    <p className="text-xs text-rose-500 mt-2.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {itemError}
                    </p>
                  )}
                </div>

                {/* Draft Items List */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">Order Items Draft</h4>
                  {orderItems.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-550 text-xs">
                      No items added to this order draft yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 max-h-40 overflow-y-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="px-4 py-2">Product</th>
                            <th className="px-4 py-2 text-right">Quantity</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                            <th className="px-4 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {orderItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{item.product.name}</td>
                              <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-350">{item.quantity_ordered}</td>
                              <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                                ₹{(item.product.price * item.quantity_ordered).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftItem(index)}
                                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-450 font-semibold"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Order Amount</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">₹{draftTotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-300 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderItems.length === 0}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer ${
                      orderItems.length === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-brand-500 hover:bg-brand-600 text-white'
                    }`}
                  >
                    Submit Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Orders;
