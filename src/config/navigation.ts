import { Home, Users, Settings, FileText, BarChart3, Mail, LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// 在这里配置侧边栏导航菜单
export const navigationConfig: NavGroup[] = [
  {
    label: '主要功能',
    items: [
      { title: '首页', url: '/dashboard', icon: Home },
      { title: '用户管理', url: '/dashboard/users', icon: Users },
      { title: '数据报表', url: '/dashboard/reports', icon: BarChart3 },
    ],
  },
  {
    label: '其他',
    items: [
      { title: '文档', url: '/dashboard/docs', icon: FileText },
      { title: '消息', url: '/dashboard/messages', icon: Mail },
      { title: '设置', url: '/dashboard/settings', icon: Settings },
    ],
  },
];
