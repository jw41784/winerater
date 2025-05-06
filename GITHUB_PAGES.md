# Deploying WineRater to GitHub Pages

Follow these steps to deploy your WineRater application to GitHub Pages:

## 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name your repository `winerater` (or whatever name you prefer)
4. Choose if you want the repository to be public or private
5. Click "Create repository"

## 2. Push Your Code to GitHub

Run the following commands in your terminal after creating the repository:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/winerater.git

# Push your code to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" (tab on the top of your repository page)
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select the branch you want to deploy (typically `main`)
5. Click "Save"

GitHub will provide a URL where your site is published (usually `https://YOUR_USERNAME.github.io/winerater/`).

## 4. Verify Your Deployment

1. Wait a few minutes for GitHub to build and deploy your site
2. Visit the provided URL to verify your application is live
3. Test all functionality to ensure everything works as expected

## 5. Custom Domain (Optional)

If you want to use a custom domain:

1. Purchase a domain from a domain registrar
2. In your repository settings, under GitHub Pages, enter your custom domain
3. Configure your domain's DNS settings to point to GitHub Pages

## Troubleshooting

- If your site doesn't appear, make sure the index.html file is in the root directory
- If assets (CSS, JavaScript) don't load, check that paths are relative
- For more help, consult the [GitHub Pages documentation](https://docs.github.com/en/pages)

## Updating Your Site

After making changes to your code locally:

1. Commit your changes: `git commit -m "Description of changes"`
2. Push to GitHub: `git push origin main`
3. GitHub Pages will automatically rebuild and deploy your site