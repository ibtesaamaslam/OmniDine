import React, { useState, useContext, createContext, useEffect, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ChefHat, 
  Settings, 
  LogOut, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  DollarSign,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  AlertTriangle,
  Package,
  Edit,
  Save,
  RefreshCw,
  Calendar,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';

// --- TYPES & INTERFACES ---

type Role = 'admin' | 'manager' | 'waiter' | 'chef' | 'customer';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface Modifier {
  id: string;
  name: string;
  price: number;
}

interface IngredientRef {
  inventoryItemId: string;
  quantity: number; // Amount consumed per dish
}

interface Dish {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  available: boolean;
  modifiers?: Modifier[];
  recipe?: IngredientRef[]; // Link to inventory
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  threshold: number;
}

interface Category {
  id: string;
  name: string;
  status?: string;
}

interface OrderItem {
  id: string;
  dishId: string;
  name: string;
  price: number; // Unit price (base + modifiers)
  modifiers: Modifier[];
  qty: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

interface Order {
  id: string; // Sequence ID like "001"
  tableId: string;
  serverName: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'paid';
  total: number;
  createdAt: Date;
}

interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  seats: number;
}

interface Reservation {
  id: string;
  tableId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
  contact?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

// --- MOCK DATA ---

const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Starters' },
  { id: 'c2', name: 'Mains' },
  { id: 'c3', name: 'Burgers' },
  { id: 'c4', name: 'Drinks' },
  { id: 'c5', name: 'Desserts' },
];

const BURGER_MODIFIERS: Modifier[] = [
  { id: 'm1', name: 'Extra Cheese', price: 1.50 },
  { id: 'm2', name: 'Bacon', price: 2.00 },
  { id: 'm3', name: 'No Onions', price: 0 },
  { id: 'm4', name: 'Gluten Free Bun', price: 1.00 },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Burger Bun', unit: 'pcs', stock: 50, threshold: 10 },
  { id: 'inv2', name: 'Beef Patty', unit: 'pcs', stock: 40, threshold: 10 },
  { id: 'inv3', name: 'Cheese Slice', unit: 'pcs', stock: 100, threshold: 20 },
  { id: 'inv4', name: 'Lettuce', unit: 'head', stock: 10, threshold: 2 },
  { id: 'inv5', name: 'Tomato', unit: 'kg', stock: 5, threshold: 1 },
  { id: 'inv6', name: 'Fries', unit: 'kg', stock: 20, threshold: 5 },
  { id: 'inv7', name: 'Salmon Fillet', unit: 'pcs', stock: 15, threshold: 3 },
  { id: 'inv8', name: 'Steak', unit: 'pcs', stock: 12, threshold: 3 },
];

const INITIAL_DISHES: Dish[] = [
  { id: 'd1', categoryId: 'c1', name: 'Garlic Bread', price: 6.50, available: true, description: 'Toasted baguette with garlic butter' },
  { id: 'd2', categoryId: 'c1', name: 'Calamari', price: 12.00, available: true, description: 'Crispy fried squid with tartar sauce' },
  { id: 'd3', categoryId: 'c2', name: 'Grilled Salmon', price: 24.00, available: true, description: 'Fresh atlantic salmon with asparagus', recipe: [{ inventoryItemId: 'inv7', quantity: 1 }] },
  { id: 'd4', categoryId: 'c2', name: 'Ribeye Steak', price: 32.00, available: true, description: '300g premium beef with chips', recipe: [{ inventoryItemId: 'inv8', quantity: 1 }, { inventoryItemId: 'inv6', quantity: 0.2 }] },
  { 
    id: 'd5', 
    categoryId: 'c3', 
    name: 'Classic Cheeseburger', 
    price: 16.00, 
    available: true, 
    description: 'Beef patty, cheddar, lettuce, tomato', 
    modifiers: BURGER_MODIFIERS,
    recipe: [
      { inventoryItemId: 'inv1', quantity: 1 },
      { inventoryItemId: 'inv2', quantity: 1 },
      { inventoryItemId: 'inv3', quantity: 1 },
      { inventoryItemId: 'inv4', quantity: 0.1 },
      { inventoryItemId: 'inv5', quantity: 0.1 }
    ]
  },
  { id: 'd6', categoryId: 'c3', name: 'Vegan Burger', price: 18.00, available: true, description: 'Plant-based patty with avocado', modifiers: BURGER_MODIFIERS },
  { id: 'd7', categoryId: 'c4', name: 'Cola', price: 4.00, available: true },
  { id: 'd8', categoryId: 'c4', name: 'Craft Beer', price: 8.00, available: true },
  { id: 'd9', categoryId: 'c5', name: 'Cheesecake', price: 9.00, available: true, description: 'New York style' },
];

const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
  status: 'available',
  seats: i < 6 ? 2 : 4,
}));

// --- STATE STORE ---

type AppState = {
  user: User | null;
  categories: Category[];
  dishes: Dish[];
  tables: Table[];
  orders: Order[];
  inventory: InventoryItem[];
  reservations: Reservation[];
};

