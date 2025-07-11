// Legacy file - please use privilegeManager.ts instead
// Keeping this for backward compatibility only

import { 
  grantAdminPrivileges, 
  upgradeMultipleUsersToAdmin, 
  getUserProfile,
  type PrivilegeResult 
} from "./privilegeManager";

export const checkUserPrivileges = async (email: string) => {
  const profile = await getUserProfile(email);
  return profile;
};

export const upgradeUserToAdmin = async (email: string): Promise<PrivilegeResult> => {
  return await grantAdminPrivileges(email);
};

export const upgradeMultipleUsers = async (emails: string[]) => {
  return await upgradeMultipleUsersToAdmin(emails);
};
