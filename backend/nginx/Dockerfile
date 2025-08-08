# Use official Nginx Alpine image
FROM nginx:stable-alpine

# Copy your custom nginx config file
COPY backend.conf /etc/nginx/conf.d/backend.conf

# Copy SSL certificates from backend certs folder
COPY ../certs /etc/nginx/certs

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]