import { cn } from "@/app/lib/utils";

interface MedalProps {
  rank: number;
  className?: string;
}

export function Medal({ rank, className }: MedalProps) {
  if (rank === 1) {
    return <GoldMedal className={className} />;
  } else if (rank === 2) {
    return <SilverMedal className={className} />;
  } else if (rank === 3) {
    return <BronzeMedal className={className} />;
  } else {
    return <span className={cn("font-medium", className)}>{rank}</span>;
  }
}

function GoldMedal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold shadow-md">
        <span>1</span>
      </div>
      <div className="absolute -bottom-1 w-6 h-3 bg-red-500 rounded-sm -rotate-45 -right-1"></div>
      <div className="absolute -bottom-1 w-6 h-3 bg-red-500 rounded-sm rotate-45 -left-1"></div>
    </div>
  );
}

function SilverMedal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold shadow-md">
        <span>2</span>
      </div>
      <div className="absolute -bottom-1 w-6 h-3 bg-green-500 rounded-sm -rotate-45 -right-1"></div>
      <div className="absolute -bottom-1 w-6 h-3 bg-green-500 rounded-sm rotate-45 -left-1"></div>
    </div>
  );
}

function BronzeMedal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold shadow-md">
        <span>3</span>
      </div>
      <div className="absolute -bottom-1 w-6 h-3 bg-blue-500 rounded-sm -rotate-45 -right-1"></div>
      <div className="absolute -bottom-1 w-6 h-3 bg-blue-500 rounded-sm rotate-45 -left-1"></div>
    </div>
  );
}
