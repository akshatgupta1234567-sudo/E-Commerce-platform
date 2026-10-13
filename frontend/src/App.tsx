import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, apiRequest, assetUrl, formatPrice, type Order, type Product, type User } from "./api";
import { useStore } from "./useStore";

function Header() {
  const { cart, user, signOut } = useStore();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <>
    <div className="announcement">Built for the job. Delivered to your door. <span>Free shipping over ₹5,000</span></div>
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Iron and Steel home">
        <span className="brand-mark">I<span>/</span>S</span>
        <span className="brand-name">IRON<span>&</span>STEEL<small>TRADE SUPPLY CO.</small></span>
      </Link>
      <nav className="main-nav">
        <NavLink to="/">Shop</NavLink>
        <NavLink to="/account">Orders</NavLink>
        {user?.role === "admin" && <NavLink to="/admin">Manage</NavLink>}
      </nav>
      <div className="header-actions">
        {user ? <><span className="welcome-user">Hi, {user.name.split(" ")[0]}</span><button className="text-button" onClick={signOut}>Sign out</button></>
          : <Link className="header-account" to="/login">Sign in</Link>}
        <Link className="cart-link" to="/cart">Bag <span>{String(count).padStart(2, "0")}</span></Link>
      </div>
    </header>
  </>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-top">
      <Link className="brand footer-brand" to="/"><span className="brand-mark">I<span>/</span>S</span><span className="brand-name">IRON<span>&</span>STEEL<small>TRADE SUPPLY CO.</small></span></Link>
      <p>Good gear. Honest service.<br />Ready for whatever the job brings.</p>
      <a href="mailto:support@ironandsteel.example">Get in touch <span>↗</span></a>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Iron & Steel Trade Supply Co.</span><span>Made for the makers.</span></div>
  </footer>;
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);
  return <article className="product-card">
    <Link className="product-image" to={`/products/${product._id}`}>
      {product.imageurls ? <img src={assetUrl(product.imageurls)} alt={product.name} /> : <span className="image-placeholder">I<span>/</span>S</span>}
      <span className="product-category">{product.category}</span>
    </Link>
    <div className="product-info">
      <div><Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link><p>{product.stock ? "Ready to ship" : "Currently unavailable"}</p></div>
      <div className="product-buy"><strong>{formatPrice(product.price)}</strong>
        <button className="add-button" disabled={!product.stock} onClick={() => {
          addToCart(product); setAdded(true); window.setTimeout(() => setAdded(false), 1300);
        }}>{!product.stock ? "Sold out" : added ? "Added ✓" : "Add +"}</button>
      </div>
    </div>
  </article>;
}

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All gear");
  useEffect(() => {
    apiRequest<Product[]>("/products").then(setProducts).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  const categories = useMemo(() => ["All gear", ...new Set(products.map((product) => product.category))], [products]);
  const visible = products.filter((product) => (category === "All gear" || product.category === category)
    && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="catalog" id="shop">
    <div className="section-heading"><div><p className="eyebrow">THE ESSENTIALS</p><h2>Tools for the long haul.</h2></div>
      <label className="search-box"><span>⌕</span><input aria-label="Search products" placeholder="Search the catalog" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    </div>
    <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {loading ? <div className="catalog-message">Loading the catalog…</div>
      : error ? <div className="catalog-message error-message"><strong>Catalog unavailable</strong><p>{error}. Start the backend and check your API URL.</p></div>
        : visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard key={product._id} product={product} />)}</div>
          : <div className="catalog-message">{products.length ? "No products match this search." : "The catalog is being stocked. Check back soon."}</div>}
  </section>;
}

function Home() {
  return <>
    <section className="hero">
      <div className="hero-content"><p className="eyebrow light">SUPPLY THAT SHOWS UP</p><h1>Built to work.<br /><span>Made to last.</span></h1>
        <p className="hero-copy">Hard-wearing tools and materials for people who make things happen. Straightforward gear, no-nonsense service.</p>
        <Link className="button button-light" to="/#shop">Shop the collection <span>↘</span></Link>
        <div className="hero-note"><span className="note-dot" /> EQUIPPING THE PEOPLE WHO BUILD</div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-art-grid" /><div className="hero-stamp">EST.<br /><strong>1987</strong></div><div className="hero-metal">I<span>/</span>S</div><div className="hero-art-caption">DEPENDABLE BY DESIGN<br />01 — 04</div></div>
      <div className="hero-index">01 / THE WORKSHOP</div>
    </section>
    <div className="value-strip"><div><span>01</span><strong>TRADE-READY QUALITY</strong><small>Tested for real work</small></div><div><span>02</span><strong>FAIR, CLEAR PRICING</strong><small>No surprises at checkout</small></div><div><span>03</span><strong>HERE WHEN YOU NEED US</strong><small>People who know the trade</small></div></div>
    <Catalog />
    <section className="closing-banner"><div><p className="eyebrow light">THE RIGHT TOOL CHANGES EVERYTHING</p><h2>Make good work<br />of it.</h2></div><Link className="button button-outline" to="/#shop">Find your next tool <span>↗</span></Link></section>
  </>;
}

