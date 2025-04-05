#!/bin/bash

# Calming Space HTTPS Setup Script
# This script sets up HTTPS for calmingspace.duckdns.org using Let's Encrypt

# Exit on error
set -e

# Set domain
DOMAIN="calmingspace.duckdns.org"
EMAIL="emm10042@nyu.edu"  
APP_PORT=2113  

echo "=== Setting up HTTPS for $DOMAIN ==="

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root or with sudo"
    exit 1
fi

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Ensure Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get install -y nginx
fi

# Create Nginx configuration for the domain
echo "Creating Nginx configuration for $DOMAIN..."
cat > /etc/nginx/sites-available/calmingspace << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
if [ ! -f /etc/nginx/sites-enabled/calmingspace ]; then
    ln -s /etc/nginx/sites-available/calmingspace /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Obtain SSL certificate for the domain
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# Check if certificate was installed successfully
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "SSL certificate installed successfully!"
else
    echo "Failed to install SSL certificate. Check the certbot logs."
    exit 1
fi

# Update the passport-config.mjs file to use HTTPS for callback URL
# This assumes your app directory is /root/calming_space
# Adjust this path if your application is located elsewhere
if [ -f "/root/calming_space/src/config/passport-config.mjs" ]; then
    echo "Updating Spotify callback URL to use HTTPS..."
    sed -i "s|http://$DOMAIN:$APP_PORT/auth/spotify/callback|https://$DOMAIN/auth/spotify/callback|g" /root/calming_space/src/config/passport-config.mjs
    
    # Restart the application to apply changes
    echo "Restarting the application..."
    cd /root/calming_space
    pm2 restart calming-space
    
    echo "Remember to update your Spotify Developer Dashboard with the new callback URL:"
    echo "https://$DOMAIN/auth/spotify/callback"
else
    echo "Warning: Could not find passport-config.mjs file to update. You'll need to manually update the callback URL."
fi

# Add cron job for auto-renewal if not already added
if ! crontab -l | grep -q 'certbot renew'; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | crontab -
    echo "Added automatic renewal cron job"
fi

# DuckDNS specific instructions
echo ""
echo "=== DuckDNS Configuration Notes ==="
echo "For DuckDNS domains, make sure to keep your IP address updated."
echo "Consider setting up a cron job to update your DuckDNS IP regularly:"
echo ""
echo "# Example cron job (run as root):"
echo "*/5 * * * * curl \"https://www.duckdns.org/update?domains=calmingspace&token=YOUR_DUCKDNS_TOKEN&ip=\" > /var/log/duckdns.log 2>&1"
echo ""
echo "Replace YOUR_DUCKDNS_TOKEN with your actual token from DuckDNS."

echo "=== HTTPS Setup Complete ==="
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "To check the status of your SSL certificate:"
echo "  certbot certificates"
echo ""
echo "To test auto-renewal:"
echo "  certbot renew --dry-run"