type Action = 
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ORDER'; payload: Omit<Order, 'id'> } // ID generated in reducer
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
  | { type: 'UPDATE_ORDER_ITEM_STATUS'; payload: { orderId: string; itemId: string; status: OrderItem['status'] } }
  | { type: 'UPDATE_TABLE_STATUS'; payload: { tableId: string; status: Table['status'] } }
  | { type: 'ADD_DISH'; payload: Dish }
  | { type: 'UPDATE_DISH'; payload: Dish }
  | { type: 'DELETE_DISH'; payload: string }
  | { type: 'TOGGLE_DISH_AVAILABILITY'; payload: string }
  | { type: 'UPDATE_INVENTORY'; payload: { itemId: string; newStock: number } }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY_ITEM'; payload: string }
  | { type: 'CONSUME_INVENTORY'; payload: { items: OrderItem[] } }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'UPDATE_RESERVATION'; payload: Reservation }
  | { type: 'CANCEL_RESERVATION'; payload: string };

const initialState: AppState = {
  user: null,
  categories: INITIAL_CATEGORIES,
  dishes: INITIAL_DISHES,
  tables: INITIAL_TABLES,
  orders: [],
  inventory: INITIAL_INVENTORY,
  reservations: [],
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN': return { ...state, user: action.payload };
    case 'LOGOUT': return { ...state, user: null };
    case 'ADD_ORDER': {
      // Sequential ID Generation 001, 002, etc.
      const nextId = String(state.orders.length + 1).padStart(3, '0');
      const newOrder: Order = { ...action.payload, id: nextId };
      return { ...state, orders: [newOrder, ...state.orders] };
    }
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o)
      };
    case 'UPDATE_ORDER_ITEM_STATUS':
      return {
        ...state,
        orders: state.orders.map(o => {
          if (o.id !== action.payload.orderId) return o;
          const updatedItems = o.items.map(item => 
            item.id === action.payload.itemId ? { ...item, status: action.payload.status } : item
          );
          // Check if all items are ready to auto-update order status
          const allReady = updatedItems.every(i => i.status === 'ready' || i.status === 'served');
          return { ...o, items: updatedItems, status: allReady ? 'ready' : o.status };
        })
      };
    case 'UPDATE_TABLE_STATUS':
      return {
        ...state,
        tables: state.tables.map(t => t.id === action.payload.tableId ? { ...t, status: action.payload.status } : t)
      };
    case 'ADD_DISH': return { ...state, dishes: [...state.dishes, action.payload] };
    case 'UPDATE_DISH': 
      return { ...state, dishes: state.dishes.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DISH':
      return { ...state, dishes: state.dishes.filter(d => d.id !== action.payload) };
    case 'TOGGLE_DISH_AVAILABILITY':
      return {
        ...state,
        dishes: state.dishes.map(d => d.id === action.payload ? { ...d, available: !d.available } : d)
      };
    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.map(item => 
          item.id === action.payload.itemId ? { ...item, stock: action.payload.newStock } : item
        )
      };
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'DELETE_INVENTORY_ITEM':
      return { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };
    case 'CONSUME_INVENTORY': {
      const newInventory = [...state.inventory];
      action.payload.items.forEach(orderItem => {
        const dish = state.dishes.find(d => d.id === orderItem.dishId);
        if (dish && dish.recipe) {
          dish.recipe.forEach(ingredient => {
            const invItem = newInventory.find(i => i.id === ingredient.inventoryItemId);
            if (invItem) {
              invItem.stock = Math.max(0, invItem.stock - (ingredient.quantity * orderItem.qty));
            }
          });
        }
      });
      return { ...state, inventory: newInventory };
    }
    case 'ADD_RESERVATION':
      return { ...state, reservations: [...state.reservations, action.payload] };
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'CANCEL_RESERVATION':
      return { ...state, reservations: state.reservations.map(r => r.id === action.payload ? { ...r, status: 'cancelled' } : r) };
    default: return state;
  }
};

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

// --- HELPERS ---

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const areModifiersEqual = (mods1: Modifier[], mods2: Modifier[]) => {
  if (mods1.length !== mods2.length) return false;
  const ids1 = mods1.map(m => m.id).sort();
  const ids2 = mods2.map(m => m.id).sort();
  return ids1.every((id, index) => id === ids2[index]);
};

