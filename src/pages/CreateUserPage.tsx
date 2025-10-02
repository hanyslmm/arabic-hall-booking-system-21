import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: 'hala',
    password: 'hala123',
    fullName: 'Hala',
    role: 'space_manager'
  });

  const createUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const email = `${formData.username}@admin.com`;
      
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
      }

      let userId = authData?.user?.id;
      
      if (authError && authError.message.includes('already registered')) {
        // Try to sign in to get user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: formData.password
        });
        
        if (signInError) {
          throw new Error('User exists but password is incorrect');
        }
        
        userId = signInData.user.id;
      }

      if (!userId) {
        throw new Error('Could not create or find user');
      }

      // Step 2: Create/update profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: formData.fullName,
          username: formData.username,
          user_role: formData.role
        })
        .select()
        .single();

      if (profileError) {
        throw new Error('Profile error: ' + profileError.message);
      }

      setResult({
        success: true,
        email: email,
        profile: profileData
      });

    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const email = `${formData.username}@admin.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password
      });

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        message: `✅ Login successful with: ${formData.username} / ${formData.password}`,
        email: email,
        user: data.user
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="hala"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="hala123"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="Hala"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="space_manager">مدير قاعات (Hall Manager)</SelectItem>
                <SelectItem value="manager">مدير عام (General Manager)</SelectItem>
                <SelectItem value="owner">مالك النظام (Owner)</SelectItem>
                <SelectItem value="teacher">معلم (Teacher)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={createUser} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
            
            <Button 
              onClick={testLogin} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && result.success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-semibold">✅ Success!</p>
                  <p>Email: <strong>{result.email}</strong></p>
                  <p>Username: <strong>{formData.username}</strong></p>
                  <p>Password: <strong>{formData.password}</strong></p>
                  <p>Role: <strong>{formData.role}</strong></p>
                  
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-semibold">Login Instructions:</p>
                    <ol className="list-decimal list-inside mt-2">
                      <li>Go to login page</li>
                      <li>Username: <strong>{formData.username}</strong></li>
                      <li>Password: <strong>{formData.password}</strong></li>
                    </ol>
                  </div>
                  
                  {result.message && <p>{result.message}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
