import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Box, Users, ShoppingCart, Menu, X, 
  Settings, HelpCircle, LogOut, Sun, Moon, Bell, Search, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { ClerkProvider, UserButton, AuthenticateWithRedirectCallback } from '@clerk/react';
import { dark } from '@clerk/themes';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';


// Import Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Custom simple pages for Settings/Support placeholder to avoid breaking links
function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Account Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <img src={user?.profile_pic} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{user?.username}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Security Setting</span>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Tokens and Session cookies are active. Your session expires in 24 hours.</p>
        </div>
      </div>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Support Center</h2>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
        Need assistance with **Inventory SYNC**? Contact our technical team.
      </p>
      <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
        <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">📧 Email Support: support@inventorysync.com</p>
        <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">📞 Phone: +1 (800) 555-SYNC</p>
      </div>
    </div>
  );
}

// Layout Wrapper
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Inventory', to: '/products', icon: Box },
    { name: 'Customers', to: '/customers', icon: Users },
    { name: 'Orders', to: '/orders', icon: ShoppingCart },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200 overflow-hidden">
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
            IS
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Inventory SYNC
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:flex md:flex-col shrink-0 ${
          isCollapsed ? 'md:w-16' : 'md:w-64'
        } ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0'
        }`}
      >
        {/* Toggle Collapse Button (Desktop only) */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs z-50 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Content Wrapper for clean transitions and overflow clipping */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Brand Logo header matching screenshot */}
          <div className={`h-20 flex items-center justify-between border-b border-slate-150 dark:border-slate-800/50 transition-all duration-300 px-6 ${
            isCollapsed ? 'md:px-3 md:justify-center' : ''
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-brand-500/30 shrink-0">
                IS
              </div>
              <h1 className={`text-base font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate transition-all duration-300 ${
                isCollapsed ? 'md:hidden' : 'md:block'
              }`}>
                InventorySYNC
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Asset Quick Button */}
          <div className={`px-4 py-4 flex transition-all duration-300 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <Link
              to="/products"
              title="Add New Asset"
              className={`bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                isCollapsed 
                  ? 'w-full py-3 px-4 gap-2 text-sm font-semibold md:w-10 md:h-10 md:p-0 md:gap-0' 
                  : 'w-full py-3 px-4 gap-2 text-sm font-semibold'
              }`}
            >
              <Plus className="w-4.5 h-4.5 shrink-0" />
              <span className={`transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>
                Add New Asset
              </span>
            </Link>
          </div>

          {/* Navigation list */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  title={item.name}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
                      isCollapsed 
                        ? 'gap-3 px-4 py-3 md:justify-center md:p-3 md:gap-0' 
                        : 'gap-3 px-4 py-3'
                    } ${
                      isActive
                        ? 'bg-slate-200/65 text-slate-800 dark:bg-slate-800 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className={`transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer/Bottom actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer ${
                isCollapsed 
                  ? 'gap-3 px-4 py-3 text-left md:justify-center md:p-3 md:gap-0' 
                  : 'gap-3 px-4 py-3 text-left'
              }`}
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              <span className={`transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'md:inline'}`}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-slate-950/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar matching screenshot */}
        <header className="hidden md:flex h-20 items-center justify-end px-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/50 sticky top-0 z-30 transition-colors">
          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode switcher */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800 pl-4">
              <UserButton afterSignOutUrl="/login" />
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.username}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkKeyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6 animate-fade-in relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl text-2xl font-bold mb-2">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Clerk Configuration Required</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          The <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing or empty.
        </p>
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-left text-xs font-mono text-slate-600 dark:text-slate-300">
          <p className="mb-2 font-bold text-slate-700 dark:text-slate-200">How to set it up:</p>
          <p className="mb-1">1. Create a <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-bold">.env</code> file in <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">frontend/</code></p>
          <p>2. Add: <code className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded font-bold text-brand-500 dark:text-brand-500">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code></p>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Restart your development server after adding the key.</p>
      </div>
    </div>
  );
}

function ClerkProviderWithTheme() {
  const { theme } = useTheme();

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#10b981',
        }
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Standalone Authentication pages */}
              <Route path="/login/*" element={<Login />} />
              <Route path="/signup/*" element={<Signup />} />
              <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

              {/* Protected Workspace Layout Pages */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/support" element={<SupportPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPublishableKey) {
    return (
      <ThemeProvider>
        <ClerkKeyFallback />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ClerkProviderWithTheme />
    </ThemeProvider>
  );
}

export default App;
