import { 
  Home, Users, FileText, BarChart3, PersonStanding, LucideIcon, UserCog, UserPlus, PieChart, 
  MessageCircle, MessageCircleHeart, MessageCircleMore,File ,FileChartColumn,Database,Book,BookOpen,
  MessageSquareText,Feather,Clipboard  } from 'lucide-react';

export interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// 在这里配置侧边栏导航菜单（支持树状结构）
export const navigationConfig: NavGroup[] = [
  {
    label: '主要功能',
    items: [
      { title: '首页', url: '/dashboard', icon: Home },
      { 
        title: '用户管理', 
        icon: Users,
        children: [
          { title: '用户列表', url: '/dashboard/users', icon: UserCog },
          { title: '添加用户', url: '/dashboard/users/add', icon: UserPlus },
        ]
      },
      { 
        title: '系统基础的配置', 
        icon: BarChart3,
        children: [
          { title: '类型管理', url: '/dashboard/type-management', icon: PieChart },
          { title: '角色提示词管理', url: '/dashboard/prompt-management', icon: PersonStanding },
          { title: '聊天记录', url: '/dashboard/memory-mangament', icon: MessageSquareText },
        ]
      },
    ],
  },
  {
    label: '其他',
    items: [
      { title: '文档',
        icon: FileText,
        children:[
          {title:'资料处理',url:'/dashboard/document-management',icon:File},
          {title:'查看切割资料',url:'/dashboard/document-management',icon:File},
          {title:'查看切割准备向量的书籍',url:'/dashboard/book-vectors-management',icon:FileChartColumn}
        ]
       },
      { 
        title: '知识库', 
        icon: Database,
        children: [
          { title: '查看知识库', url: '/dashboard/knowledge-base-management', icon: Book  },
          { title: '知识库内容', url: '/dashboard/knowledge-books-management', icon: BookOpen },
        ]
      },
      { 
        title: '聊天', 
        icon: MessageCircle,
        children: [
          { title: 'ai女友(残缺版)', url: '/dashboard/chat-management', icon: MessageCircleHeart  },
          { title: '知识库检索', url: '/dashboard/search-management', icon: MessageCircleMore },
        ]
      },
       { 
        title: '问题', 
        icon: Feather,
        children: [
          { title: '记录的问题', url: '/dashboard/question-management', icon: Clipboard  },
        ]
      },
    ],
  },
];
