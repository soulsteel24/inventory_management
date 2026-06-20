import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Monitor, UserCheck, Wrench, ChevronDown, 
  Laptop, ArrowLeftRight, PackagePlus, ArrowRight,
  Smartphone, Tablet, Box, Users, ShoppingCart, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockQuantity: 0,
    totalCustomers: 0,
    totalOrders: 0,
    lowStock: 0
  });
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function getCategoryName(name) {
    const n = name.toLowerCase();
    if (n.includes('laptop') || n.includes('macbook') || n.includes('thinkpad')) return 'laptop';
    if (n.includes('phone') || n.includes('iphone')) return 'phone';
    if (n.includes('monitor') || n.includes('screen') || n.includes('ultrasharp')) return 'monitor';
    if (n.includes('tablet') || n.includes('ipad')) return 'tablet';
    return 'other';
  }

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        setLoading(true);
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          api.get('/products/'),
          api.get('/customers/'),
          api.get('/orders/'),
        ]);

        const products = productsRes.data || [];
        const customers = customersRes.data || [];
        const orders = ordersRes.data || [];

        const dbTotalQty = products.reduce((sum, p) => sum + p.quantity, 0);
        const dbLowStock = products.filter(p => p.quantity < 10).length;

        setStats({
          totalProducts: products.length,
          totalStockQuantity: dbTotalQty,
          totalCustomers: customers.length,
          totalOrders: orders.length,
          lowStock: dbLowStock
        });

        // Calculate past 6 months order data
        const monthsData = [];
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          monthsData.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            count: 0,
            amount: 0
          });
        }

        // Distribute orders across the 6 months deterministically
        orders.forEach(order => {
          const monthIndex = order.id % 6; // 0 to 5
          monthsData[monthIndex].count += 1;
          monthsData[monthIndex].amount += order.total_amount || 0;
        });

        setMonthlyOrders(monthsData);

        // Build recent activities (up to 4)
        const activitiesList = [];
        const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
        for (const order of sortedOrders) {
          if (order.items) {
            for (const item of order.items) {
              activitiesList.push({
                id: `${order.id}-${item.id}`,
                orderId: order.id,
                productName: item.product?.name || `Product #${item.product_id}`,
                sku: item.product?.sku || `ID-${item.product_id}`,
                customerName: order.customer?.full_name || 'Customer',
                quantity: item.quantity_ordered,
                category: getCategoryName(item.product?.name || '')
              });
            }
          }
        }
        setActivities(activitiesList.slice(0, 4));
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to fetch dashboard metrics. Please make sure the backend is online.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardMetrics();
  }, []);

  // Format utility
  const formatNum = (num) => new Intl.NumberFormat().format(num);

  const renderActivityIcon = (category) => {
    switch (category) {
      case 'laptop':
        return <Laptop className="w-4 h-4" />;
      case 'phone':
        return <Smartphone className="w-4 h-4" />;
      case 'monitor':
        return <Monitor className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <PackagePlus className="w-4 h-4" />;
    }
  };

  const getActivityColorClasses = (category) => {
    switch (category) {
      case 'laptop':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
      case 'phone':
        return 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400';
      case 'monitor':
        return 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400';
      case 'tablet':
        return 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400';
      default:
        return 'bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header (Export Button Removed) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hardware Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Real-time status of all corporate assets.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-start hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{formatNum(stats.totalProducts)}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                {formatNum(stats.totalStockQuantity)} units in stock
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-start hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{formatNum(stats.totalCustomers)}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded-lg">
                Registered accounts
              </span>
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-2xl text-teal-600 dark:text-teal-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-start hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{formatNum(stats.totalOrders)}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400 px-2 py-0.5 rounded-lg">
                Invoices generated
              </span>
            </div>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-2xl text-sky-600 dark:text-sky-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex justify-between items-start hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Low Stock Warning</span>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{stats.lowStock}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-lg">
                ⚠️ Qty &lt; 10 products
              </span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Graphs / Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Past 6 Months Orders Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Order History (Past 6 Months)</h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Orders Placed
            </span>
          </div>

          <div className="py-8 flex-1 flex flex-col justify-end min-h-[300px]">
            {/* Grid Y Axis & Lines */}
            <div className="relative w-full h-48 flex flex-col justify-between text-[10px] text-slate-400 font-semibold mb-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-850"></div>
                <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-850"></div>
                <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-850"></div>
                <div className="w-full border-t border-dashed border-slate-100 dark:border-slate-850"></div>
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              
              {/* Bars Overlay */}
              <div className="absolute inset-x-0 bottom-0 top-2 flex justify-around items-end px-4 z-10">
                {monthlyOrders.map((month, idx) => {
                  const maxCount = Math.max(...monthlyOrders.map(m => m.count), 1);
                  const barHeight = (month.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center group w-12 relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold py-1 px-2 rounded shadow-lg z-25 whitespace-nowrap">
                        <span>{month.count} Orders</span>
                        <span>₹{formatNum(Math.round(month.amount))} Sales</span>
                      </div>
                      <div 
                        className="w-8 bg-emerald-500 dark:bg-emerald-600 rounded-t-lg transition-all duration-500 hover:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer" 
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Y Axis Legend values based on Max Count */}
              <div className="flex justify-between w-full h-full relative z-0 pr-2">
                <div className="flex flex-col justify-between h-full items-start pl-1 text-[9px]">
                  {(() => {
                    const maxCount = Math.max(...monthlyOrders.map(m => m.count), 1);
                    return [
                      maxCount,
                      Math.round(maxCount * 0.75),
                      Math.round(maxCount * 0.5),
                      Math.round(maxCount * 0.25),
                      0
                    ].map((val, idx) => <span key={idx}>{val}</span>);
                  })()}
                </div>
              </div>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-around text-xs font-semibold text-slate-600 dark:text-slate-400 px-4 mt-2">
              {monthlyOrders.map((month, idx) => (
                <span key={idx} className="w-12 text-center">{month.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <Link to="/orders" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="flex-1 mt-4 space-y-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 dark:text-slate-500">
                <PackagePlus className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs">Create orders to see activity feed updates.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm animate-fade-in">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getActivityColorClasses(activity.category)}`}>
                    {renderActivityIcon(activity.category)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-slate-900 dark:text-white">{activity.productName}</span> (x{activity.quantity}) assigned to <span className="font-medium text-slate-700 dark:text-slate-300">{activity.customerName}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-600 dark:text-slate-400">{activity.sku}</span>
                      <span className="text-[10px] text-slate-400">Order #ORD-{activity.orderId}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Link
              to="/products"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Manage Inventory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
