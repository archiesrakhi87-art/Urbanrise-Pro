import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { src?: string | null, alt?: string, fallback?: string }>(
  ({ className, src, alt, fallback, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || ""}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
          {fallback || "?"}
        </div>
      )}
    </div>
  )
)
Avatar.displayName = "Avatar"

export { Avatar }
