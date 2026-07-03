import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakBadge({ count, size = "md", className }: StreakBadgeProps) {
  const color =
    count === 0 ? "text-muted-foreground" :
    count <= 2  ? "text-amber-500" :
    count <= 6  ? "text-orange-500" :
                  "text-[#e8c547]";

  const textSize =
    size === "sm" ? "text-xs" :
    size === "lg" ? "text-xl" :
                    "text-sm";

  const numSize =
    size === "sm" ? "text-sm" :
    size === "lg" ? "text-2xl" :
                    "text-base";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span
        className={cn(textSize, count >= 3 && "animate-[flicker_1.5s_ease-in-out_infinite_alternate]")}
        style={{ display: "inline-block" }}
      >
        🔥
      </span>
      <span className={cn("font-black leading-none", numSize, color)}>
        {count}
      </span>
      {size !== "sm" && (
        <span className="text-xs text-muted-foreground font-normal">
          {count === 1 ? "day" : "days"}
        </span>
      )}
    </div>
  );
}