function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addToCart } = useStore();
  useEffect(() => { apiRequest<Product>(`/products/${id}`).then(setProduct).catch((e: Error) => setError(e.message)); }, [id]);
  if (error) return <div className="page-wrap"><p className="form-error">{error}</p><Link to="/">← Back to shop</Link></div>;
  if (!product) return <div className="page-wrap"><p className="catalog-message">Loading product…</p></div>;
  return <div className="page-wrap"><Link className="back-link" to="/">← All products</Link>
    <div className="product-detail"><div className="detail-image">{product.imageurls ? <img src={assetUrl(product.imageurls)} alt={product.name} /> : <span className="image-placeholder">I<span>/</span>S</span>}</div>
      <div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{formatPrice(product.price)}</p><p className="detail-description">{product.description}</p>
        <p className="stock-note">{product.stock > 0 ? `${product.stock} available · Ready to ship` : "Out of stock"}</p>
        <button className="button button-dark detail-add" disabled={!product.stock} onClick={() => { addToCart(product); setAdded(true); }}>{added ? "Added to bag ✓" : "Add to bag"}</button>
        <div className="detail-perks"><p>✓ Secure checkout</p><p>✓ Trade-tested quality</p><p>✓ Support from real people</p></div>
      </div>
    </div>
  </div>;
}

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }
function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
  });
}

function Cart() {
  const { cart, setQuantity, clearCart, user } = useStore();
  const [address, setAddress] = useState({ fullName: "", street: "", city: "", postalCode: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (!user) { navigate("/login?next=/cart"); return; }
    setBusy(true); setError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Could not load secure checkout. Please try again.");
      const order = await apiRequest<{ id: string; amount: number; currency: string }>("/payment/order", {
        method: "POST", body: JSON.stringify({ items: cart.map(({ product, quantity }) => ({ product: product._id, quantity })) }),
      }, user.token);
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) throw new Error("Payment setup is incomplete. Add the public Razorpay key to frontend/.env.");
      new window.Razorpay({
        key, amount: order.amount, currency: order.currency, name: "Iron & Steel", description: "Trade supply order",
        order_id: order.id, prefill: { name: address.fullName, email: user.email }, theme: { color: "#b55936" },
        handler: async (response: Record<string, string>) => {
          try {
            await apiRequest<Order>("/orders", { method: "POST", body: JSON.stringify({
              items: cart.map(({ product, quantity }) => ({ product: product._id, quantity })),
              address, ...response,
            }) }, user.token);
            clearCart(); navigate("/account?order=success");
          } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not confirm the order."); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Checkout could not be started."); setBusy(false); }
  }
  return <div className="page-wrap cart-page"><div className="page-title"><p className="eyebrow">YOUR SELECTION</p><h1>The bag.</h1></div>
    {!cart.length ? <div className="empty-state"><span className="empty-mark">I/S</span><h2>Nothing in the bag yet.</h2><p>Good work starts with the right gear.</p><Link className="button button-dark" to="/">Browse the collection</Link></div>
      : <div className="checkout-layout"><div className="cart-items">{cart.map(({ product, quantity }) => <article className="cart-item" key={product._id}>
        <Link className="cart-thumb" to={`/products/${product._id}`}>{product.imageurls ? <img src={assetUrl(product.imageurls)} alt="" /> : <span className="image-placeholder">I<span>/</span>S</span>}</Link>
        <div className="cart-item-info"><p className="eyebrow">{product.category}</p><Link to={`/products/${product._id}`}><h2>{product.name}</h2></Link><p>{formatPrice(product.price)} each</p>
          <div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(product._id, quantity - 1)}>−</button><span>{quantity}</span><button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity(product._id, quantity + 1)}>+</button><button className="remove-button" onClick={() => setQuantity(product._id, 0)}>Remove</button></div>
        </div><strong className="line-total">{formatPrice(product.price * quantity)}</strong>
      </article>)}</div>
        <aside className="checkout-card"><p className="eyebrow">DELIVERY DETAILS</p><h2>Where should we send it?</h2>
          <form onSubmit={checkout}>
            {([["fullName", "Full name"], ["street", "Street address"], ["city", "City"], ["postalCode", "Postal code"]] as const).map(([key, label]) => <label key={key}>{label}<input required value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} /></label>)}
            <div className="summary-line"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div><div className="summary-line"><span>Shipping</span><span>{total >= 5000 ? "On us" : "Calculated at checkout"}</span></div>
            <p className="checkout-help">Final amount is confirmed securely by the store before payment.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-dark checkout-button" disabled={busy}>{busy ? "Preparing secure checkout…" : user ? "Continue to payment" : "Sign in to checkout"}</button>
            <p className="secure-note">Payments secured by Razorpay · UPI, cards & more</p>
          </form>
        </aside></div>}
  </div>;
}

