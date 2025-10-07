import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ButtonTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export function ButtonTest() {
  const [tests, setTests] = useState<ButtonTest[]>([
    { name: 'Brief Button', status: 'pending', message: 'Click the Brief button in the header' },
    { name: 'End Day Button', status: 'pending', message: 'Click the End Day button in the header' },
    { name: 'Notifications Button', status: 'pending', message: 'Click the Notifications button in the header' },
    { name: 'Profile Button', status: 'pending', message: 'Click the Profile button in the header' },
    { name: 'Logout Button', status: 'pending', message: 'Click the Logout button in the header' },
    { name: 'Sidebar Navigation', status: 'pending', message: 'Click any navigation item in the sidebar' },
    { name: 'Quick Actions', status: 'pending', message: 'Click any quick action button on the dashboard' },
  ]);

  const updateTest = (name: string, status: 'success' | 'error', message: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message } : test
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">✓ Working</Badge>;
      case 'error':
        return <Badge variant="destructive">✗ Error</Badge>;
      default:
        return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Button Functionality Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Test each button to verify they're working correctly. Click the buttons in the header and sidebar, then mark them as working or broken.
        </div>
        
        {tests.map((test, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-muted-foreground">{test.message}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(test.status)}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTest(test.name, 'success', 'Button clicked successfully!')}
                  disabled={test.status === 'success'}
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTest(test.name, 'error', 'Button not working or has issues')}
                  disabled={test.status === 'error'}
                >
                  ✗
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Test Results Summary:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {tests.filter(t => t.status === 'success').length}
              </div>
              <div className="text-muted-foreground">Working</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {tests.filter(t => t.status === 'error').length}
              </div>
              <div className="text-muted-foreground">Broken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {tests.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
