import SystemManagementPrivileges from '../privileges/system-management.privileges';
import HumanResourcesPrivileges from '../privileges/human-resources.privileges';
import AcademicPrivileges from '../privileges/academic.privileges';

const AdminRoleMenu = [
  {
    label: 'System Management',
    icon: 'home',
    items: SystemManagementPrivileges
  },
  {
    label: 'Human Resources',
    icon: 'user',
    items: HumanResourcesPrivileges
  },
  {
    label: 'Academic',
    icon: 'user',
    items: AcademicPrivileges
  }
]
export default AdminRoleMenu
