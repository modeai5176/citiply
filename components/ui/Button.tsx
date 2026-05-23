import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  variant?: "primary" | "ghost" | "dark" | "plain";
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const styles = {
  primary: "bg-accent text-white hover:bg-[#b79657]",
  ghost: "border border-current bg-transparent text-current hover:bg-text-primary hover:text-white",
  dark: "bg-text-primary text-white hover:bg-black",
  plain: "text-text-primary hover:text-accent"
};

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", className, children } = props;
  const shared = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-45",
    styles[variant],
    className
  );

  if (typeof (props as LinkProps).href === "string") {
    const { href, variant: _variant, className: _className, children: _children, ...rest } = props as LinkProps;
    return (
      <Link href={href} className={shared} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, className: _className, children: _children, ...buttonProps } = props as ButtonProps;
  return (
    <button className={shared} {...buttonProps}>
      {children}
    </button>
  );
}
