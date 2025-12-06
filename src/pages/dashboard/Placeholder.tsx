import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Placeholder = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || '页面';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold capitalize">{pageName}</h2>
        <p className="text-muted-foreground">这是一个占位页面</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>待开发</CardTitle>
          <CardDescription>此页面内容待开发</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>你可以在 <code className="bg-muted px-1 rounded">src/pages/dashboard/</code> 目录下创建新的页面组件来替换此占位页面。</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Placeholder;
