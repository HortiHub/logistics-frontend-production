import React, { useState, useEffect } from 'react';
import './App.css';

// API configuration - Fixed URL construction
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

console.log('API Base URL:', API_BASE_URL); // Debug line

// API helper functions
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct URL properly
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    
    console.log('Making request to:', url); // Debug line
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  },

  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/orders${queryString ? `?${queryString}` : ''}`);
  },

  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async optimizeRoute(routeData) {
    return this.request('/api/routes/optimize', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },

  async getDriverRoutes(driverId) {
    return this.request(`/api/driver/routes/${driverId}`);
  },

  async confirmDelivery(orderId, deliveryData) {
    return this.request(`/api/orders/${orderId}/deliver`, {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  },
};

// Login Component
function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    role: 'pos_operator'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', credentials);
      const response = await api.login(credentials);
      console.log('Login successful:', response);
      
      localStorage.setItem('token', response.token);
      onLogin(response.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Logistics Platform Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Role:</label>
          <select 
            value={credentials.role}
            onChange={(e) => setCredentials({...credentials, role: e.target.value})}
          >
            <option value="pos_operator">POS Operator</option>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            required
            placeholder="admin@logistics.co"
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            required
            placeholder="password123"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="demo-credentials">
          <small>
            Demo credentials:<br/>
            admin@logistics.co / password123<br/>
            pos1@logistics.co / password123<br/>
            driver1@logistics.co / password123
          </small>
        </div>
      </form>
    </div>
  );
}

// POS Component for taking orders
function POSInterface({ user }) {
  const [order, setOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    special_instructions: '',
    items: []
  });
  
  const [currentItem, setCurrentItem] = useState({
    product_name: '',
    quantity: 1,
    unit_price: 0
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const addItem = () => {
    if (!currentItem.product_name || currentItem.unit_price <= 0) return;
    
    setOrder({
      ...order,
      items: [...order.items, { ...currentItem, id: Date.now() }]
    });
    
    setCurrentItem({ product_name: '', quantity: 1, unit_price: 0 });
  };

  const removeItem = (id) => {
    setOrder({
      ...order,
      items: order.items.filter(item => item.id !== id)
    });
  };

  const calculateTotal = () => {
    return order.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      const orderData = {
        ...order,
        total_amount: calculateTotal()
      };

      await api.createOrder(orderData);
      
      setSuccess('Order created successfully!');
      setOrder({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        special_instructions: '',
        items: []
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      setSuccess(''); // Clear success message on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-interface">
      <h2>Point of Sale - Create New Order</h2>
      
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="customer-info">
          <h3>Customer Information</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Customer Name"
              value={order.customer_name}
              onChange={(e) => setOrder({...order, customer_name: e.target.value})}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={order.customer_phone}
              onChange={(e) => setOrder({...order, customer_phone: e.target.value})}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email (optional)"
            value={order.customer_email}
            onChange={(e) => setOrder({...order, customer_email: e.target.value})}
          />
          
          <textarea
            placeholder="Delivery Address"
            value={order.delivery_address}
            onChange={(e) => setOrder({...order, delivery_address: e.target.value})}
            required
          />
          
          <textarea
            placeholder="Special Instructions (optional)"
            value={order.special_instructions}
            onChange={(e) => setOrder({...order, special_instructions: e.target.value})}
          />
        </div>

        <div className="order-items">
          <h3>Order Items</h3>
          
          <div className="add-item">
            <input
              type="text"
              placeholder="Product Name"
              value={currentItem.product_name}
              onChange={(e) => setCurrentItem({...currentItem, product_name: e.target.value})}
            />
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value)})}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit Price"
              value={currentItem.unit_price}
              onChange={(e) => setCurrentItem({...currentItem, unit_price: parseFloat(e.target.value)})}
            />
            <button type="button" onClick={addItem}>Add Item</button>
          </div>

          <div className="items-list">
            {order.items.map((item) => (
              <div key={item.id} className="item-row">
                <span>{item.product_name}</span>
                <span>Qty: {item.quantity}</span>
                <span>${item.unit_price.toFixed(2)} each</span>
                <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                <button type="button" onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="order-total">
            <strong>Total: ${calculateTotal().toFixed(2)}</strong>
          </div>
        </div>

        <button type="submit" disabled={loading || order.items.length === 0}>
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
}

// Admin Dashboard Component - Simplified without Socket.IO
function AdminDashboard({ user }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({ status: filter === 'all' ? '' : filter });
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const optimizeRoute = async () => {
    if (selectedOrders.length === 0) return;
    
    try {
      await api.optimizeRoute({
        orderIds: selectedOrders,
        driverId: 2, // In production, select from available drivers
        startLocation: { lat: 40.7128, lng: -74.0060 } // Warehouse location
      });
      
      alert('Route optimized and assigned to driver!');
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Failed to optimize route:', error);
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="dashboard-controls">
        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="delivered">Delivered</option>
          </select>
          <button onClick={fetchOrders}>Refresh</button>
        </div>
        
        {selectedOrders.length > 0 && (
          <div className="route-controls">
            <span>{selectedOrders.length} orders selected</span>
            <button onClick={optimizeRoute}>Optimize Route</button>
          </div>
        )}
      </div>

      {loading ? (
        <div>Loading orders...</div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className={`order-card ${order.status}`}>
              <div className="order-header">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleOrderSelection(order.id)}
                  disabled={order.status !== 'pending'}
                />
                <h4>Order #{order.id}</h4>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>
              
              <div className="order-details">
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Phone:</strong> {order.customer_phone}</p>
                <p><strong>Address:</strong> {order.delivery_address}</p>
                <p><strong>Total:</strong> ${order.total_amount}</p>
                <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
                
                {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="order-items">
                    <strong>Items:</strong>
                    {order.items.map((item, index) => (
                      <div key={index}>
                        {item.quantity}x {item.product_name} @ ${item.unit_price}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Driver App Component - Simplified without Socket.IO
function DriverApp({ user }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [user.id]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await api.getDriverRoutes(user.id);
      setRoutes(data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (orderId) => {
    try {
      const deliveryData = {
        delivered_at: new Date().toISOString(),
        notes: 'Delivered successfully'
      };
      
      await api.confirmDelivery(orderId, deliveryData);
      fetchRoutes();
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  return (
    <div className="driver-app">
      <h2>Driver Dashboard - {user.name}</h2>

      {loading ? (
        <div>Loading routes...</div>
      ) : (
        <div className="routes-list">
          {routes.map((route) => (
            <div key={route.id} className="route-card">
              <h3>Route #{route.id}</h3>
              <p>Status: {route.status}</p>
              <p>Orders: {route.orders?.length || 0}</p>
              
              <div className="route-orders">
                {route.orders?.map((order) => (
                  <div key={order.id} className="route-order">
                    <h4>Order #{order.id} - {order.customer_name}</h4>
                    <p>{order.delivery_address}</p>
                    <p>Phone: {order.customer_phone}</p>
                    <p>Total: ${order.total_amount}</p>
                    
                    {order.status === 'assigned' && (
                      <div className="delivery-actions">
                        <button onClick={() => confirmDelivery(order.id)}>
                          Confirm Delivery
                        </button>
                      </div>
                    )}
                    
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main App Component - FIXED
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate it properly
    const token = localStorage.getItem('token');
    if (token) {
      // Try to parse the token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          // Token is still valid
          setUser({
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            name: payload.email.split('@')[0] // Fallback name
          });
        } else {
          // Token expired
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Logistics Platform</h1>
        <div className="user-info">
          <span>Welcome, {user.name} ({user.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="app-main">
        {user.role === 'pos_operator' && <POSInterface user={user} />}
        {user.role === 'admin' && <AdminDashboard user={user} />}
        {user.role === 'manager' && <AdminDashboard user={user} />}
        {user.role === 'driver' && <DriverApp user={user} />}
      </main>
    </div>
  );
}

export default App;
