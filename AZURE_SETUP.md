# Azure Storage Setup

## Required Environment Variables

You need to create a `.env.local` file in the root directory with the following Azure Storage configuration:

```env
# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT=your_storage_account_name
AZURE_STORAGE_CONTAINER=your_container_name
AZURE_STORAGE_SAS_TOKEN=your_sas_token_here
```

## How to Get These Values

### 1. Azure Storage Account Name
- Go to your Azure Portal
- Navigate to your Storage Account
- Copy the Storage Account name (not the full URL)

### 2. Container Name
- In your Storage Account, go to Containers
- Copy the name of your container (e.g., "documents", "uploads", etc.)

### 3. SAS Token
- In your Storage Account, go to "Shared access signature"
- Configure the permissions: **Read**, **Write**, **List**, **Create**
- Set the expiry date (recommend 1 year for development)
- Generate the SAS token
- Copy the entire token (it starts with `?sv=`)

## Example Configuration

```env
AZURE_STORAGE_ACCOUNT=mystorageaccount
AZURE_STORAGE_CONTAINER=documents
AZURE_STORAGE_SAS_TOKEN=?sv=2022-11-02&ss=b&srt=sco&sp=rwdlc&se=2024-12-31T23:59:59Z&st=2024-01-01T00:00:00Z&spr=https&sig=abc123...
```

## Create the .env.local File

1. Create a new file called `.env.local` in the root directory of your project
2. Add the configuration above with your actual values
3. Restart your development server

## Vercel Deployment Setup

### Method 1: Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these environment variables:

| Name | Value | Environment |
|------|-------|-------------|
| `AZURE_STORAGE_ACCOUNT` | your_storage_account_name | Production, Preview, Development |
| `AZURE_STORAGE_CONTAINER` | your_container_name | Production, Preview, Development |
| `AZURE_STORAGE_SAS_TOKEN` | your_sas_token_here | Production, Preview, Development |

**Important**: Remove the `NEXT_PUBLIC_` prefix from your existing variables to keep them server-side only.

4. **Redeploy** your application after adding the variables

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add AZURE_STORAGE_ACCOUNT
vercel env add AZURE_STORAGE_CONTAINER
vercel env add AZURE_STORAGE_SAS_TOKEN

# Deploy
vercel --prod
```

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- For production, set these environment variables in your hosting platform
- Rotate your SAS tokens regularly
- SAS tokens should have appropriate expiry dates

## Troubleshooting

### Local Development
If you get the error "Azure Storage configuration missing", make sure:
1. The `.env.local` file exists in the project root
2. All three environment variables are set
3. The SAS token includes the required permissions
4. You've restarted your development server after creating the file

### Vercel Deployment
If documents are not uploading to Azure on Vercel but work locally:
1. **Check Environment Variables**: Go to Vercel dashboard → Settings → Environment Variables
2. **Verify Variables**: Ensure all three Azure variables are set for Production environment
3. **Redeploy**: After adding variables, trigger a new deployment
4. **Check Logs**: Go to Vercel dashboard → Functions → View logs for upload errors
5. **SAS Token**: Ensure your SAS token hasn't expired and has the right permissions

### Common Issues
- **SAS Token Expired**: Generate a new SAS token with a longer expiry
- **Wrong Permissions**: Ensure SAS token has `rwlc` (Read, Write, List, Create) permissions
- **Container Name**: Double-check the container name matches exactly
- **Account Name**: Verify the storage account name is correct
- **Network Issues**: Check if Vercel can access your Azure Storage account

### Debug Steps
1. Add console.log in your Azure service to check if environment variables are loaded
2. Check Vercel function logs for specific error messages
3. Test the SAS token manually using Azure Storage Explorer
4. Verify the container exists and is accessible
