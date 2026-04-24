# ============================================================
#  app.py  —  Saveur Food Website Backend
#  Stack : Flask + Flask-Login + SQLAlchemy (SQLite)
#  Run   : python app.py
# ============================================================

from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy 
from flask_login import (
    LoginManager, UserMixin,
    login_user, logout_user,
    login_required, current_user
)
from flask_cors import CORS
CORS(app)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
# ─── APP SETUP ──────────────────────────────────────────────
app = Flask(__name__)
app.config['SECRET_KEY'] = 'saveur-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///saveur.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Allow requests from your HTML front-end (opened via file:// or localhost)
CORS(app, supports_credentials=True, origins=['http://localhost:5500', 'http://127.0.0.1:5500', 'null'])

db = SQLAlchemy(app)
login_manager = LoginManager(app)


# ─── MODELS ─────────────────────────────────────────────────
class User(UserMixin, db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    password   = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M')
        }


class Order(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    items      = db.Column(db.Text,    nullable=False)   # JSON string
    total      = db.Column(db.Float,   nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id':         self.id,
            'items':      json.loads(self.items),
            'total':      self.total,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M')
        }


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─── HELPERS ────────────────────────────────────────────────
def success(data=None, message='OK', status=200):
    return jsonify({'success': True,  'message': message, 'data': data}), status

def error(message='Error', status=400):
    return jsonify({'success': False, 'message': message, 'data': None}), status


# ─── AUTH ROUTES ────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user."""
    body = request.get_json()
    name     = (body.get('name')     or '').strip()
    email    = (body.get('email')    or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not name or not email or not password:
        return error('Name, email and password are required.')

    if len(password) < 6:
        return error('Password must be at least 6 characters.')

    if User.query.filter_by(email=email).first():
        return error('An account with that email already exists.')

    hashed = generate_password_hash(password)
    user   = User(name=name, email=email, password=hashed)
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    return success(user.to_dict(), 'Account created successfully!', 201)


@app.route('/api/login', methods=['POST'])
def login():
    """Log in an existing user."""
    body     = request.get_json()
    email    = (body.get('email')    or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not email or not password:
        return error('Email and password are required.')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return error('Invalid email or password.')

    login_user(user, remember=True)
    return success(user.to_dict(), f'Welcome back, {user.name}!')


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Log out the current user."""
    name = current_user.name
    logout_user()
    return success(message=f'Goodbye, {name}!')


@app.route('/api/user', methods=['GET'])
def get_current_user():
    """Return the currently logged-in user (or null)."""
    if current_user.is_authenticated:
        return success(current_user.to_dict())
    return success(None, 'Not logged in.')


# ─── ORDER ROUTES ────────────────────────────────────────────

@app.route('/api/orders', methods=['POST'])
@login_required
def place_order():
    """Save a completed order for the logged-in user."""
    import json
    body  = request.get_json()
    items = body.get('items', [])
    total = body.get('total', 0)

    if not items:
        return error('No items in order.')

    order = Order(
        user_id=current_user.id,
        items=json.dumps(items),
        total=total
    )
    db.session.add(order)
    db.session.commit()
    return success(order.to_dict(), 'Order placed!', 201)


@app.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    """Get order history for the logged-in user."""
    orders = Order.query.filter_by(user_id=current_user.id)\
                        .order_by(Order.created_at.desc()).all()
    return success([o.to_dict() for o in orders])

@app.route("/")
def home():
    return "Food Delivery Backend is Running 🚀"


# ─── MENU ROUTE (static data — swap for DB later) ────────────

MENU_ITEMS = [
    {'id': 1, 'name': 'Truffle Bruschetta',     'category': 'starter',  'price': 12, 'desc': 'Toasted sourdough with whipped ricotta and black truffle.'},
    {'id': 2, 'name': 'French Onion Soup',      'category': 'starter',  'price': 10, 'desc': 'Slow-caramelised onion broth with Gruyère croutons.'},
    {'id': 3, 'name': 'Saffron Tagliatelle',    'category': 'main',     'price': 24, 'desc': 'Hand-rolled pasta with saffron cream and wild mushrooms.'},
    {'id': 4, 'name': 'Pan-Seared Salmon',      'category': 'main',     'price': 28, 'desc': 'Atlantic salmon with lemon beurre blanc and capers.'},
    {'id': 5, 'name': 'Crème Brûlée',           'category': 'dessert',  'price':  9, 'desc': 'Classic vanilla custard with a torched caramel crust.'},
    {'id': 6, 'name': 'Dark Chocolate Fondant', 'category': 'dessert',  'price': 11, 'desc': 'Warm dark chocolate cake with vanilla ice cream.'},
]

@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Return all menu items (optionally filter by category)."""
    category = request.args.get('category')
    items = MENU_ITEMS if not category else [m for m in MENU_ITEMS if m['category'] == category]
    return success(items)


# ─── RUN ────────────────────────────────────────────────────
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)