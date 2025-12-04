# Simple Shop Frontend

A clean, modern frontend for the Simple Shop microservices application.

## Features

✨ **Authentication**
- User registration and login
- JWT token management
- Role-based access (Buyer/Seller)

🛍️ **Product Management**
- Browse products
- Add products (Sellers only)
- Purchase products

📦 **Order Management**
- View order history
- Track order status
- Real-time updates

📍 **Address Management**
- Save multiple addresses
- Edit and delete addresses
- Quick address selection

## Tech Stack

- **Pure HTML/CSS/JavaScript** - No frameworks, lightweight and fast
- **Modern CSS** - Gradients, animations, responsive design
- **Fetch API** - RESTful API integration
- **LocalStorage** - Client-side state management

## Getting Started

### Option 1: Simple HTTP Server (Python)

```bash
cd fe
python3 -m http.server 8080
```

Then open: http://localhost:8080

### Option 2: Node.js HTTP Server

```bash
cd fe
npx http-server -p 8080
```

Then open: http://localhost:8080

### Option 3: Nginx (Production)

Add to your Nginx configuration:

```nginx
location / {
    root /path/to/simple-ms/fe;
    try_files $uri $uri/ /index.html;
}
```

## Configuration

The API base URL is configured in `app.js`:

```javascript
const API_BASE = 'http://localhost';
```

For production, update this to your API gateway URL.

## Usage

### 1. Register/Login
- Click "Register" tab to create a new account
- Choose role: Buyer or Seller
- Login with your credentials

### 2. Browse Products
- View all available products
- See stock levels and prices
- Purchase products (logged in users)

### 3. Manage Orders
- View your order history
- Track order status
- See order details

### 4. Manage Addresses
- Add delivery addresses
- Delete old addresses
- Quick address management

## Features

### Modern Design
- Gradient backgrounds
- Smooth animations
- Card-based layouts
- Responsive design

### User Experience
- Toast notifications
- Loading states
- Error handling
- Form validation

### Security
- JWT token authentication
- Secure API calls
- Auto-logout on token expiry
- Protected routes

## API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /products` - List products
- `POST /product` - Add product (Seller)
- `POST /order` - Create order
- `GET /orders` - List user orders
- `GET /users/addresses` - List addresses
- `POST /users/addresses` - Add address
- `DELETE /users/addresses/{id}` - Delete address

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Screenshots

### Login Page
Clean authentication with tabs for login/register

### Products Page
Grid layout with product cards and purchase buttons

### Orders Page
Order history with status badges

### Addresses Page
Saved addresses with quick actions

## Development

### File Structure
```
fe/
├── index.html      # Main HTML structure
├── styles.css      # All styles and animations
├── app.js          # Application logic and API calls
└── README.md       # This file
```

### Customization

**Colors**: Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --success: #10b981;
    --danger: #ef4444;
}
```

**API URL**: Edit in `app.js`:
```javascript
const API_BASE = 'http://your-api-url';
```

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure your backend has CORS enabled:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Failed
- Check if backend services are running
- Verify API_BASE URL is correct
- Check browser console for errors

### Authentication Issues
- Clear localStorage and try again
- Check if JWT tokens are valid
- Verify backend auth service is running

## License

MIT
