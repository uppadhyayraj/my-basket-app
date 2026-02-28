"use client";

import Link from "next/link";
import { ShoppingCart, Package, HomeIcon, Receipt, LogIn, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/ApiCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { totalCartItems } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            MyBasket Lite
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="text-sm font-medium">
              <HomeIcon className="mr-2 h-4 w-4" />
              Products
            </Button>
          </Link>
          {isLoggedIn && (
            <Link href="/orders">
              <Button variant="ghost" className="text-sm font-medium">
                <Receipt className="mr-2 h-4 w-4" />
                My Orders
              </Button>
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <>
              <Link href="/cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalCartItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
                    >
                      {totalCartItems}
                    </Badge>
                  )}
                  <span className="sr-only">Shopping Cart</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="hidden sm:inline-block max-w-[120px] truncate">
                      {user?.name || user?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <Receipt className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
