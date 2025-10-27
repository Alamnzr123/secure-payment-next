import { useState } from "react";
import { useRouter } from "next/router";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    setLoading(true);
    try {
      // client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const clientFieldErrors: Record<string, string> = {};
      if (!emailRegex.test(email)) clientFieldErrors.email = "Invalid email format";
      if (password.length < 8) clientFieldErrors.password = "Password must be at least 8 characters";
      if (Object.keys(clientFieldErrors).length > 0) {
        setFieldErrors(clientFieldErrors);
        setLoading(false);
        return;
      }
      const res = await register(email, password);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      if (res.error) throw new Error(res.error || "Registration failed");
      router.push("/finance/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  // expose same logic as a callable function for onClick handlers
  const submitRegistration = async () => {
    if (loading) return; // prevent double submit
    setError(null);
    setFieldErrors(null);
    setLoading(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const clientFieldErrors: Record<string, string> = {};
      if (!emailRegex.test(email)) clientFieldErrors.email = "Invalid email format";
      if (password.length < 8) clientFieldErrors.password = "Password must be at least 8 characters";
      if (Object.keys(clientFieldErrors).length > 0) {
        setFieldErrors(clientFieldErrors);
        setLoading(false);
        return;
      }
      const res = await register(email, password);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      if (res.error) throw new Error(res.error || "Registration failed");
      router.push("/finance/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleRegister} className="p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4">Register Finance Manager</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded w-full p-2" required />
          {fieldErrors?.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
        </div>
        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded w-full p-2" required />
          {fieldErrors?.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
        </div>
        <button
          type="button"
          className="bg-blue-500 text-white rounded p-2 w-full"
          disabled={loading}
          onClick={() => void submitRegistration()}
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </div>
  );
}
