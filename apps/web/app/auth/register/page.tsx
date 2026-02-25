"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftCircle, Wallet } from "lucide-react";
import { z } from "zod";

import AuthButton from "@/components/forms/AuthButton";
import AuthInput from "@/components/forms/AuthInput";
import FormError from "@/components/forms/FormError";
import { useWallet } from "@/hooks/useWallet";

// ── Inline schema (no password needed – wallet IS the auth factor) ─────────
const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain letters, numbers, underscores, or hyphens"
    ),
  email: z
    .string()
    .max(254)
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  walletAddress: z
    .string()
    .regex(/^G[A-Z2-7]{55}$/, "Connect your Freighter wallet to continue"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const { isConnected, publicKey: walletPublicKey, connect, isInitializing } =
    useWallet();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const walletAddress = watch("walletAddress");

  // Sync wallet public key into form whenever it changes
  useEffect(() => {
    if (walletPublicKey) {
      setValue("walletAddress", walletPublicKey, { shouldValidate: true });
    }
  }, [walletPublicKey, setValue]);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch {
      setServerError("Failed to connect wallet. Is Freighter installed?");
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError("");

    const payload: Record<string, string> = {
      public_key: data.walletAddress,
      username: data.username,
    };
    if (data.email) payload.email = data.email;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        // Extract the human-readable error message from either response shape
        const msg =
          typeof json?.error === "string"
            ? json.error
            : (json?.error?.message ?? "Registration failed. Please try again.");
        setServerError(msg);
        return;
      }

      // Server set auth-token cookie → redirect straight to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  const walletLabel = (() => {
    if (walletAddress) {
      return `Connected: ${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
    }
    if (isInitializing) return "Connecting…";
    return "Connect Freighter Wallet";
  })();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      {/* Back link */}
      <Link
        href="/browse"
        className="absolute left-8 top-8 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Back to browse"
      >
        <ArrowLeftCircle className="h-8 w-8" />
      </Link>

      <div className="w-full max-w-md space-y-8">
        {/* Heading */}
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Step 1 – Wallet */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Stellar Wallet{" "}
                <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={isInitializing || isConnected}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Wallet className="h-4 w-4 shrink-0" />
                <span className="truncate">{walletLabel}</span>
              </button>
              {errors.walletAddress && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.walletAddress.message}
                </p>
              )}
            </div>

            {/* Step 2 – Username */}
            <AuthInput
              id="username"
              label="Username"
              type="text"
              placeholder="e.g. alice_xlm"
              autoComplete="username"
              error={errors.username?.message}
              register={register("username")}
            />

            {/* Step 3 – Email (optional) */}
            <AuthInput
              id="email"
              label="Email address (optional)"
              type="email"
              placeholder="alice@example.com"
              autoComplete="email"
              error={errors.email?.message}
              register={register("email")}
            />

            <FormError message={serverError} />

            <AuthButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Account
            </AuthButton>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="underline hover:text-gray-700 dark:hover:text-gray-200"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
