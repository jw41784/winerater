# Deploying WineRater

This document provides instructions for deploying your WineRater application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- All your files ready (HTML, CSS, JS, favicons, etc.)
- Tested the application locally
- Optimized images and assets

## Deployment Options

### 1. GitHub Pages (Free)

1. Create a new GitHub repository
2. Upload your WineRater files to the repository
3. Go to repository Settings > Pages
4. Select the branch to deploy (usually `main`)
5. Your site will be available at `https://[your-username].github.io/[repo-name]/`

### 2. Netlify (Free Tier Available)

1. Create an account on [Netlify](https://www.netlify.com/)
2. From the dashboard, select "New site from Git"
3. Connect to your GitHub/GitLab/Bitbucket account
4. Select your WineRater repository
5. Configure build settings (not needed for this static site)
6. Deploy the site

### 3. Vercel (Free Tier Available)

1. Create an account on [Vercel](https://vercel.com/)
2. From the dashboard, click "Import Project"
3. Connect to your GitHub/GitLab/Bitbucket account
4. Select your WineRater repository
5. Configure project settings
6. Deploy the site

### 4. Traditional Web Hosting

1. Purchase web hosting from providers like Bluehost, DreamHost, or SiteGround
2. Access your hosting account's cPanel or control panel
3. Use the File Manager or FTP to upload your WineRater files to the public_html directory
4. Your site will be live at your domain name

## Post-Deployment Checklist

After deploying, verify:

- [ ] All pages load correctly
- [ ] Images and assets display properly
- [ ] Local storage functionality works
- [ ] Responsive design works on multiple devices
- [ ] PWA features work as expected (if using service worker)

## Custom Domain Setup

If you want to use a custom domain:

1. Purchase a domain from a domain registrar (GoDaddy, Namecheap, etc.)
2. Configure DNS settings to point to your hosting provider
3. Set up the custom domain in your hosting platform's settings

## Analytics Integration

Consider adding Google Analytics to track usage:

1. Create a Google Analytics account
2. Get your tracking code
3. Add the tracking code to your HTML before the closing `</head>` tag
4. Verify tracking is working