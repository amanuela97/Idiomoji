"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/app/lib/firebase-client";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/components/ui/avatar";

// Define navigation items
const navItems = [
  { name: "Daily Puzzle", href: "/daily" },
  { name: "Time Attack", href: "/time-attack" },
  { name: "Contribute", href: "/submit" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "My Stats", href: "/stats" },
] as const;

// Admin-only navigation items
const adminItems = [{ name: "Admin Review", href: "/admin" }] as const;

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Close dropdown when user changes
  useEffect(() => {
    setShowDropdown(false);
  }, [user]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(tokenResult.claims.admin === true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsAdmin(false); // Reset admin state immediately
      setShowDropdown(false); // Close dropdown before logging out

      // Clear localStorage
      localStorage.removeItem("currentGame");
      localStorage.removeItem("lastPlayed");
      localStorage.removeItem("playerStats");

      // Clear session cookie
      await fetch("/api/logout", {
        method: "POST",
      });

      // Sign out from Firebase
      await signOut(auth);

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to check if a path is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              <Image
                src="/logo.webp"
                alt="Idiomoji Logo"
                width={60}
                height={60}
                className="rounded-lg"
                priority
              />
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex ml-6 space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`min-w-[100px] font-medium border-b-2 ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 border-blue-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
                  }`}
                  asChild
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              ))}
              {isAdmin &&
                adminItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`min-w-[100px] font-medium border-b-2 ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border-blue-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
                    }`}
                    asChild
                  >
                    <Link href={item.href}>{item.name}</Link>
                  </Button>
                ))}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus:outline-none"
                >
                  <Avatar>
                    <AvatarImage
                      src={
                        user.photoURL ||
                        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                      }
                      alt="Profile"
                    />
                    <AvatarFallback>
                      {user.displayName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      {/* Mobile Navigation Items */}
                      <div className="md:hidden">
                        {navItems.map((item) => (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className={`w-full justify-start font-medium ${
                              isActive(item.href)
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-600"
                            }`}
                            asChild
                          >
                            <Link
                              href={item.href}
                              onClick={() => setShowDropdown(false)}
                            >
                              {item.name}
                            </Link>
                          </Button>
                        ))}
                        {isAdmin &&
                          adminItems.map((item) => (
                            <Button
                              key={item.href}
                              variant="ghost"
                              className={`w-full justify-start font-medium ${
                                isActive(item.href)
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-600"
                              }`}
                              asChild
                            >
                              <Link
                                href={item.href}
                                onClick={() => setShowDropdown(false)}
                              >
                                {item.name}
                              </Link>
                            </Button>
                          ))}
                        <div className="border-t border-gray-100 my-1" />
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
