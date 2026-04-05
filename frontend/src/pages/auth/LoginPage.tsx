import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log("🔐 Intentando login a:", `${API_URL}/auth/login`);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      localStorage.setItem('access_token', response.data.access_token);
      navigate("/dashboard");
    } catch (e: any) {
      console.error("❌ Error en login:", e);
      const msg = e.response?.data?.detail || e.message || "Error desconocido";
      if (e.code === "ERR_NETWORK" || e.message?.includes("localhost")) {
        setError("No se puede conectar al servidor. Verificá tu conexión o contactá soporte.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Ingresá para seguir automatizando liquidaciones.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="tu@estudio.com.ar" 
                className="h-12 border-slate-200 focus-visible:ring-emerald-500 shadow-sm"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                required
              />
              <Input 
                type="password" 
                placeholder="Contraseña" 
                className="h-12 border-slate-200 focus-visible:ring-emerald-500 shadow-sm"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="data-[state=checked]:bg-emerald-600 border-slate-300"/>
                <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
                  Mantenerme conectado
                </label>
              </div>
              
              <Link to="/forgot-password" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "Ingresar a la plataforma"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400">O continuá con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 border-slate-200 hover:bg-slate-50 font-medium shadow-sm">
              <FcGoogle className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" className="h-12 border-slate-200 hover:bg-slate-50 font-medium shadow-sm">
              <BsMicrosoft className="w-5 h-5 mr-2 text-[#00a4ef]" />
              Microsoft
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            ¿Nuevo en ComproScan?{" "}
            <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Creá tu cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