function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState(""); const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState(false); const [notice, setNotice] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const { signIn } = useStore(); const navigate = useNavigate(); const [search] = useSearchParams();
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "register") {
        const result = await apiRequest<{ email: string; message: string }>("/auth/register", {
          method: "POST", body: JSON.stringify({ name, email, password }),
        });
        setVerificationEmail(result.email);
        setVerificationStep(true);
        setNotice(result.message);
        return;
      }
      const user = await apiRequest<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      signIn(user); navigate(search.get("next") || "/account");
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(email.trim().toLowerCase());
        setVerificationStep(true);
        setNotice("Verify your email to finish signing in.");
      } else setError(reason instanceof Error ? reason.message : "Please try again.");
    }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiRequest<{ user: User }>("/auth/verify-email", {
        method: "POST", body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });
      signIn(result.user);
      navigate(search.get("next") || "/account");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not verify email."); }
    finally { setBusy(false); }
  }
  async function resendCode() {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiRequest<{ message: string }>("/auth/resend-verification", {
        method: "POST", body: JSON.stringify({ email: verificationEmail }),
      });
      setNotice(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not resend verification code."); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-card">
    <p className="eyebrow">YOUR TRADE ACCOUNT</p>
    <h1>{verificationStep ? "Check your inbox." : mode === "login" ? "Good to have you back." : "Let’s get to work."}</h1>
    <p className="auth-intro">{verificationStep ? `Enter the six-digit code sent to ${verificationEmail}. It expires after 10 minutes.` : mode === "login" ? "Sign in to track orders and get back to the good stuff." : "Create an account to keep your orders and details in one place."}</p>
    {!verificationStep && <div className="auth-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button></div>}
    {verificationStep ? <form onSubmit={verify}>
      <label>Email address<input type="email" required value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)} autoComplete="email" /></label>
      <label>Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" /></label>
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark auth-submit" disabled={busy || verificationCode.length !== 6}>{busy ? "Verifying…" : "Verify email"}</button>
      <button className="resend-button" type="button" disabled={busy} onClick={resendCode}>Resend verification code</button>
      <button className="resend-button" type="button" onClick={() => { setVerificationStep(false); setError(""); setNotice(""); }}>Back to sign in</button>
    </form> : <form onSubmit={submit}>
      {mode === "register" && <label>Your name<input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
      <label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>Password<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
    </form>}
    <p className="auth-terms">By continuing, you agree to our store terms and privacy policy.</p><Link className="back-link" to="/">← Back to the shop</Link>
  </div></div>;
}

function Account() {
  const { user } = useStore(); const [orders, setOrders] = useState<Order[]>([]); const [error, setError] = useState("");
  useEffect(() => { if (user) apiRequest<Order[]>("/orders/myorders", {}, user.token).then(setOrders).catch((e: Error) => setError(e.message)); }, [user]);
  if (!user) return <div className="page-wrap"><div className="empty-state"><h1>Sign in to see your orders.</h1><Link className="button button-dark" to="/login?next=/account">Sign in</Link></div></div>;
  return <div className="page-wrap account-page"><div className="page-title"><p className="eyebrow">YOUR ACCOUNT</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Your recent orders, all in one place.</p></div>
    {error && <p className="form-error">{error}</p>}
    {!orders.length && !error ? <div className="empty-state"><h2>No orders yet.</h2><p>Your next piece of dependable gear is waiting.</p><Link className="button button-dark" to="/">Browse products</Link></div>
      : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order._id}><div className="order-meta"><span>ORDER {order._id.slice(-8).toUpperCase()}</span><span className={`status-badge status-${order.status}`}>{order.status}</span></div>
        <div className="order-details"><span>{order.items.length} product line{order.items.length === 1 ? "" : "s"}</span><strong>{formatPrice(order.totalAmount)}</strong></div>
        <p className="order-date">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : ""}</p>
      </article>)}</div>}
  </div>;
}

