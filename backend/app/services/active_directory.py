"""
Active Directory Service Module

This module provides integration with Active Directory to fetch user information
automatically. It supports both on-premises AD and Azure AD configurations.
"""

import os
import logging
from typing import Optional, Dict, List, Any
from ldap3 import Server, Connection, ALL, NTLM, SUBTREE
from ldap3.core.exceptions import LDAPException
from datetime import datetime

logger = logging.getLogger(__name__)

class ActiveDirectoryService:
    """Service for interacting with Active Directory"""
    
    def __init__(self):
        # AD Configuration from environment variables
        self.ad_server = os.getenv('AD_SERVER', 'ldap://your-domain-controller.com')
        self.ad_domain = os.getenv('AD_DOMAIN', 'YOURDOMAIN')
        self.ad_user = os.getenv('AD_USER', 'service-account@yourdomain.com')
        self.ad_password = os.getenv('AD_PASSWORD', 'service-account-password')
        self.ad_base_dn = os.getenv('AD_BASE_DN', 'DC=yourdomain,DC=com')
        
        # Connection object
        self.connection = None
        
    def connect(self) -> bool:
        """Establish connection to Active Directory"""
        try:
            # Create server object
            server = Server(self.ad_server, get_info=ALL)
            
            # Create connection with NTLM authentication
            self.connection = Connection(
                server,
                user=self.ad_user,
                password=self.ad_password,
                authentication=NTLM,
                auto_bind=True
            )
            
            logger.info("Successfully connected to Active Directory")
            return True
            
        except LDAPException as e:
            logger.error(f"Failed to connect to Active Directory: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to AD: {e}")
            return False
    
    def disconnect(self):
        """Close the AD connection"""
        if self.connection:
            self.connection.unbind()
            self.connection = None
            logger.info("Disconnected from Active Directory")
    
    def search_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Search for a user by email address"""
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            # LDAP search filter for email
            search_filter = f"(&(objectClass=user)(mail={email}))"
            
            # Attributes to retrieve
            attributes = [
                'cn',                    # Common Name (Full Name)
                'givenName',            # First Name
                'sn',                   # Last Name (Surname)
                'mail',                 # Email
                'sAMAccountName',       # Username
                'userPrincipalName',    # User Principal Name
                'displayName',          # Display Name
                'department',           # Department
                'title',                # Job Title
                'telephoneNumber',      # Phone Number
                'mobile',               # Mobile Number
                'manager',              # Manager DN
                'company',              # Company
                'physicalDeliveryOfficeName',  # Office Location
                'streetAddress',        # Street Address
                'l',                    # City (Locality)
                'st',                   # State
                'postalCode',           # Postal Code
                'co',                   # Country
                'memberOf',             # Group Memberships
                'whenCreated',          # Account Creation Date
                'lastLogon',            # Last Logon Time
                'accountExpires',       # Account Expiration
                'userAccountControl'    # Account Control Flags
            ]
            
            # Perform search
            self.connection.search(
                search_base=self.ad_base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=attributes
            )
            
            if len(self.connection.entries) > 0:
                entry = self.connection.entries[0]
                return self._parse_user_entry(entry)
            else:
                logger.info(f"No user found with email: {email}")
                return None
                
        except LDAPException as e:
            logger.error(f"LDAP search error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error searching user: {e}")
            return None
    
    def search_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Search for a user by username (sAMAccountName)"""
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            # LDAP search filter for username
            search_filter = f"(&(objectClass=user)(sAMAccountName={username}))"
            
            # Use same attributes as email search
            attributes = [
                'cn', 'givenName', 'sn', 'mail', 'sAMAccountName', 'userPrincipalName',
                'displayName', 'department', 'title', 'telephoneNumber', 'mobile',
                'manager', 'company', 'physicalDeliveryOfficeName', 'streetAddress',
                'l', 'st', 'postalCode', 'co', 'memberOf', 'whenCreated',
                'lastLogon', 'accountExpires', 'userAccountControl'
            ]
            
            # Perform search
            self.connection.search(
                search_base=self.ad_base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=attributes
            )
            
            if len(self.connection.entries) > 0:
                entry = self.connection.entries[0]
                return self._parse_user_entry(entry)
            else:
                logger.info(f"No user found with username: {username}")
                return None
                
        except LDAPException as e:
            logger.error(f"LDAP search error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error searching user: {e}")
            return None
    
    def get_all_users(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all users from Active Directory (with limit)"""
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            # LDAP search filter for all active users
            search_filter = "(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
            
            # Basic attributes for listing
            attributes = [
                'cn', 'givenName', 'sn', 'mail', 'sAMAccountName', 'userPrincipalName',
                'displayName', 'department', 'title', 'company'
            ]
            
            # Perform search with size limit
            self.connection.search(
                search_base=self.ad_base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=attributes,
                size_limit=limit
            )
            
            users = []
            for entry in self.connection.entries:
                user_data = self._parse_user_entry(entry)
                if user_data:
                    users.append(user_data)
            
            logger.info(f"Retrieved {len(users)} users from Active Directory")
            return users
                
        except LDAPException as e:
            logger.error(f"LDAP search error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error getting users: {e}")
            return []
    
    def _parse_user_entry(self, entry) -> Dict[str, Any]:
        """Parse LDAP entry into a standardized user dictionary"""
        try:
            # Helper function to safely get attribute value
            def get_attr(attr_name: str) -> Any:
                attr = getattr(entry, attr_name, None)
                if attr and hasattr(attr, 'value'):
                    return attr.value
                return None
            
            # Extract basic user information
            user_data = {
                'ad_object_guid': str(entry.entry_dn),
                'username': get_attr('sAMAccountName'),
                'email': get_attr('mail'),
                'full_name': get_attr('cn') or get_attr('displayName'),
                'first_name': get_attr('givenName'),
                'last_name': get_attr('sn'),
                'display_name': get_attr('displayName'),
                'user_principal_name': get_attr('userPrincipalName'),
                
                # Organizational information
                'department': get_attr('department'),
                'job_title': get_attr('title'),
                'company': get_attr('company'),
                'manager_dn': get_attr('manager'),
                
                # Contact information
                'phone_number': get_attr('telephoneNumber'),
                'mobile_number': get_attr('mobile'),
                'office_location': get_attr('physicalDeliveryOfficeName'),
                
                # Address information
                'street_address': get_attr('streetAddress'),
                'city': get_attr('l'),
                'state': get_attr('st'),
                'postal_code': get_attr('postalCode'),
                'country': get_attr('co'),
                
                # Account information
                'groups': [str(group) for group in (get_attr('memberOf') or [])],
                'account_created': get_attr('whenCreated'),
                'last_logon': get_attr('lastLogon'),
                'account_expires': get_attr('accountExpires'),
                'account_control': get_attr('userAccountControl'),
                
                # Metadata
                'ad_sync_date': datetime.utcnow(),
                'is_ad_user': True
            }
            
            # Clean up None values
            return {k: v for k, v in user_data.items() if v is not None}
            
        except Exception as e:
            logger.error(f"Error parsing user entry: {e}")
            return {}
    
    def test_connection(self) -> Dict[str, Any]:
        """Test the Active Directory connection and return status"""
        try:
            if self.connect():
                # Try a simple search to verify functionality
                self.connection.search(
                    search_base=self.ad_base_dn,
                    search_filter="(objectClass=domain)",
                    search_scope=SUBTREE,
                    attributes=['name']
                )
                
                self.disconnect()
                
                return {
                    "status": "success",
                    "message": "Successfully connected to Active Directory",
                    "server": self.ad_server,
                    "domain": self.ad_domain
                }
            else:
                return {
                    "status": "error",
                    "message": "Failed to connect to Active Directory",
                    "server": self.ad_server,
                    "domain": self.ad_domain
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
                "server": self.ad_server,
                "domain": self.ad_domain
            }

# Global AD service instance
ad_service = ActiveDirectoryService()