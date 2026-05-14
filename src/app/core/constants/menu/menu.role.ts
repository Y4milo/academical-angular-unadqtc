import adminRoleMenu from './roles/admin.role.menu';
import academicRoleMenu from './roles/academic.role.menu';
import {MenuItem} from 'primeng/api';

const menuRole: Record<string, MenuItem[]> = {
  admin: adminRoleMenu,
  academic: academicRoleMenu,

};

export default menuRole;