// --- COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const AddDishModal = ({ isOpen, onClose, dishToEdit }: { isOpen: boolean; onClose: () => void; dishToEdit?: Dish }) => {
  const { state, dispatch } = useContext(StoreContext);
  const [formData, setFormData] = useState<Partial<Dish>>({
    name: '',
    categoryId: INITIAL_CATEGORIES[0].id,
    price: 0,
    description: '',
    available: true
  });

  useEffect(() => {
    if (dishToEdit) {
      setFormData(dishToEdit);
    } else {
      setFormData({
        name: '',
        categoryId: state.categories[0]?.id || INITIAL_CATEGORIES[0].id,
        price: 0,
        description: '',
        available: true
      });
    }
  }, [dishToEdit, isOpen, state.categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dishToEdit) {
      dispatch({ type: 'UPDATE_DISH', payload: { ...dishToEdit, ...formData } as Dish });
    } else {
      dispatch({ 
        type: 'ADD_DISH', 
        payload: { ...formData, id: Date.now().toString(), modifiers: [], recipe: [] } as Dish 
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dishToEdit ? "Edit Dish" : "Add New Dish"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded-lg p-2"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select 
            className="w-full border rounded-lg p-2"
            value={formData.categoryId}
            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
          >
            {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
          <input 
            required 
            type="number" 
            step="0.01"
            className="w-full border rounded-lg p-2"
            value={formData.price || 0}
            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea 
            className="w-full border rounded-lg p-2"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })} 
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

const AddInventoryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { dispatch } = useContext(StoreContext);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    unit: 'pcs',
    stock: 0,
    threshold: 5
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ 
      type: 'ADD_INVENTORY_ITEM', 
      payload: { ...formData, id: Date.now().toString() } as InventoryItem 
    });
    setFormData({ name: '', unit: 'pcs', stock: 0, threshold: 5 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded-lg p-2"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
          <input 
            required 
            type="text" 
            placeholder="e.g., kg, pcs, box"
            className="w-full border rounded-lg p-2"
            value={formData.unit || ''}
            onChange={e => setFormData({ ...formData, unit: e.target.value })} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
            <input 
              required 
              type="number" 
              className="w-full border rounded-lg p-2"
              value={formData.stock || 0}
              onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Low Threshold</label>
            <input 
              required 
              type="number" 
              className="w-full border rounded-lg p-2"
              value={formData.threshold || 0}
              onChange={e => setFormData({ ...formData, threshold: parseFloat(e.target.value) })} 
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Item</Button>
        </div>
      </form>
    </Modal>
  );
};

