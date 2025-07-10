import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInitialAdmin } from "@/scripts/createAdmin";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AdminSetup = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async () => {
    setLoading(true);
    const setupResult = await createInitialAdmin();
    setResult(setupResult);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Create the initial admin account for the system
          </p>
          
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> admin@admin.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p><strong>Role:</strong> Owner (Full Admin)</p>
          </div>

          <Button 
            onClick={handleCreateAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
