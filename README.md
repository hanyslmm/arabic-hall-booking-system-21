
# Science Club Hall Booking System

A comprehensive hall booking management system built with React, TypeScript, and Supabase for the Science Club.

## Features

- 🏢 Hall Management & Booking System
- 👥 User Authentication & Role-based Access Control
- 📅 Schedule Management with Weekly View (Gregorian Calendar)
- 👨‍🏫 Teacher Management
- 📊 Dashboard with Statistics
- 🌍 Arabic RTL Support with Gregorian Calendar (ميلادي)
- 📱 Responsive Design

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **UI**: Tailwind CSS, Shadcn/UI
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking form and related components
│   ├── dashboard/      # Dashboard stats and hall grid
│   ├── hall/          # Hall schedule modal
│   ├── layout/        # Navigation and layout components
│   ├── teacher/       # Teacher management components
│   └── ui/            # Reusable UI components (shadcn/ui)
├── hooks/             # Custom React hooks
├── integrations/      # Supabase client and types
├── pages/            # Main page components
└── lib/              # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd science-club-booking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# The Supabase configuration is already included in the client
# No additional environment variables needed
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Setup

The application uses Supabase with the following main tables:
- `profiles` - User profiles with role management
- `halls` - Hall information
- `teachers` - Teacher records
- `academic_stages` - Academic stage definitions
- `bookings` - Booking records with conflict detection

Row Level Security (RLS) is enabled for data protection.

## User Roles

- **Owner**: Full system access
- **Manager**: Can manage bookings, teachers, and stages
- **Space Manager**: Basic access (default for new users)

## Deployment

### Deploying to Render

1. **Create a Render Account**: Sign up at [render.com](https://render.com)

2. **Connect Repository**: 
   - Go to your Render dashboard
   - Click "New +" and select "Static Site"
   - Connect your GitHub repository

3. **Configure Build Settings**:
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```

4. **Environment Variables**:
   - No additional environment variables needed (Supabase config is included)

5. **Deploy**:
   - Click "Create Static Site"
   - Render will automatically build and deploy your application
   - You'll get a URL like `https://your-app-name.onrender.com`

6. **Custom Domain** (Optional):
   - In your Render dashboard, go to Settings
   - Add your custom domain under "Custom Domains"
   - Update your DNS settings as instructed

### Deploying to Amazon EC2

#### Prerequisites
- AWS Account
- Basic knowledge of Linux/Ubuntu
- Domain name (optional)

#### Step 1: Launch EC2 Instance

1. **Login to AWS Console** and navigate to EC2
2. **Launch Instance**:
   - Choose Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier eligible)
   - Create new key pair or use existing
   - Security Group: Allow HTTP (80), HTTPS (443), and SSH (22)
3. **Launch the instance**

#### Step 2: Connect to Your Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

#### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

#### Step 4: Clone and Build Your Application

```bash
# Clone your repository
git clone <your-repository-url>
cd science-club-booking

# Install dependencies
npm install

# Build the application
npm run build
```

#### Step 5: Set Up Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/science-club
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    root /home/ubuntu/science-club-booking/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/science-club /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: Set Up SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo systemctl status certbot.timer
```

#### Step 7: Set Up Automatic Deployment (Optional)

Create a deployment script:

```bash
nano deploy.sh
```

Add:

```bash
#!/bin/bash
cd /home/ubuntu/science-club-booking
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
echo "Deployment completed at $(date)"
```

Make it executable:

```bash
chmod +x deploy.sh
```

#### Step 8: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

#### Step 9: Final Steps

1. **Point your domain** to your EC2 instance's public IP
2. **Test your application** by visiting your domain
3. **Set up monitoring** (optional):

```bash
# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log

# Monitor system resources
htop
```

#### Troubleshooting

**Common Issues:**

1. **Permission Issues:**
   ```bash
   sudo chown -R ubuntu:ubuntu /home/ubuntu/science-club-booking
   ```

2. **Nginx Not Starting:**
   ```bash
   sudo systemctl status nginx
   sudo journalctl -u nginx
   ```

3. **Build Failures:**
   ```bash
   # Check Node.js version
   node --version
   # Should be 18+
   ```

4. **Domain Not Resolving:**
   - Check DNS settings
   - Wait for DNS propagation (up to 48 hours)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions, please contact the development team.

## License

This project is licensed under the MIT License.
