import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
}

/**
 * Primary Button - Main action button
 * Blue background with glow effect
 * Use for: Accept Quest, Save, Submit, Confirm
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          px-4 py-2
          bg-sl-blue text-sl-black
          font-bold uppercase tracking-wider text-xs
          border border-transparent
          transition-all duration-200
          cursor-pointer
          hover:bg-sl-blue-dark
          shadow-[0_0_15px_rgba(0,163,255,0.4)]
          hover:shadow-[0_0_20px_rgba(0,163,255,0.6)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-sl-black border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
PrimaryButton.displayName = "PrimaryButton";

/**
 * Secondary Button - Secondary action button
 * Outline/ghost style
 * Use for: Cancel, Back, Close
 */
export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          px-4 py-2
          bg-transparent text-sl-silver-muted
          font-bold uppercase tracking-wider text-xs
          border border-sl-gray-muted
          transition-all duration-200
          cursor-pointer
          hover:text-sl-silver hover:bg-sl-gray hover:border-sl-silver-muted
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-sl-silver-muted border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
SecondaryButton.displayName = "SecondaryButton";

/**
 * Ghost Button - Minimal button
 * No background, subtle hover
 * Use for: Navigation, Today button, subtle actions
 */
export const GhostButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          px-3 py-1.5
          bg-transparent text-sl-silver-muted
          font-bold uppercase tracking-wider text-[10px]
          border border-sl-gray-muted
          transition-all duration-200
          cursor-pointer
          hover:text-sl-blue hover:border-sl-blue
          hover:shadow-[0_0_10px_rgba(0,163,255,0.3)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  },
);
GhostButton.displayName = "GhostButton";

/**
 * Icon Button - For icon-only buttons
 * Use for: Edit, Delete, Navigation arrows, Close
 */
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          p-2
          bg-transparent text-sl-silver-muted
          transition-all duration-200
          cursor-pointer
          hover:text-sl-blue hover:bg-sl-blue/10
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-sl-blue border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

/**
 * Danger Button - Destructive action button
 * Red styling
 * Use for: Delete, Remove, Logout
 */
export const DangerButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          px-4 py-2
          bg-transparent text-sl-red
          font-bold uppercase tracking-wider text-xs
          border border-sl-red/30
          transition-all duration-200
          cursor-pointer
          hover:bg-sl-red/10 hover:border-sl-red
          hover:shadow-[0_0_10px_rgba(230,57,70,0.3)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-sl-red border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
DangerButton.displayName = "DangerButton";

/**
 * Add Button - For adding new items (dashed border)
 * Use for: New Quest, Add Task
 */
export const AddButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, disabled, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          w-full py-3
          bg-transparent text-sl-silver
          font-bold uppercase tracking-wider text-xs
          border border-dashed border-sl-gray-muted
          transition-all duration-200
          cursor-pointer
          hover:text-sl-blue hover:border-sl-blue hover:bg-sl-blue/5
          hover:shadow-[0_0_15px_rgba(0,163,255,0.2)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
          disabled:hover:text-sl-silver-muted disabled:hover:border-sl-gray-muted/50 disabled:hover:bg-transparent
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  },
);
AddButton.displayName = "AddButton";

/**
 * Disabled/Past Button - For disabled states like past days
 * Very muted styling
 */
export const DisabledButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled
        className={`
          w-full py-3
          bg-transparent text-[#2a2a2a]
          font-bold uppercase tracking-wider text-xs
          border border-[#1a1a1a]
          cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DisabledButton.displayName = "DisabledButton";
