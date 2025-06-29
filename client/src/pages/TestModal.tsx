import { useState } from "react";
import { Button } from "@/components/ui/button";


export default function TestModal() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Modal Dashboard Test</h1>
        <Button 
          onClick={() => setIsDashboardOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 text-lg"
        >
          Open Modal Merchant Dashboard
        </Button>
      </div>


    </div>
  );
}