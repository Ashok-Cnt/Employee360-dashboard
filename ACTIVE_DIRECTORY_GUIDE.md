# Active Directory Integration Guide

## Overview

The Employee360 Dashboard now supports Active Directory integration, allowing you to automatically sync user information from your organization's Active Directory or Azure AD. This eliminates the need for manual user data entry and ensures information stays up-to-date.

## Features

✅ **Automatic User Sync** - Pull user data directly from Active Directory  
✅ **Rich User Profiles** - Department, job title, manager, contact info, and more  
✅ **Real-time Updates** - Manual refresh and automatic periodic sync  
✅ **Bulk Operations** - Sync multiple users at once  
✅ **Search Integration** - Find and sync specific users from AD  
✅ **Fallback Support** - Works with existing manual user management  

## Setup Instructions

### 1. Configure Active Directory Connection

Edit the `.env` file in the `backend` folder with your AD details:

```env
# Active Directory Configuration
AD_SERVER=ldap://your-domain-controller.com:389
AD_DOMAIN=YOURDOMAIN
AD_USER=service-account@yourdomain.com
AD_PASSWORD=service-account-password
AD_BASE_DN=DC=yourdomain,DC=com
```

### 2. For Azure AD/Office 365

If you're using Azure AD instead of on-premises AD:

```env
# Azure AD Configuration
AD_SERVER=ldaps://yourdomain.onmicrosoft.com:636
AD_DOMAIN=yourdomain.onmicrosoft.com
AD_USER=service-account@yourdomain.onmicrosoft.com
AD_PASSWORD=service-account-password
AD_BASE_DN=DC=yourdomain,DC=onmicrosoft,DC=com
```

### 3. Service Account Requirements

Create a service account with the following permissions:
- **Read access** to user objects in Active Directory
- **Permission to query** user attributes
- **No administrative privileges required** (read-only access)

### 4. Firewall Configuration

Ensure your application server can reach:
- **LDAP Port 389** (for unencrypted connections)
- **LDAPS Port 636** (for encrypted connections - recommended)

## How to Use

### Access the AD Management Page

1. Open the Employee360 Dashboard
2. Click **"Active Directory"** in the sidebar
3. The management interface has three tabs:

#### 🔗 Connection Status Tab
- Test your AD connection
- View server and domain information
- Troubleshoot connection issues

#### 🔍 Search Users Tab
- Search for specific users by email or username
- Preview user information from AD
- Sync individual users to the database

#### 👥 Bulk Operations Tab
- Sync up to 50 users at once
- Background processing for large operations
- Monitor sync progress

### Quick Sync Options

#### From the Navbar:
- **🔄 Refresh Button** - Updates current user data from database
- **☁️ AD Sync Button** - Syncs current user from Active Directory

#### From the AD Management Page:
- **Search and sync** individual users
- **Bulk sync** multiple users
- **Test connection** status

## User Data Mapping

The following Active Directory attributes are automatically mapped:

| AD Attribute | Database Field | Description |
|--------------|----------------|-------------|
| `cn` | `full_name` | Common Name (Full Name) |
| `givenName` | `first_name` | First Name |
| `sn` | `last_name` | Last Name (Surname) |
| `mail` | `email` | Email Address |
| `sAMAccountName` | `username` | Username |
| `displayName` | `display_name` | Display Name |
| `department` | `department` | Department |
| `title` | `job_title` | Job Title |
| `telephoneNumber` | `phone_number` | Phone Number |
| `mobile` | `mobile_number` | Mobile Number |
| `company` | `company` | Company Name |
| `physicalDeliveryOfficeName` | `office_location` | Office Location |
| `streetAddress` | `street_address` | Street Address |
| `l` | `city` | City |
| `st` | `state` | State |
| `postalCode` | `postal_code` | Postal Code |
| `co` | `country` | Country |
| `manager` | `manager_dn` | Manager Distinguished Name |
| `memberOf` | `groups` | Group Memberships |

## Security Considerations

### 🔒 Password Management
- New users from AD get temporary password: `changeme123`
- Users should change passwords on first login
- Existing user passwords are never overwritten

### 🛡️ Connection Security
- Use LDAPS (encrypted) connections when possible
- Store service account credentials securely
- Use dedicated service account with minimal privileges

### 📝 Data Privacy
- Only necessary user attributes are synced
- Sensitive AD data is not stored
- User passwords from AD are never accessed

## API Endpoints

The following API endpoints are available for AD integration:

```http
GET  /api/ad/test-connection          # Test AD connection
POST /api/ad/sync-user               # Sync specific user
POST /api/ad/bulk-sync               # Bulk sync users
GET  /api/ad/search?query=email      # Search AD users
POST /api/ad/refresh-user/{user_id}  # Refresh user from AD
GET  /api/ad/sync-status/{user_id}   # Get sync status
```

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to Active Directory"  
**Solutions**:
- Verify server address and port (389 for LDAP, 636 for LDAPS)
- Check service account credentials
- Ensure firewall allows connections
- Test with `telnet your-dc.com 389`

**Problem**: "User not found in Active Directory"  
**Solutions**:
- Verify user exists in AD
- Check search base DN is correct
- Ensure user is not disabled
- Try searching by different attributes (email vs username)

### Permission Issues

**Problem**: "Access denied" errors  
**Solutions**:
- Verify service account has read permissions
- Check if account is locked or disabled
- Ensure account has "Log on as a service" right
- Test with AD browser tool

### Performance Issues

**Problem**: Slow sync operations  
**Solutions**:
- Use bulk sync for multiple users
- Implement during off-peak hours
- Consider increasing connection timeout
- Monitor network latency

## Advanced Configuration

### Custom Attribute Mapping

To map additional AD attributes, modify the `_parse_user_entry` method in:
`backend/app/services/active_directory.py`

### Connection Pooling

For high-volume environments, consider implementing connection pooling in the AD service.

### Scheduled Sync

Set up automated sync using:
```python
# Add to your scheduler
async def scheduled_ad_sync():
    await perform_bulk_sync(limit=100)
```

## Support

For additional support:
1. Check the connection status in the AD Management page
2. Review backend logs for detailed error messages
3. Test with minimal AD configuration first
4. Verify with your AD administrator

## Benefits

✅ **Reduced Manual Entry** - No more typing user details  
✅ **Always Current** - User info stays synchronized  
✅ **Rich Profiles** - Organizational hierarchy and contact details  
✅ **Seamless Integration** - Works alongside existing user management  
✅ **Enterprise Ready** - Supports large-scale deployments  

Your Employee360 Dashboard is now ready for enterprise Active Directory integration! 🚀