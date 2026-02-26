"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Hardcoded admin credentials for demo
  const ADMIN_EMAIL = "admin@linkcab.in";
  const ADMIN_PASSWORD = "admin123";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple hardcoded authentication for demo
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Store session in cookie for middleware compatibility
        const sessionData = {
          email: ADMIN_EMAIL,
          loginTime: new Date().toISOString()
        };

        // Set cookie with 24 hour expiry
        document.cookie = `admin_session=${JSON.stringify(sessionData)}; path=/; max-age=${24 * 60 * 60}; secure; samesite=strict`;

        toast.success("Login successful!");
        router.push("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-yellow-200 shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <img
              src="/linkcab-logo.png"
              alt="LinkCab Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-3xl text-black font-bold">LinkCab Admin</CardTitle>
          <p className="text-gray-600 mt-2">Sign in to access the admin portal</p>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@linkcab.in"
                required
                className="border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-black">
              <strong className="text-black">Demo Credentials:</strong><br />
              Email: admin@linkcab.in<br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