const AddReservationModal = ({ isOpen, onClose, reservationToEdit }: { isOpen: boolean; onClose: () => void, reservationToEdit?: Reservation }) => {
  const { state, dispatch } = useContext(StoreContext);
  const [formData, setFormData] = useState<Partial<Reservation>>({
    customerName: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    tableId: ''
  });

  useEffect(() => {
    if (reservationToEdit) {
      setFormData(reservationToEdit);
    } else {
      setFormData({
        customerName: '',
        guests: 2,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        tableId: ''
      });
    }
  }, [reservationToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tableId) {
      alert("Please select a table.");
      return;
    }

    if (reservationToEdit) {
        dispatch({
            type: 'UPDATE_RESERVATION',
            payload: { ...reservationToEdit, ...formData } as Reservation
        });
        
        // Update table status if table changed or date is today
        const now = new Date();
        const isToday = formData.date === now.toISOString().split('T')[0];
        if (isToday) {
             // If table changed, free old table? Not necessarily, might still be reserved by someone else. 
             // For simplicity in this demo, we just ensure the new table is reserved.
             dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: formData.tableId || '', status: 'reserved' } });
        }
    } else {
        const reservation: Reservation = {
        id: Date.now().toString(),
        tableId: formData.tableId || '',
        customerName: formData.customerName || '',
        guests: formData.guests || 2,
        date: formData.date || '',
        time: formData.time || '',
        contact: formData.contact || '',
        status: 'confirmed'
        };

        dispatch({ type: 'ADD_RESERVATION', payload: reservation });
        
        const now = new Date();
        const isToday = formData.date === now.toISOString().split('T')[0];
        if (isToday) {
            dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: reservation.tableId, status: 'reserved' } });
        }
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={reservationToEdit ? "Edit Reservation" : "New Reservation"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded-lg p-2"
            value={formData.customerName || ''}
            onChange={e => setFormData({ ...formData, customerName: e.target.value })} 
          />
        </div>
         <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact (Optional)</label>
          <input 
            type="text" 
            className="w-full border rounded-lg p-2"
            value={formData.contact || ''}
            onChange={e => setFormData({ ...formData, contact: e.target.value })} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input 
              required 
              type="date" 
              className="w-full border rounded-lg p-2"
              value={formData.date || ''}
              onChange={e => setFormData({ ...formData, date: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
            <input 
              required 
              type="time" 
              className="w-full border rounded-lg p-2"
              value={formData.time || ''}
              onChange={e => setFormData({ ...formData, time: e.target.value })} 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guests</label>
            <input 
              required 
              type="number" 
              min="1"
              className="w-full border rounded-lg p-2"
              value={formData.guests || 2}
              onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Table</label>
             <select 
              required
              className="w-full border rounded-lg p-2"
              value={formData.tableId}
              onChange={e => setFormData({ ...formData, tableId: e.target.value })}
            >
              <option value="">Select Table</option>
              {state.tables.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.seats} seats) - {t.status}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- VIEWS ---

const LoginView = () => {
  const { dispatch } = useContext(StoreContext);
  
  const handleLogin = (role: Role, name: string) => {
    dispatch({ 
      type: 'LOGIN', 
      payload: { id: Date.now().toString(), name, role } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">OmniDine</h1>
          <p className="text-indigo-100">Restaurant Management System</p>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-slate-600 text-center mb-6">Select a demo role to continue:</p>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="secondary" onClick={() => handleLogin('admin', 'Alice Admin')} className="w-full justify-start text-lg h-14">
              <LayoutDashboard className="w-5 h-5 mr-3 text-indigo-600" /> Admin / Manager
            </Button>
            <Button variant="secondary" onClick={() => handleLogin('waiter', 'Bob Server')} className="w-full justify-start text-lg h-14">
              <UtensilsCrossed className="w-5 h-5 mr-3 text-emerald-600" /> Waiter (POS)
            </Button>
            <Button variant="secondary" onClick={() => handleLogin('chef', 'Charlie Chef')} className="w-full justify-start text-lg h-14">
              <ChefHat className="w-5 h-5 mr-3 text-orange-600" /> Kitchen (KDS)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager'] },
    { id: 'pos', icon: ShoppingBag, label: 'POS', roles: ['admin', 'manager', 'waiter'] },
    { id: 'kds', icon: ChefHat, label: 'Kitchen', roles: ['admin', 'manager', 'chef'] },
    { id: 'reservations', icon: Calendar, label: 'Reservations', roles: ['admin', 'manager', 'waiter'] },
    { id: 'tables', icon: Users, label: 'Tables', roles: ['admin', 'manager', 'waiter'] },
    { id: 'menu', icon: MenuIcon, label: 'Menu', roles: ['admin', 'manager'] }, // Admin only by convention in filtered list
    { id: 'inventory', icon: Package, label: 'Inventory', roles: ['admin', 'manager', 'chef'] },
    { id: 'history', icon: FileText, label: 'Order History', roles: ['admin', 'manager'] },
  ];

  return (
    <>
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">O</span>
            OmniDine
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.filter(item => item.roles.includes(state.user?.role || '')).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
              {state.user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{state.user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{state.user?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="fixed left-64 top-0 right-0 bottom-0 overflow-auto bg-slate-50 text-slate-900">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'pos' && <POSView />}
        {activeTab === 'kds' && <KDSView />}
        {activeTab === 'reservations' && <ReservationsView />}
        {activeTab === 'tables' && <TablesView />}
        {activeTab === 'menu' && <MenuManagementView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'history' && <OrderHistoryView />}
      </div>
    </>
  );
};

// --- SUB-VIEWS ---

const DashboardView = () => {
  const { state } = useContext(StoreContext);
  
  const todayOrders = state.orders.filter(o => new Date(o.createdAt).getDate() === new Date().getDate());
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const activeTables = state.tables.filter(t => t.status === 'occupied').length;

  const lowStockItems = state.inventory.filter(i => i.stock <= i.threshold);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of restaurant performance today.</p>
        </div>
        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="p-2 bg-white rounded-full text-red-600">
                  <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-red-900">Low Stock Alert</h3>
                  <p className="text-sm text-red-700 mt-1">
                      The following items are running low: {lowStockItems.map(i => i.name).join(', ')}. Please replenish inventory.
                  </p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">New</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Orders Today</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{todayOrders.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{state.tables.length} Total</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Active Tables</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{activeTables}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {state.orders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No orders yet. Go to POS to create one.</div>
          ) : (
            state.orders.slice(0, 5).map(order => (
              <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Order #{order.id}</p>
                    <p className="text-xs text-slate-500">Table {state.tables.find(t => t.id === order.tableId)?.name} • {order.items.length} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-slate-500 capitalize">{order.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const POSView = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES[0].id);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cart' | 'active'>('cart');
  
  // Modals state
  const [modifyingDish, setModifyingDish] = useState<Dish | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  
  // Cart Editing State
  const [editingCartItem, setEditingCartItem] = useState<OrderItem | null>(null);

  // When clicking a dish in the menu
  const initiateAddToCart = (dish: Dish) => {
    if (dish.modifiers && dish.modifiers.length > 0) {
      setModifyingDish(dish);
      setSelectedModifiers([]);
    } else {
      addToCart(dish, []);
    }
  };

  const toggleModifier = (modifier: Modifier) => {
    if (selectedModifiers.find(m => m.id === modifier.id)) {
      setSelectedModifiers(prev => prev.filter(m => m.id !== modifier.id));
    } else {
      setSelectedModifiers(prev => [...prev, modifier]);
    }
  };
  
  const toggleEditorModifier = (modifier: Modifier) => {
    if (!editingCartItem) return;
    const currentMods = editingCartItem.modifiers;
    const exists = currentMods.find(m => m.id === modifier.id);
    let newMods;
    if (exists) {
      newMods = currentMods.filter(m => m.id !== modifier.id);
    } else {
      newMods = [...currentMods, modifier];
    }
    const modifiersCost = newMods.reduce((sum, m) => sum + m.price, 0);
    const baseDish = state.dishes.find(d => d.id === editingCartItem.dishId);
    if (!baseDish) return;

    setEditingCartItem({
      ...editingCartItem,
      modifiers: newMods,
      price: baseDish.price + modifiersCost
    });
  };

  const confirmModifiers = () => {
    if (modifyingDish) {
      addToCart(modifyingDish, selectedModifiers);
      setModifyingDish(null);
      setSelectedModifiers([]);
    }
  };

  const addToCart = (dish: Dish, modifiers: Modifier[]) => {
    setCart(prev => {
      // Find item with same dishId AND same modifiers
      const existing = prev.find(i => i.dishId === dish.id && areModifiersEqual(i.modifiers, modifiers));
      
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i);
      }
      
      const modifiersCost = modifiers.reduce((sum, m) => sum + m.price, 0);
      return [...prev, { 
        id: Date.now().toString() + Math.random(), 
        dishId: dish.id, 
        name: dish.name, 
        price: dish.price + modifiersCost, 
        modifiers: modifiers,
        qty: 1, 
        status: 'pending' 
      }];
    });
    setViewMode('cart');
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };
  
  const updateEditorQty = (delta: number) => {
    if(!editingCartItem) return;
    setEditingCartItem({
      ...editingCartItem,
      qty: Math.max(1, editingCartItem.qty + delta)
    });
  };
  
  const saveCartItemChanges = () => {
    if (!editingCartItem) return;
    setCart(prev => prev.map(item => item.id === editingCartItem.id ? editingCartItem : item));
    setEditingCartItem(null);
  };
  
  const deleteCartItem = () => {
    if (!editingCartItem) return;
    setCart(prev => prev.filter(item => item.id !== editingCartItem.id));
    setEditingCartItem(null);
  }

  const handlePlaceOrderClick = () => {
    if (!selectedTable || cart.length === 0) return;
    setShowOrderConfirmation(true);
  };

  const finalizeOrder = () => {
    if (!selectedTable || cart.length === 0) return;
    
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const order: Order = {
      id: '', // Will be set in reducer
      tableId: selectedTable,
      serverName: state.user?.name || 'Unknown',
      items: cart,
      status: 'pending', // Starts as pending, moves to preparing when KDS picks it up
      total,
      createdAt: new Date()
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: selectedTable, status: 'occupied' } });
    
    // Reset
    setCart([]);
    setShowOrderConfirmation(false);
    setViewMode('active');
  };

  const filteredDishes = state.dishes.filter(d => 
    d.categoryId === selectedCategory && 
    d.available &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const editingBaseDish = editingCartItem ? state.dishes.find(d => d.id === editingCartItem.dishId) : null;
  
  // Active orders for selected table
  const activeOrders = selectedTable 
    ? state.orders.filter(o => o.tableId === selectedTable && o.status !== 'paid' && o.status !== 'completed')
    : [];

  return (
    <div className="flex h-screen pt-4"> 
      {/* Confirmation Modal */}
      <Modal 
        isOpen={showOrderConfirmation} 
        onClose={() => setShowOrderConfirmation(false)} 
        title="Confirm Order"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Please verify the order details before sending to the kitchen.</p>
          </div>
          
          <div className="border rounded-lg p-3 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.qty}x {item.name}</span>
                <span className="font-mono">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(cart.reduce((acc, item) => acc + (item.price * item.qty), 0))}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowOrderConfirmation(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={finalizeOrder} className="flex-1">
              Confirm & Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modifier Selection Modal */}
      <Modal
        isOpen={!!modifyingDish}
        onClose={() => setModifyingDish(null)}
        title={modifyingDish ? `Customize ${modifyingDish.name}` : ''}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Select options for this item:</p>
          <div className="space-y-2">
            {modifyingDish?.modifiers?.map(modifier => (
              <label key={modifier.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    checked={selectedModifiers.some(m => m.id === modifier.id)}
                    onChange={() => toggleModifier(modifier)}
                  />
                  <span className="text-slate-700">{modifier.name}</span>
                </div>
                {modifier.price > 0 && (
                  <span className="text-sm text-slate-500">+{formatCurrency(modifier.price)}</span>
                )}
              </label>
            ))}
          </div>
          <div className="pt-4 flex gap-3">
             <Button variant="ghost" onClick={() => setModifyingDish(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmModifiers} className="flex-1">
              Add to Order - {formatCurrency((modifyingDish?.price || 0) + selectedModifiers.reduce((s, m) => s + m.price, 0))}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cart Item Edit Modal */}
      <Modal 
        isOpen={!!editingCartItem} 
        onClose={() => setEditingCartItem(null)} 
        title="Edit Item"
      >
        {editingCartItem && editingBaseDish && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl">{editingCartItem.name}</h3>
              <div className="flex items-center gap-3">
                 <button onClick={() => updateEditorQty(-1)} className="p-2 rounded bg-slate-100 hover:bg-slate-200"><Minus className="w-4 h-4"/></button>
                 <span className="font-bold text-lg">{editingCartItem.qty}</span>
                 <button onClick={() => updateEditorQty(1)} className="p-2 rounded bg-slate-100 hover:bg-slate-200"><Plus className="w-4 h-4"/></button>
              </div>
            </div>

            {editingBaseDish.modifiers && editingBaseDish.modifiers.length > 0 && (
              <div className="space-y-2">
                 <p className="text-sm font-semibold text-slate-600">Modifiers</p>
                 {editingBaseDish.modifiers.map(modifier => (
                    <label key={modifier.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                         <input 
                            type="checkbox"
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            checked={editingCartItem.modifiers.some(m => m.id === modifier.id)}
                            onChange={() => toggleEditorModifier(modifier)}
                         />
                         <span>{modifier.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">+{formatCurrency(modifier.price)}</span>
                    </label>
                 ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="danger" onClick={deleteCartItem} className="flex-1">
                <Trash2 className="w-4 h-4" /> Remove
              </Button>
              <Button onClick={saveCartItemChanges} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Left Side: Menu */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-200">
        <div className="p-6 pb-2">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
            <input 
              type="text" 
              placeholder="Search dishes..." 
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {state.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDishes.map(dish => (
              <button
                key={dish.id}
                onClick={() => initiateAddToCart(dish)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex flex-col h-32 justify-between group"
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-2">{dish.name}</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-700">{formatCurrency(dish.price)}</span>
                  {dish.modifiers && dish.modifiers.length > 0 && (
                     <span className="block text-xs text-slate-400 mt-1">Customizable</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart / Active Orders */}
      <div className="w-96 bg-white shadow-xl flex flex-col h-full z-10 border-l border-slate-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Current Table</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {state.tables.map(table => {
                // Table visual status
                const isOccupied = table.status === 'occupied';
                const isReserved = table.status === 'reserved';
                const isSelected = selectedTable === table.id;
                
                let bgClass = 'bg-white text-slate-600 border-slate-200';
                if (isOccupied) bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
                if (isReserved) bgClass = 'bg-red-50 text-red-700 border-red-200';
                if (!isOccupied && !isReserved) bgClass = 'bg-green-50 text-green-700 border-green-200';
                
                if (isSelected) bgClass = 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400';

                return (
                  <button
                    key={table.id}
                    onClick={() => { 
                        setSelectedTable(table.id); 
                        // If occupied, switch to active view immediately to show orders
                        if (isOccupied) setViewMode('active');
                        else if (cart.length > 0) setViewMode('cart');
                        else setViewMode('cart');
                    }}
                    className={`p-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center justify-center h-16 ${bgClass}`}
                  >
                    <span>{table.name}</span>
                    <span className="text-[10px] opacity-80 uppercase mt-1">{table.status}</span>
                  </button>
                )
            })}
          </div>
          
          {selectedTable && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => setViewMode('cart')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'cart' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cart ({cart.length})
              </button>
              <button 
                 onClick={() => setViewMode('active')}
                 className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Active ({activeOrders.reduce((sum, o) => sum + o.items.length, 0)})
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!selectedTable ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Users className="w-12 h-12 opacity-20" />
              <p>Select a table to start</p>
            </div>
          ) : viewMode === 'cart' ? (
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingBag className="w-12 h-12 opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between group p-2 -mx-2 rounded-lg transition-colors hover:bg-slate-50"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => setEditingCartItem(item)}>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-slate-500">
                        + {item.modifiers.map(m => m.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
             activeOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Clock className="w-12 h-12 opacity-20" />
                  <p>No active orders</p>
                </div>
             ) : (
                <div className="space-y-6">
                  {activeOrders.map(order => (
                     <div key={order.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-500">Order #{order.id}</span>
                           <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
                        </div>
                        <div className="space-y-2">
                           {order.items.map(item => (
                              <div key={item.id} className="flex justify-between items-start text-sm">
                                 <div>
                                    <span className="font-medium text-slate-900">{item.qty}x {item.name}</span>
                                    {item.modifiers.length > 0 && (
                                       <p className="text-xs text-slate-500"> + {item.modifiers.map(m => m.name).join(', ')}</p>
                                    )}
                                 </div>
                                 <span className={`text-xs px-1.5 py-0.5 rounded border capitalize ${
                                    item.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200' :
                                    item.status === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                                 }`}>
                                    {item.status}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
                </div>
             )
          )}
        </div>

        {viewMode === 'cart' && (
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Total</span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(cart.reduce((acc, item) => acc + (item.price * item.qty), 0))}
              </span>
            </div>
            <Button 
              className="w-full py-3 text-lg" 
              disabled={!selectedTable || cart.length === 0}
              onClick={handlePlaceOrderClick}
            >
              Place Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const KDSView = () => {
  const { state, dispatch } = useContext(StoreContext);
  const activeOrders = state.orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Kitchen Display System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map(order => (
          <div key={order.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${
            order.status === 'ready' ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200'
          }`}>
            <div className={`p-4 border-b ${
              order.status === 'ready' ? 'bg-green-50' : 'bg-slate-50'
            } flex justify-between items-start`}>
              <div>
                <h3 className="font-bold text-slate-900">Order #{order.id}</h3>
                <p className="text-sm text-slate-500">Table {state.tables.find(t => t.id === order.tableId)?.name}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                order.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="p-4 flex-1 space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="font-bold text-slate-700">{item.qty}x</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-slate-500">
                          + {item.modifiers.map(m => m.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                        if (item.status === 'pending') {
                            dispatch({ type: 'UPDATE_ORDER_ITEM_STATUS', payload: { orderId: order.id, itemId: item.id, status: 'preparing' }});
                            dispatch({ type: 'CONSUME_INVENTORY', payload: { items: [item] } });
                        } else if (item.status === 'preparing') {
                             dispatch({ type: 'UPDATE_ORDER_ITEM_STATUS', payload: { orderId: order.id, itemId: item.id, status: 'ready' }});
                        }
                    }}
                    className={`text-xs px-2 py-1 rounded border capitalize transition-colors ${
                      item.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200 cursor-default' :
                      item.status === 'preparing' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                      'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {item.status}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {order.status !== 'ready' ? (
                <Button 
                  className="w-full" 
                  onClick={() => {
                      // Consume inventory for items jumping from pending -> ready
                      const itemsToConsume = order.items.filter(i => i.status === 'pending');
                      if (itemsToConsume.length > 0) {
                          dispatch({ type: 'CONSUME_INVENTORY', payload: { items: itemsToConsume } });
                      }

                      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: order.id, status: 'ready' } });
                      // Mark all items ready if not already
                      order.items.forEach(item => {
                          if (item.status !== 'ready' && item.status !== 'served') {
                              dispatch({ type: 'UPDATE_ORDER_ITEM_STATUS', payload: { orderId: order.id, itemId: item.id, status: 'ready' }});
                          }
                      });
                  }}
                >
                  Mark All Ready
                </Button>
              ) : (
                <Button 
                  variant="success"
                  className="w-full"
                  onClick={() => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: order.id, status: 'completed' } })}
                >
                  Complete Order
                </Button>
              )}
            </div>
          </div>
        ))}
        {activeOrders.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No active orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TablesView = () => {
  const { state, dispatch } = useContext(StoreContext);

  const updateTableStatus = (table: Table, status: Table['status']) => {
      dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId: table.id, status } });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Tables</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {state.tables.map(table => (
          <div 
            key={table.id}
            className={`rounded-2xl flex flex-col items-center justify-between p-6 border-2 relative group ${
              table.status === 'occupied' 
                ? 'bg-orange-50 border-orange-200 text-orange-700' 
                : table.status === 'reserved'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                table.status === 'occupied' ? 'bg-orange-100' : 
                table.status === 'reserved' ? 'bg-red-100' : 
                'bg-green-100'
                }`}>
                {table.status === 'reserved' ? <Clock className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold mb-1">{table.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                table.status !== 'available' ? 'bg-white/60' : 'bg-white/60'
                }`}>
                {table.status}
                </span>
                <p className="mt-2 text-xs opacity-70">{table.seats} Seats</p>
            </div>
            
            <div className="w-full mt-4 space-y-2">
                {table.status === 'available' && (
                    <button 
                        onClick={() => updateTableStatus(table, 'occupied')}
                        className="w-full py-2 text-sm font-semibold bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors"
                    >
                        Mark Occupied
                    </button>
                )}
                 {table.status === 'occupied' && (
                    <button 
                        onClick={() => updateTableStatus(table, 'available')}
                        className="w-full py-2 text-sm font-semibold bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                    >
                        Mark Available
                    </button>
                )}
                 {table.status === 'reserved' && (
                    <>
                        <button 
                            onClick={() => updateTableStatus(table, 'occupied')}
                            className="w-full py-2 text-sm font-semibold bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors"
                        >
                            Guest Arrived
                        </button>
                         <button 
                            onClick={() => updateTableStatus(table, 'available')}
                            className="w-full py-2 text-sm font-semibold bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        >
                            Cancel Reserve
                        </button>
                    </>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReservationsView = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | undefined>(undefined);

  const handleCancel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Cancel this reservation?')) {
        dispatch({ type: 'CANCEL_RESERVATION', payload: id });
    }
  }

  const handleEdit = (reservation: Reservation) => {
      setReservationToEdit(reservation);
      setIsModalOpen(true);
  }

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setReservationToEdit(undefined);
  }

  const sortedReservations = [...state.reservations].sort((a, b) => {
     return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AddReservationModal isOpen={isModalOpen} onClose={handleCloseModal} reservationToEdit={reservationToEdit} />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reservations</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Reservation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Date & Time</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Table</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Guests</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedReservations.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">No reservations found.</td>
                        </tr>
                    ) : (
                        sortedReservations.map(res => (
                        <tr key={res.id} className="hover:bg-slate-50">
                            <td className="p-4">
                                <p className="font-medium text-slate-900">{res.customerName}</p>
                                <p className="text-xs text-slate-500">{res.contact || 'No contact info'}</p>
                            </td>
                            <td className="p-4 text-slate-600">
                                <div className="flex flex-col">
                                    <span>{new Date(res.date).toLocaleDateString()}</span>
                                    <span className="text-xs font-bold text-indigo-600">{res.time}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-600">
                                {state.tables.find(t => t.id === res.tableId)?.name || 'Unknown Table'}
                            </td>
                            <td className="p-4 text-slate-600">{res.guests}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    res.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {res.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                {res.status === 'confirmed' && (
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => handleEdit(res)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => handleCancel(res.id, e)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        </div>

        <div>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <h3 className="font-bold text-lg mb-4 text-slate-900">Table Status</h3>
                <div className="space-y-3">
                    {state.tables.map(table => (
                        <div key={table.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="font-medium text-slate-700">{table.name} ({table.seats}p)</span>
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                table.status === 'available' ? 'bg-green-100 text-green-700' :
                                table.status === 'occupied' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {table.status}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

// Fix: Added MenuManagementView component
const MenuManagementView = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this dish?')) {
      dispatch({ type: 'DELETE_DISH', payload: id });
    }
  };

  const handleToggle = (id: string) => {
    dispatch({ type: 'TOGGLE_DISH_AVAILABILITY', payload: id });
  };

  const filteredDishes = state.dishes.filter(d => {
    const matchesCategory = selectedCategory === 'all' || d.categoryId === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(localSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AddDishModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingDish(undefined); }} 
        dishToEdit={editingDish}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Menu Management</h1>
            <p className="text-slate-500 mt-1">Manage dishes, prices, and availability.</p>
        </div>
        <div className="flex gap-3">
          <input 
              type="text" 
              placeholder="Search..." 
              className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Dish
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
        >
            All Items
        </button>
        {state.categories.map(cat => (
            <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
                {cat.name}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Dish Name</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Price</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDishes.length === 0 ? (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No dishes found.</td>
                </tr>
            ) : (
                filteredDishes.map(dish => (
                <tr key={dish.id} className="hover:bg-slate-50">
                    <td className="p-4">
                    <p className="font-medium text-slate-900">{dish.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{dish.description}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                    {state.categories.find(c => c.id === dish.categoryId)?.name}
                    </td>
                    <td className="p-4 font-mono text-slate-700">{formatCurrency(dish.price)}</td>
                    <td className="p-4">
                        <button 
                            onClick={() => handleToggle(dish.id)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                dish.available 
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            {dish.available ? <CheckCircle className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                            {dish.available ? 'Available' : 'Unavailable'}
                        </button>
                    </td>
                    <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(dish)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => handleDelete(dish.id, e)} 
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Fix: Added InventoryView component
const InventoryView = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStockUpdate = (itemId: string, newStock: number) => {
      if (newStock < 0) return;
      dispatch({ type: 'UPDATE_INVENTORY', payload: { itemId, newStock } });
  };

  const handleDelete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this item?")) {
        dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: itemId });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AddInventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
            <p className="text-slate-500 mt-1">Track stock levels and ingredients.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {state.inventory.map(item => {
            const isLow = item.stock <= item.threshold;
            return (
                <div key={item.id} className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${isLow ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-slate-900">{item.name}</h3>
                            <p className="text-xs text-slate-500">Threshold: {item.threshold} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLow && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-white border border-red-200 px-2 py-1 rounded-full shadow-sm">
                                    <AlertCircle className="w-3 h-3" /> Low
                                </span>
                            )}
                            <button 
                                type="button"
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between gap-4">
                         <div className="flex-1">
                             <label className="text-xs font-semibold text-slate-500 mb-1 block">Current Stock ({item.unit})</label>
                             <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleStockUpdate(item.id, item.stock - 1)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                                >
                                    <Minus className="w-4 h-4 text-slate-600" />
                                </button>
                                <input 
                                    type="number" 
                                    value={item.stock}
                                    onChange={(e) => handleStockUpdate(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-center font-bold text-lg border-b border-slate-200 focus:border-indigo-500 focus:outline-none bg-transparent"
                                />
                                <button 
                                    onClick={() => handleStockUpdate(item.id, item.stock + 1)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                                >
                                    <Plus className="w-4 h-4 text-slate-600" />
                                </button>
                             </div>
                         </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

const OrderHistoryView = () => {
    const { state } = useContext(StoreContext);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const sortedOrders = [...state.orders].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    }).filter(o => filterStatus === 'all' || o.status === filterStatus);

    const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
                    <p className="text-slate-500 mt-1">Review past orders and sales data.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                        <option value="ready">Ready</option>
                        <option value="preparing">Preparing</option>
                        <option value="pending">Pending</option>
                    </select>
                    <button 
                        onClick={toggleSort}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Date & Time</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Table</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">No orders found matching your filters.</td>
                            </tr>
                        ) : (
                            sortedOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono font-medium text-slate-900">#{order.id}</td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex flex-col">
                                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {state.tables.find(t => t.id === order.tableId)?.name || 'Unknown'}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex flex-col gap-1">
                                            {order.items.map((item, idx) => (
                                                <span key={idx} className="text-xs">
                                                    {item.qty}x {item.name}
                                                </span>
                                            ))}
                                            {order.items.length > 3 && <span className="text-xs text-slate-400">...</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-900">{formatCurrency(order.total)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            order.status === 'completed' || order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {state.user ? <Sidebar /> : <LoginView />}
    </StoreContext.Provider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);