import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateHalaUserPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createHalaUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try multiple email formats
      const emailsToTry = [
        'hala@admin.com',
        'hala@gmail.com',
        'hala@system.local'
      ];

      let successEmail = null;
      let userId = null;

      // Try to create the user with different emails
      for (const email of emailsToTry) {
        console.log(`Trying to create user with email: ${email}`);
        
        // First, try to sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: 'hala123',
          options: {
            data: {
              full_name: 'Hala',
              username: 'hala'
            }
          }
        });

        if (!authError && authData.user) {
          successEmail = email;
          userId = authData.user.id;
          console.log(`✅ User created successfully with email: ${email}`);
          break;
        } else if (authError?.message?.includes('already registered')) {
          console.log(`User already exists with email: ${email}`);
          
          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'hala123'
          });
          
          if (!signInError && signInData.user) {
            successEmail = email;
            userId = signInData.user.id;
            console.log(`✅ User already exists and can login with: ${email}`);
            break;
          }
        }
        
        console.log(`Failed with ${email}:`, authError?.message);
      }

      if (!successEmail || !userId) {
        throw new Error('Could not create or find user with any email format');
      }

      // Update or create the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: successEmail,
          full_name: 'Hala',
          username: 'hala',
          user_role: 'space_manager', // Hall Manager role
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Try to update existing profile
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: 'Hala',
            username: 'hala',
            user_role: 'space_manager',
          })
          .eq('id', userId)
          .select()
          .single();
          
        if (updateError) {
          throw updateError;
        }
        
        setResult({
          success: true,
          email: successEmail,
          profile: updateData
        });
      } else {
        setResult({
          success: true,
          email: successEmail,
          profile: profileData
        });
      }

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create/update user');
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const emailsToTry = [
        'hala@admin.com',
        'hala@gmail.com',
        'hala@system.local'
      ];

      for (const email of emailsToTry) {
        console.log(`Testing login with: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'hala123'
        });

        if (!error && data.user) {
          setResult({
            success: true,
            message: `✅ Login successful with email: ${email}`,
            email: email,
            user: data.user
          });
          break;
        }
        console.log(`Failed with ${email}:`, error?.message);
      }
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
          <CardTitle className="text-2xl">Create/Fix Hala User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page will create or fix the "hala" user with:
              <ul className="mt-2 list-disc list-inside">
                <li>Username: hala</li>
                <li>Password: hala123</li>
                <li>Role: space_manager (Hall Manager)</li>
                <li>Multiple email formats will be tried</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button 
              onClick={createHalaUser} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Create/Fix Hala User'}
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
                  {result.email && (
                    <>
                      <p>Email: <strong>{result.email}</strong></p>
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="font-semibold">Login Instructions:</p>
                        <ol className="list-decimal list-inside mt-2">
                          <li>Go to login page</li>
                          <li>Username: <strong>hala</strong></li>
                          <li>Password: <strong>hala123</strong></li>
                        </ol>
                      </div>
                    </>
                  )}
                  {result.message && <p>{result.message}</p>}
                  {result.profile && (
                    <div className="text-sm mt-2">
                      <p>Profile ID: {result.profile.id}</p>
                      <p>Role: {result.profile.user_role}</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p className="text-sm text-gray-600">
              Check the browser console for detailed logs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
