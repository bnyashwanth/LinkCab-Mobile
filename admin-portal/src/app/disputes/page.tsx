"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Disputes() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Disputes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Dispute management coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              This section will handle user disputes, ride conflicts, and resolution tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
