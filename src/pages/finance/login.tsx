import { useState } from "react";
import { useRouter } from "next/router";
import { login } from "@/lib/api";

export default function FinanceLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const res = await login(email, password);
      if (res.error) throw new Error(res.error || "Login failed");
      router.push("/finance/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} className="p-6 rounded shadow-md">
        <h2 className="text-2xl mb-4">Finance Manager Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block mb-2" htmlFor="username">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded w-full p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded w-full p-2"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded p-2 w-full">
          Login
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Don&apos;t have an account?</p>
          <button
            type="button"
            onClick={() => router.push('/finance/register')}
            className="mt-2 underline text-blue-600"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
}