const initialProduct = { name: "", description: "", price: "", category: "", stock: "" };
function Admin() {
  const { user } = useStore(); const [products, setProducts] = useState<Product[]>([]); const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(initialProduct); const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function refresh() {
    if (!user) return;
    const [nextProducts, nextOrders] = await Promise.all([apiRequest<Product[]>("/products"), apiRequest<Order[]>("/orders", {}, user.token)]);
    setProducts(nextProducts); setOrders(nextOrders);
  }
  useEffect(() => {
    if (user?.role !== "admin") return;
    let current = true;
    Promise.all([
      apiRequest<Product[]>("/products"),
      apiRequest<Order[]>("/orders", {}, user.token),
    ]).then(([nextProducts, nextOrders]) => {
      if (current) {
        setProducts(nextProducts);
        setOrders(nextOrders);
      }
    }).catch((reason: Error) => {
      if (current) setError(reason.message);
    });
    return () => { current = false; };
  }, [user]);
  async function createProduct(event: FormEvent) {
    event.preventDefault(); if (!user) return; setBusy(true); setError(""); setNotice("");
    try {
      const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.set(key, value)); if (image) body.set("image", image);
      await apiRequest<Product>("/products", { method: "POST", body }, user.token);
      setForm(initialProduct); setImage(null); setNotice("Product added to the catalog."); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create product."); }
    finally { setBusy(false); }
  }
  async function updateStatus(id: string, status: string) {
    if (!user) return;
    try { await apiRequest(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }, user.token); setOrders((current) => current.map((o) => o._id === id ? { ...o, status } : o)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update order."); }
  }
  async function deleteProduct(id: string) {
    if (!user || !window.confirm("Remove this product from the catalog?")) return;
    try { await apiRequest(`/products/${id}`, { method: "DELETE" }, user.token); setProducts((current) => current.filter((p) => p._id !== id)); setNotice("Product removed."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove product."); }
  }
  if (user?.role !== "admin") return <div className="page-wrap"><div className="empty-state"><p className="eyebrow">RESTRICTED AREA</p><h1>Admin access required.</h1><p>Sign in with an admin account to manage the shop.</p><Link className="button button-dark" to="/login?next=/admin">Sign in</Link></div></div>;
  return <div className="page-wrap admin-page"><div className="page-title"><p className="eyebrow">STORE OPERATIONS</p><h1>Manage the shop.</h1><p>Keep the shelves stocked and orders moving.</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">INVENTORY</p><h2>Add a product</h2></div><span>{products.length} items</span></div>
      <form className="admin-product-form" onSubmit={createProduct}>
        <label>Product name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Category<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tools, Materials…" /></label>
        <label>Price (₹)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label>Stock<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
        <label className="wide-field">Description<textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label className="wide-field">Product image<input required type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          if (selected && selected.size > 5 * 1024 * 1024) {
            setImage(null); setError("Product images must be 5 MB or smaller."); e.target.value = "";
          } else {
            setError(""); setImage(selected);
          }
        }} /><span className="field-hint">PNG, JPEG, WebP or GIF · up to 5 MB. Uploads use Cloudinary when configured, otherwise local development storage.</span></label>
        <button className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Add product"}</button>
      </form>
      <div className="admin-products">{products.map((product) => <div className="admin-product-row" key={product._id}><div><strong>{product.name}</strong><span>{product.category} · {product.stock} in stock</span></div><strong>{formatPrice(product.price)}</strong><button className="remove-button" onClick={() => deleteProduct(product._id)}>Remove</button></div>)}</div>
    </section>
    <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">FULFILMENT</p><h2>Recent orders</h2></div><span>{orders.length} orders</span></div>
      {!orders.length ? <p className="catalog-message">No orders to fulfil yet.</p> : <div className="admin-orders">{orders.map((order) => <div className="admin-order-row" key={order._id}><div><strong>#{order._id.slice(-8).toUpperCase()}</strong><span>{order.items.length} line items · {formatPrice(order.totalAmount)}</span></div>
        <select aria-label={`Update order ${order._id} status`} value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}>{["pending", "shipped", "delivered", "cancelled"].map((status) => <option key={status}>{status}</option>)}</select>
      </div>)}</div>}
    </section>
  </div>;
}

export default function App() {
  return <><Header /><main><Routes><Route path="/" element={<Home />} /><Route path="/products/:id" element={<ProductPage />} /><Route path="/cart" element={<Cart />} /><Route path="/login" element={<Login />} /><Route path="/account" element={<Account />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<div className="page-wrap empty-state"><h1>That page isn't on the shelf.</h1><Link className="button button-dark" to="/">Back to the shop</Link></div>} /></Routes></main><Footer /></>;
}
