/**
 * Generate a consistent username/handle for a user
 * Priority: username > firstname.lastname > email prefix > 'user'
 */
export const getUserHandle = (user) => {
  if (!user) return 'user';
  
  if (user.username) {
    return user.username;
  }
  
  // Generate from first and last name
  if (user.firstName && user.lastName) {
    return `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`;
  }
  
  // Fallback to email prefix
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'user';
};

/**
 * Generate display name for a user
 * Priority: firstName lastName > username > email > 'User'
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (name) return name;
  
  if (user.username) return user.username;
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};
