import { Shield } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-blue-600" />
      <span className="text-xl font-bold text-gray-900">IPDR-Intel+</span>
    </div>
  );
}