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

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- For production, set these environment variables in your hosting platform
- Rotate your SAS tokens regularly

## Troubleshooting

If you get the error "Azure Storage configuration missing", make sure:
1. The `.env.local` file exists in the project root
2. All three environment variables are set
3. The SAS token includes the required permissions
4. You've restarted your development server after creating the file
